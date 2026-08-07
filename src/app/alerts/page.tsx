import { ProductThumbnail } from '@/components/product-thumbnail';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function Alerts() {
  const all = await prisma.inventoryBalance.findMany({ include: { sku: true }, orderBy: { quantity: 'asc' } });
  const rows = all.filter((item) => item.quantity <= item.lowStockThreshold);
  return <div className="page"><span className="eyebrow">REPLENISHMENT SIGNAL</span><h1>低库存预警</h1><p className="sub">库存到达预警线时集中呈现，负库存置顶。</p><div className="alert-summary"><strong>{rows.length}</strong><span>个 SKU 需要关注</span></div><div className="card">{rows.length ? <table className="table"><thead><tr><th>风险</th><th>商品</th><th>内部编码</th><th>当前库存</th><th>预警线</th><th>建议</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><span className={`risk ${item.quantity < 0 ? 'critical' : ''}`}>{item.quantity < 0 ? '负库存' : item.quantity === 0 ? '缺货' : '库存偏低'}</span></td><td><div className="product-cell"><ProductThumbnail src={item.sku.imageUrl} name={item.sku.productName}/><div><b>{item.sku.productName}</b><small>{item.sku.spec}</small></div></div></td><td><span className="code">{item.sku.internalCode}</span></td><td><strong className="quantity low">{item.quantity}</strong></td><td>{item.lowStockThreshold}</td><td>{item.quantity < 0 ? `至少补充 ${Math.abs(item.quantity) + item.lowStockThreshold} 件` : `建议补至 ${item.lowStockThreshold * 2} 件`}</td></tr>)}</tbody></table> : <div className="empty">库存健康，暂无预警</div>}</div></div>;
}
