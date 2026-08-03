import { SettingsForm } from '@/components/settings-form';
import { CatalogKeyForm } from '@/components/catalog-key-form';
import { ThresholdEditor } from '@/components/threshold-editor';
import { ThresholdSettings } from '@/components/threshold-settings';
import { SyncButton } from '@/components/sync-button';
import { prisma, ensureDefaults } from '@/lib/db';
import { getCatalogKeyStatus } from '@/lib/catalog-config';

export const dynamic = 'force-dynamic';

export default async function Configuration({ searchParams }: { searchParams: { skuq?: string } }) {
  await ensureDefaults();
  const skuq = searchParams.skuq?.trim();
  const skuWhere = skuq ? { OR: [{ sku: { productName: { contains: skuq } } }, { sku: { internalCode: { contains: skuq } } }, { sku: { manufacturerBarcode: { contains: skuq } } }] } : undefined;
  const [policy, threshold, last, keyStatus, balances] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'negativeStockPolicy' } }),
    prisma.appSetting.findUnique({ where: { key: 'defaultLowStockThreshold' } }),
    prisma.syncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    getCatalogKeyStatus(),
    prisma.inventoryBalance.findMany({ where: skuWhere, include: { sku: true }, orderBy: { sku: { internalCode: 'asc' } }, take: skuq ? 100 : 30 }),
  ]);

  return <div className="page configuration-page">
    <span className="eyebrow">CONFIGURATION CENTER</span><h1>配置中心</h1><p className="sub">库存规则、预警阈值和商品同步连接统一在这里管理。</p>
    <div className="settings-stack">
      <section className="card settings-card"><h2>出库策略</h2><p>决定出库数量超过当前库存时的系统行为。</p><SettingsForm current={policy?.value || 'STRICT'}/></section>
      <section className="card settings-card"><h2>低库存全局设置</h2><p>未单独设置的商品均跟随这个默认预警阈值。</p><ThresholdSettings current={Number(threshold?.value || 5)}/></section>
      <section className="card settings-card threshold-catalog">
        <div className="setting-heading"><div><h2>商品独立预警阈值</h2><p>可为指定商品覆盖全局值，或随时恢复跟随默认值。</p></div></div>
        <form className="toolbar" action="/configuration"><input className="search" name="skuq" defaultValue={skuq} placeholder="搜索商品、内部编码或厂家条码…"/></form>
        <div className="configuration-table"><table className="table"><thead><tr><th>商品</th><th>内部编码</th><th>当前库存</th><th>预警阈值</th></tr></thead><tbody>{balances.map((item) => <tr key={item.id}><td><b>{item.sku.productName}</b><small>{item.sku.spec}</small></td><td><span className="code">{item.sku.internalCode}</span></td><td><strong className={`quantity ${item.quantity <= item.lowStockThreshold ? 'low' : ''}`}>{item.quantity}</strong></td><td><ThresholdEditor internalCode={item.sku.internalCode} initial={item.lowStockThreshold} usesDefault={item.usesDefaultThreshold}/></td></tr>)}</tbody></table>{!balances.length && <div className="empty">没有找到匹配商品</div>}</div>
        {!skuq && balances.length === 30 && <small className="security-hint">默认显示前 30 个商品，使用搜索可快速定位其他商品。</small>}
      </section>
      <section className="card settings-card"><div className="setting-heading"><div><h2>商品同步与 API Key</h2><p>Key 验证通过后加密保存，服务器环境变量保留为备用。</p></div><SyncButton/></div><dl className="setting-list"><div><dt>自动同步周期</dt><dd>{process.env.SYNC_INTERVAL_MINUTES || 15} 分钟</dd></div><div><dt>上游地址</dt><dd>{process.env.CATALOG_API_BASE_URL ? '已配置' : '未配置'}</dd></div><div><dt>最近结果</dt><dd>{last?.status || '尚未同步'}</dd></div></dl><CatalogKeyForm configured={keyStatus.configured} suffix={keyStatus.suffix} source={keyStatus.source}/></section>
    </div>
  </div>;
}
