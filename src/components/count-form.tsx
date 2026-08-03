'use client';

import { KeyboardEvent, useCallback, useRef, useState } from 'react';
import { ScannerInput, ScannerInputHandle } from '@/components/scanner-input';

type Row = { internalCode: string; name: string; book: number; counted: number };

export function CountForm() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<ScannerInputHandle>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const focusScanner = useCallback(() => scannerRef.current?.focus(), []);
  const showError = useCallback((text: string) => { setSuccess(false); setMessage(text); }, []);

  async function add(code: string) {
    if (busy) return;
    const existing = rows.find((row) => row.internalCode === code);
    if (existing) {
      setSuccess(false); setMessage('该商品已在盘点单中，已为你定位');
      rowRefs.current[existing.internalCode]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowRefs.current[existing.internalCode]?.classList.add('scan-highlight');
      window.setTimeout(() => rowRefs.current[existing.internalCode]?.classList.remove('scan-highlight'), 1200);
      return focusScanner();
    }
    setBusy(true); setMessage('查询中…'); setSuccess(false);
    try {
      const response = await fetch(`/api/lookup?code=${encodeURIComponent(code)}`);
      const body = await response.json();
      if (!response.ok) return setMessage(body.error.message);
      const sku = body.data;
      const row = { internalCode: sku.internalCode, name: `${sku.productName} · ${sku.spec}`, book: sku.balances[0]?.quantity || 0, counted: sku.balances[0]?.quantity || 0 };
      const canonicalExisting = rows.find((item) => item.internalCode === row.internalCode);
      if (canonicalExisting) setMessage('该商品已在盘点单中，未重复添加');
      else { setRows((old) => [...old, row]); setMessage(`已加入：${sku.productName}`); setSuccess(true); }
    } finally { setBusy(false); focusScanner(); }
  }

  async function submit() {
    if (!confirm('完成盘点后将按实盘数调整库存，确定继续吗？')) return focusScanner();
    setBusy(true);
    try {
      const response = await fetch('/api/counts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: rows.map((row) => ({ internalCode: row.internalCode, countedQuantity: row.counted })) }) });
      const body = await response.json();
      setSuccess(response.ok); setMessage(response.ok ? `盘点完成：${body.data.countNo}` : body.error.message);
      if (response.ok) setRows([]);
    } finally { setBusy(false); focusScanner(); }
  }

  function quantityKey(event: KeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter') { event.preventDefault(); focusScanner(); } }

  return <div className="count-workbench">
    <ScannerInput ref={scannerRef} onScan={add} onInvalidInput={showError} busy={busy} placeholder="扫描商品加入盘点单" buttonLabel="加入盘点"/>
    {message && <div className={success ? 'notice success' : 'notice'}>{message}</div>}
    <div className="card"><table className="table"><thead><tr><th>商品</th><th>账面数量</th><th>实盘数量</th><th>差异</th><th></th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.internalCode} ref={(element) => { rowRefs.current[row.internalCode] = element; }}><td><b>{row.name}</b><small>{row.internalCode}</small></td><td>{row.book}</td><td><input className="count-input" aria-label={`${row.internalCode} 实盘数量`} type="number" min="0" step="1" value={row.counted} onChange={(event) => setRows(rows.map((item, position) => position === index ? { ...item, counted: Number(event.target.value) } : item))} onKeyDown={quantityKey}/></td><td className={row.counted - row.book < 0 ? 'negative' : row.counted - row.book > 0 ? 'positive' : ''}>{row.counted - row.book > 0 ? '+' : ''}{row.counted - row.book}</td><td><button className="text-button" onClick={() => { setRows(rows.filter((_, position) => position !== index)); focusScanner(); }}>移除</button></td></tr>)}</tbody></table>{!rows.length && <div className="empty">扫描商品开始本次盘点</div>}</div>
    {rows.length > 0 && <div className="submit-bar"><span>本次共盘点 {rows.length} 个 SKU</span><button className="primary" disabled={busy} onClick={() => void submit()}>完成盘点并调整库存</button></div>}
  </div>;
}
