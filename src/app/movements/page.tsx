import { prisma } from '@/lib/db';
import { formatBeijingTime } from '@/lib/date-time';

export const dynamic = 'force-dynamic';
export default async function Movements({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type;
  const rows = await prisma.stockMovement.findMany({ where: type ? { type } : undefined, take: 300, orderBy: { createdAt: 'desc' }, include: { sku: true } });
  return <div className="page"><span className="eyebrow">AUDIT TRAIL</span><h1>库存流水</h1><p className="sub">余额变化的完整证据链，流水创建后不可修改；时间均为北京时间。</p><div className="filter-row">{[['', '全部'], ['IN', '入库'], ['OUT', '出库'], ['COUNT', '盘点']].map(([value, name]) => <a className={(type || '') === value ? 'active' : ''} href={`/movements${value ? `?type=${value}` : ''}`} key={value}>{name}</a>)}</div><div className="card"><table className="table"><thead><tr><th>流水号 / 北京时间</th><th>商品</th><th>业务类型</th><th>变动数量</th><th>变动前 → 变动后</th><th>备注</th></tr></thead><tbody>{rows.map((movement) => <tr key={movement.id}><td><span className="mono">{movement.movementNo}</span><small>{formatBeijingTime(movement.createdAt)}</small></td><td><b>{movement.sku.productName}</b><small>{movement.sku.internalCode} · {movement.sku.spec}</small></td><td><span className={`movement ${movement.type.toLowerCase()}`}>{movement.type === 'IN' ? '入库' : movement.type === 'OUT' ? '出库' : '盘点调整'}</span></td><td className={movement.quantity < 0 ? 'negative' : 'positive'}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</td><td>{movement.balanceBefore} → <b>{movement.balanceAfter}</b></td><td>{movement.note || movement.referenceNo || '—'}</td></tr>)}</tbody></table>{!rows.length && <div className="empty">暂无流水</div>}</div></div>;
}
