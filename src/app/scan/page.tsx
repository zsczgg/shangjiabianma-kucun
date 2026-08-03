import { StockForm } from '@/components/stock-form';
export default function Scan(){return <div className="page scan-page"><span className="eyebrow">SCAN WORKBENCH</span><h1>扫码入库 / 出库</h1><p className="sub">扫描内部编码、厂家条码、仓配编码或平台编码，回车即可识别。</p><StockForm/><div className="scan-tips"><b>操作提示</b><span>扫描枪请使用“回车”结束符</span><span>停用商品不能继续入库</span><span>每次操作都会写入不可修改的库存流水</span></div></div>}
