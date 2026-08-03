'use client';

import { KeyboardEvent, useCallback, useRef, useState } from 'react';
import { ScannerInput, ScannerInputHandle } from '@/components/scanner-input';

type Sku = { internalCode: string; productName: string; spec: string; balances: { quantity: number }[] };

export function StockForm() {
  const [sku, setSku] = useState<Sku | null>(null);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<ScannerInputHandle>(null);

  const focusScanner = useCallback(() => scannerRef.current?.focus(), []);
  const showError = useCallback((text: string) => { setSuccess(false); setMessage(text); }, []);

  async function lookup(code: string) {
    if (busy) return;
    setBusy(true); setMessage('查询中…'); setSuccess(false);
    try {
      const response = await fetch(`/api/lookup?code=${encodeURIComponent(code)}`);
      const body = await response.json();
      setSku(response.ok ? body.data : null);
      setMessage(response.ok ? '' : body.error.message);
    } finally { setBusy(false); focusScanner(); }
  }

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
      setSuccess(response.ok);
      setMessage(response.ok ? `操作成功，当前库存 ${body.data.balanceAfter}；可继续扫描下一个商品` : body.error.message);
      if (response.ok) { setSku({ ...sku, balances: [{ quantity: body.data.balanceAfter }] }); setQty(1); }
    } finally { setBusy(false); scannerRef.current?.clear(); focusScanner(); }
  }

  function quantityKey(event: KeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }
  function switchType(next: 'IN' | 'OUT') { setType(next); focusScanner(); }

  return <div className="scan-workbench">
    <ScannerInput ref={scannerRef} onScan={lookup} onInvalidInput={showError} busy={busy} placeholder="扫描或输入任意商品编码"/>
    {message && <div className={success ? 'notice success' : 'notice'}>{message}</div>}
    {sku && <section className="scan-result">
      <div><span className="eyebrow">MATCHED SKU</span><h2>{sku.productName}</h2><p>{sku.spec} · <span className="code">{sku.internalCode}</span></p></div>
      <strong className={(sku.balances[0]?.quantity || 0) < 0 ? 'negative' : ''}>{sku.balances[0]?.quantity || 0}<small>当前库存</small></strong>
      <div className="stock-controls">
        <div className="segmented"><button type="button" className={type === 'IN' ? 'active' : ''} onClick={() => switchType('IN')}>入库</button><button type="button" className={type === 'OUT' ? 'active out' : ''} onClick={() => switchType('OUT')}>出库</button></div>
        <div className="quantity-field"><label>本次数量</label><input aria-label="本次数量" type="number" min="1" step="1" value={qty} onChange={(event) => setQty(Number(event.target.value))} onKeyDown={quantityKey}/><small>按 Enter 可直接提交</small></div>
        <button type="button" className="primary" disabled={busy} onClick={() => void submit()}>{type === 'IN' ? '确认入库' : '确认出库'}</button>
      </div>
    </section>}
  </div>;
}
