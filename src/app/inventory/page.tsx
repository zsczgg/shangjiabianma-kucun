import Link from 'next/link';
import { prisma, ensureDefaults } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function Inventory({ searchParams }: { searchParams: { q?: string } }) {
  await ensureDefaults();
  const q = searchParams.q?.trim();
  const items = await prisma.inventoryBalance.findMany({ where: q ? { OR: [{ sku: { productName: { contains: q } } }, { sku: { internalCode: { contains: q } } }, { sku: { manufacturerBarcode: { contains: q } } }] } : undefined, include: { sku: true, warehouse: true }, orderBy: { sku: { internalCode: 'asc' } } });
  return <div className="page"><span className="eyebrow">STOCK ON HAND</span><h1>商品库存</h1><p className="sub">按永久内部编码查看主仓库实时余额；预警阈值请前往 <Link href="/configuration">配置中心</Link> 统一管理。</p><form className="toolbar"><input className="search" name="q" defaultValue={q} placeholder="搜索商品、内部编码或厂家条码…"/></form><div className="card">{items.length ? <table className="table"><thead><tr><th>内部编码</th><th>商品 / 规格</th><th>状态</th><th>当前库存</th><th>预警线</th><th>同步时间</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><span className="code">{item.sku.internalCode}</span></td><td><b>{item.sku.productName}</b><small>{item.sku.brand || '未设置品牌'} · {item.sku.spec}</small></td><td><span className={item.sku.skuStatus === 'ACTIVE' ? 'status-dot active' : 'status-dot'}>{item.sku.skuStatus === 'ACTIVE' ? '使用中' : '已停用'}</span></td><td><strong className={`quantity ${item.quantity <= item.lowStockThreshold ? 'low' : ''}`}>{item.quantity}</strong></td><td><span className="threshold-readonly"><b>{item.lowStockThreshold}</b><small>{item.usesDefaultThreshold ? '全局默认' : '商品独立'}</small></span></td><td>{item.sku.lastSyncedAt.toLocaleString('zh-CN')}</td></tr>)}</tbody></table> : <div className="empty">暂无商品，请先同步商品库</div>}</div></div>;
}
