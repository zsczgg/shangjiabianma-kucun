'use client';
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

type Sku = { internalCode: string; productName: string; spec: string; skuStatus: string; productStatus: string; balances: { quantity: number }[] };

export function StockForm() {
  const [code, setCode] = useState('');
  const [sku, setSku] = useState<Sku | null>(null);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef('');

  const updateCode = useCallback((value: string) => { codeRef.current = value; setCode(value); }, []);
  const focusScanner = useCallback(() => { window.setTimeout(() => scanRef.current?.focus(), 30); }, []);

  const lookupCode = useCallback(async (rawCode: string) => {
    const scanned = rawCode.trim();
    updateCode('');
    focusScanner();
    if (!scanned || busy) return;
    setBusy(true); setMessage('查询中…');
    try {
      const response = await fetch(`/api/lookup?code=${encodeURIComponent(scanned)}`);
      const body = await response.json();
      setSku(response.ok ? body.data : null);
      setMessage(response.ok ? '' : body.error.message);
    } finally { setBusy(false); focusScanner(); }
  }, [busy, focusScanner, updateCode]);

  useEffect(() => { focusScanner(); }, [focusScanner]);
  useEffect(() => {
    function captureScanner(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editable = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (editable) return;
      if (event.key === 'Enter') { event.preventDefault(); void lookupCode(codeRef.current); return; }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); updateCode(codeRef.current + event.key); scanRef.current?.focus();
      }
    }
    window.addEventListener('keydown', captureScanner);
    return () => window.removeEventListener('keydown', captureScanner);
  }, [lookupCode, updateCode]);

  async function submit(confirmNegative = false) {
    if (!sku || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/stock', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ internalCode: sku.internalCode, type, quantity: qty, confirmNegative }) });
      const body = await response.json();
      if (!response.ok && body.error.requiresConfirmation) {
        setBusy(false);
        if (confirm(`${body.error.message}\n确定继续出库吗？`)) return submit(true);
        return focusScanner();
      }
      setMessage(response.ok ? `操作成功，当前库存 ${body.data.balanceAfter}；可继续扫描下一个商品` : body.error.message);
      if (response.ok) { setSku({ ...sku, balances: [{ quantity: body.data.balanceAfter }] }); setQty(1); }
    } finally { setBusy(false); updateCode(''); focusScanner(); }
  }

  function lookup(event: FormEvent) { event.preventDefault(); void lookupCode(codeRef.current); }
  function scanKey(event: ReactKeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter') { event.preventDefault(); void lookupCode(codeRef.current); } }
  function quantityKey(event: ReactKeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }
  function switchType(next: 'IN' | 'OUT') { setType(next); focusScanner(); }

  return <div className="scan-workbench">
    <form onSubmit={lookup} className="scan-bar">
      <input ref={scanRef} value={code} onChange={(event) => updateCode(event.target.value)} onKeyDown={scanKey} placeholder="扫描或输入任意商品编码" autoComplete="off"/>
      <button disabled={busy}>{busy ? '处理中…' : '识别'}</button>
    </form>
    <div className="scanner-ready"><span></span>扫码框持续待命；操作完成后无需手动点击</div>
    {message && <div className={message.includes('成功') ? 'notice success' : 'notice'}>{message}</div>}
    {sku && <section className="scan-result"><div><span className="eyebrow">MATCHED SKU</span><h2>{sku.productName}</h2><p>{sku.spec} · <span className="code">{sku.internalCode}</span></p></div><strong className={(sku.balances[0]?.quantity || 0) < 0 ? 'negative' : ''}>{sku.balances[0]?.quantity || 0}<small>当前库存</small></strong>
      <div className="stock-controls"><div className="segmented"><button type="button" className={type === 'IN' ? 'active' : ''} onClick={() => switchType('IN')}>入库</button><button type="button" className={type === 'OUT' ? 'active out' : ''} onClick={() => switchType('OUT')}>出库</button></div><div className="quantity-field"><label>本次数量</label><input aria-label="本次数量" type="number" min="1" step="1" value={qty} onChange={(event) => setQty(Number(event.target.value))} onKeyDown={quantityKey}/><small>按 Enter 可直接提交</small></div><button type="button" className="primary" disabled={busy} onClick={() => void submit()}>{type === 'IN' ? '确认入库' : '确认出库'}</button></div>
    </section>}
  </div>;
}
