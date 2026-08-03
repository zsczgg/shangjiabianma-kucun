import { SettingsForm } from '@/components/settings-form';
import { CatalogKeyForm } from '@/components/catalog-key-form';
import { ThresholdSettings } from '@/components/threshold-settings';
import { SyncButton } from '@/components/sync-button';
import { prisma, ensureDefaults } from '@/lib/db';
import { getCatalogKeyStatus } from '@/lib/catalog-config';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  await ensureDefaults();
  const [policy, threshold, last, keyStatus] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'negativeStockPolicy' } }),
    prisma.appSetting.findUnique({ where: { key: 'defaultLowStockThreshold' } }),
    prisma.syncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    getCatalogKeyStatus(),
  ]);
  return <div className="page"><span className="eyebrow">SYSTEM PREFERENCES</span><h1>系统设置</h1><p className="sub">控制库存规则、预警阈值和上游连接凭据。</p>
    <div className="settings-stack">
      <section className="card settings-card"><h2>负库存策略</h2><p>决定出库数量超过当前库存时的系统行为。</p><SettingsForm current={policy?.value || 'STRICT'}/></section>
      <section className="card settings-card"><h2>低库存预警</h2><p>设置新商品和未单独覆盖商品的默认预警线。</p><ThresholdSettings current={Number(threshold?.value || 5)}/></section>
      <section className="card settings-card"><div className="setting-heading"><div><h2>商品同步与 API Key</h2><p>Key 先验证后加密保存，服务器环境变量保留为备用。</p></div><SyncButton/></div><dl className="setting-list"><div><dt>自动同步周期</dt><dd>{process.env.SYNC_INTERVAL_MINUTES || 15} 分钟</dd></div><div><dt>上游地址</dt><dd>{process.env.CATALOG_API_BASE_URL ? '已配置' : '未配置'}</dd></div><div><dt>最近结果</dt><dd>{last?.status || '尚未同步'}</dd></div></dl><CatalogKeyForm configured={keyStatus.configured} suffix={keyStatus.suffix} source={keyStatus.source}/></section>
    </div>
  </div>;
}
