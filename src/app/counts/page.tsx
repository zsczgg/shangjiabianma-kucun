import { CountForm } from '@/components/count-form';
import { prisma } from '@/lib/db';
import { formatBeijingTime } from '@/lib/date-time';

export const dynamic = 'force-dynamic';
export default async function Counts() {
  const recent = await prisma.stockCount.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { items: true } });
  return <div className="page"><span className="eyebrow">STOCK COUNT</span><h1>库存盘点</h1><p className="sub">逐个扫描商品，录入实盘数量，完成后自动生成差异流水。</p><CountForm/><section className="history-section"><div className="section-heading"><h2>最近盘点</h2></div><div className="card">{recent.map((item) => <div className="history-row" key={item.id}><span className="mono">{item.countNo}</span><span>{item.items.length} 个 SKU</span><span>{formatBeijingTime(item.completedAt)}</span></div>)}{!recent.length && <div className="empty">暂无盘点记录</div>}</div></section></div>;
}
