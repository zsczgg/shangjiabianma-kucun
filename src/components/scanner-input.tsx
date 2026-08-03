'use client';

import { FormEvent, forwardRef, KeyboardEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { isScannerCharacter, isScannerValue } from '@/lib/scanner';

export type ScannerInputHandle = { focus: () => void; clear: () => void };

type Props = {
  onScan: (code: string) => void | Promise<void>;
  onInvalidInput: (message: string) => void;
  busy?: boolean;
  placeholder: string;
  buttonLabel?: string;
};

export const ScannerInput = forwardRef<ScannerInputHandle, Props>(function ScannerInput(
  { onScan, onInvalidInput, busy = false, placeholder, buttonLabel = '识别' },
  forwardedRef,
) {
  const [value, setValue] = useState('');
  const valueRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);

  const update = useCallback((next: string) => { valueRef.current = next; setValue(next); }, []);
  const focus = useCallback(() => window.setTimeout(() => inputRef.current?.focus(), 30), []);
  const rejectIme = useCallback(() => {
    update('');
    onInvalidInput('检测到中文输入法内容，请切换为英文输入法后重新扫描');
    focus();
  }, [focus, onInvalidInput, update]);
  const submit = useCallback(() => {
    if (composingRef.current) return rejectIme();
    const code = valueRef.current.trim();
    update('');
    focus();
    if (code) void onScan(code);
  }, [focus, onScan, rejectIme, update]);

  useImperativeHandle(forwardedRef, () => ({ focus, clear: () => update('') }), [focus, update]);
  useEffect(() => { focus(); }, [focus]);
  useEffect(() => {
    function capture(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Enter') { event.preventDefault(); submit(); return; }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (!isScannerCharacter(event.key)) return rejectIme();
        update(valueRef.current + event.key);
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', capture);
    return () => window.removeEventListener('keydown', capture);
  }, [rejectIme, submit, update]);

  function change(next: string) {
    if (!isScannerValue(next)) return rejectIme();
    update(next);
  }
  function formSubmit(event: FormEvent) { event.preventDefault(); submit(); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') { event.preventDefault(); submit(); }
  }

  return <>
    <form onSubmit={formSubmit} className="scan-bar">
      <input
        ref={inputRef}
        lang="en"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(event) => change(event.target.value)}
        onKeyDown={keyDown}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; rejectIme(); }}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button disabled={busy}>{busy ? '处理中…' : buttonLabel}</button>
    </form>
    <div className="scanner-ready"><span></span>扫码框持续待命 · 仅接收英文、数字及条码符号</div>
  </>;
});
