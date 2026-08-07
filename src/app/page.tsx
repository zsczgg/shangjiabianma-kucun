import Link from 'next/link';
import { IconPackage, IconBox, IconAlertTriangle, IconArrowsExchange } from '@tabler/icons-react';
import { prisma, ensureDefaults } from '@/lib/db';
import { SyncButton } from '@/components/sync-button';
import { beijingDateKey, formatBeijingTime } from '@/lib/date-time';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  await ensureDefaults();
  const [skuCount, balances, recent, lastSync, allBalances] = await Promise.all([
    prisma.catalogSku.count(),
    prisma.inventoryBalance.aggregate({ _sum: { quantity: true } }),
    prisma.stockMovement.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { sku: true } }),
    prisma.syncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.inventoryBalance.findMany(),
  ]);
  const lowCount = allBalances.filter((item) => item.quantity <= item.lowStockThreshold).length;
  const today = beijingDateKey(new Date());
  const todayCount = recent.filter((item) => beijingDateKey(item.createdAt) === today).length;

  return <div className="page dashboard">
    <section className="hero">
      <div><span className="eyebrow">WAREHOUSE OVERVIEW</span><h1>主仓库，今天一切有数。</h1><p>商品资料来自编码系统，库存账本独立记录。</p></div>
      <SyncButton />
    </section>
    <section className="stats">
      <div className="stat"><IconPackage/><div><span>同步 SKU</span><strong>{skuCount}</strong><em>永久关联 internalCode</em></div></div>
      <div className="stat"><IconBox/><div><span>库存总件数</span><strong>{balances._sum.quantity || 0}</strong><em>主仓库实时余额</em></div></div>
      <div className="stat danger"><IconAlertTriangle/><div><span>低库存项目</span><strong>{lowCount}</strong><em>含零库存与负库存</em></div></div>
      <div className="stat"><IconArrowsExchange/><div><span>今日流水</span><strong>{todayCount}</strong><em>所有变动均可追溯</em></div></div>
    </section>
    <section className="two-col">
      <div>
        <div className="section-heading"><div><span className="eyebrow">RECENT MOVEMENTS</span><h2>最近库存流水</h2></div><Link href="/movements">查看全部 →</Link></div>
        <div className="card">{recent.length ? <table className="table"><thead><tr><th>北京时间</th><th>商品</th><th>类型</th><th>变动</th><th>结存</th></tr></thead><tbody>{recent.map((item) => <tr key={item.id}><td>{formatBeijingTime(item.createdAt)}</td><td><b>{item.sku.productName}</b><small>{item.sku.internalCode} · {item.sku.spec}</small></td><td><span className={`movement ${item.type.toLowerCase()}`}>{item.type === 'IN' ? '入库' : item.type === 'OUT' ? '出库' : '盘点'}</span></td><td className={item.quantity < 0 ? 'negative' : 'positive'}>{item.quantity > 0 ? '+' : ''}{item.quantity}</td><td>{item.balanceAfter}</td></tr>)}</tbody></table> : <div className="empty">还没有库存流水，从扫码入库开始吧</div>}</div>
      </div>
      <aside className="sync-card">
        <span className="eyebrow">CATALOG LINK</span><h2>商品同步状态</h2><div className={`sync-orb ${lastSync?.status === 'FAILED' ? 'failed' : ''}`}></div>
        <strong>{lastSync?.status === 'SUCCESS' ? '同步正常' : lastSync?.status === 'FAILED' ? '同步失败' : '等待首次同步'}</strong>
        <p>{lastSync?.finishedAt ? formatBeijingTime(lastSync.finishedAt) : '配置 API 后点击立即同步'}</p>
        {lastSync?.errorMessage && <div className="notice">{lastSync.errorMessage}</div>}
        <dl><div><dt>默认周期</dt><dd>15 分钟</dd></div><div><dt>最近读取</dt><dd>{lastSync?.fetched || 0} SKU</dd></div></dl>
      </aside>
    </section>
  </div>;
}
