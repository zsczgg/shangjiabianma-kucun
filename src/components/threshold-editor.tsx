'use client';
import { useState } from 'react';

export function ThresholdEditor({ internalCode, initial, usesDefault }: { internalCode: string; initial: number; usesDefault: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [isDefault, setIsDefault] = useState(usesDefault);
  const [message, setMessage] = useState('');
  async function save(useDefault = false) {
    const response = await fetch('/api/thresholds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'SKU', internalCode, threshold: value, useDefault }) });
    const body = await response.json();
    if (!response.ok) return setMessage(body.error.message);
    setValue(body.data.lowStockThreshold); setIsDefault(body.data.usesDefaultThreshold); setEditing(false); setMessage('');
  }
  if (!editing) return <button className="threshold-display" title="点击修改预警阈值" onClick={() => setEditing(true)}><b>{value}</b><small>{isDefault ? '默认' : '单独'}</small></button>;
  return <div className="threshold-editor"><input aria-label={`${internalCode} 预警阈值`} type="number" min="0" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))}/><button onClick={() => save(false)}>保存</button>{!isDefault && <button onClick={() => save(true)}>恢复默认</button>}<button onClick={() => setEditing(false)}>取消</button>{message && <small>{message}</small>}</div>;
}
