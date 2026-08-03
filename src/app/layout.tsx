import './globals.css';
import Link from 'next/link';
import { IconBuildingWarehouse, IconDashboard, IconPackage, IconScan, IconArrowsExchange, IconClipboardCheck, IconAlertTriangle, IconSettings, IconWifi } from '@tabler/icons-react';

export const metadata = { title: '商品库库存管理', description: '独立商品库库存管理系统' };
const links = [['/', IconDashboard, '库存看板'], ['/inventory', IconPackage, '商品库存'], ['/scan', IconScan, '扫码出入库'], ['/movements', IconArrowsExchange, '库存流水'], ['/counts', IconClipboardCheck, '库存盘点'], ['/alerts', IconAlertTriangle, '低库存预警'], ['/configuration', IconSettings, '配置中心']] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><div className="shell"><aside><Link className="brand" href="/"><span className="brandmark"><IconBuildingWarehouse/></span><span>商品库库存<small>INVENTORY CONTROL</small></span></Link><nav>{links.map(([href, Icon, label]) => <Link key={href} href={href}><Icon/>{label}</Link>)}</nav><div className="aside-foot"><IconWifi/><span>主仓库在线<small>LOCAL · SQLITE</small></span></div></aside><main><header><div><b>媛媛和小肥朱 · 库存中心</b><span>独立库存账本 · 商品资料只读同步</span></div><Link className="scan-btn" href="/scan"><IconScan/> 开始扫码</Link></header>{children}</main></div></body></html>;
}
