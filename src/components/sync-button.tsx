'use client';
import { useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
export function SyncButton() { const [state,setState]=useState(''); async function sync(){setState('同步中…');const r=await fetch('/api/sync',{method:'POST'});const b=await r.json();setState(r.ok?`完成：${b.data.fetched} 个 SKU`:b.error.message);if(r.ok)setTimeout(()=>location.reload(),700)} return <div className="sync-action"><button className="primary" disabled={state==='同步中…'} onClick={sync}><IconRefresh/>立即同步</button>{state&&<small>{state}</small>}</div> }
