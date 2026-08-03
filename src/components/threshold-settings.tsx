'use client';
import { useState } from 'react';

export function ThresholdSettings({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  const [message, setMessage] = useState('');
  async function save() {
    const response = await fetch('/api/thresholds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: 'GLOBAL', threshold: value }) });
    const body = await response.json();
    setMessage(response.ok ? '全局默认阈值已保存' : body.error.message);
  }
  return <div className="inline-setting"><div className="field"><label>默认预警阈值</label><input type="number" min="0" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))}/></div><button className="primary" onClick={save}>保存默认值</button>{message && <span className="save-message">{message}</span>}<small>仅更新仍使用默认值的 SKU，不覆盖单独设置。</small></div>;
}
