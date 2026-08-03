'use client';
import { useState } from 'react';

export function CatalogKeyForm({ configured, suffix, source }: { configured: boolean; suffix: string | null; source: string }) {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!apiKey.trim()) return setMessage('请输入新的 API Key');
    setSaving(true); setMessage('正在验证新 Key…');
    const response = await fetch('/api/catalog-key', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(body.error.message);
    setApiKey(''); setMessage('新 API Key 已验证并安全保存');
  }
  return <div className="credential-editor">
    <div className="credential-status"><span className={configured ? 'status-dot active' : 'status-dot'}>{configured ? `已配置${suffix ? ` · ••••${suffix}` : ''}` : '未配置'}</span><small>{source === 'DATABASE' ? '页面安全配置' : source === 'ENVIRONMENT' ? '服务器备用配置' : '无可用密钥'}</small></div>
    <div className="secret-input"><input type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="输入新 API Key（保存后不再显示）"/><button className="primary" disabled={saving} onClick={save}>{saving ? '验证中…' : '验证并替换'}</button></div>
    {message && <div className={message.includes('已验证') ? 'notice success' : 'notice'}>{message}</div>}
    <small className="security-hint">只有验证成功才会覆盖旧 Key；完整密钥不会回显或写入日志。</small>
  </div>;
}
