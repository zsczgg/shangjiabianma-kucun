export {};
const interval = Math.max(1, Number(process.env.SYNC_INTERVAL_MINUTES || 15)) * 60_000;
const url = `${(process.env.INTERNAL_APP_URL || 'http://app:3220').replace(/\/$/, '')}/api/sync`;
async function run() {
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'x-internal-sync-token': process.env.INTERNAL_SYNC_TOKEN || '' } });
    const text = await response.text();
    console.log(new Date().toISOString(), response.ok ? '同步完成' : '同步失败', text);
  } catch (error) { console.error(new Date().toISOString(), '同步请求失败', error); }
}
console.log(`同步进程已启动，每 ${interval / 60_000} 分钟执行`);
await run();
setInterval(run, interval);
