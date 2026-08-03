import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDefaults } from '@/lib/db';

function validThreshold(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999999) throw new Error('预警阈值必须是 0 到 999999 的整数');
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const warehouse = await ensureDefaults();
    const globalSetting = await prisma.appSetting.findUnique({ where: { key: 'defaultLowStockThreshold' } });
    const globalThreshold = Number(globalSetting?.value || 5);

    if (body.scope === 'GLOBAL') {
      const threshold = validThreshold(body.threshold);
      await prisma.$transaction([
        prisma.appSetting.upsert({ where: { key: 'defaultLowStockThreshold' }, update: { value: String(threshold) }, create: { key: 'defaultLowStockThreshold', value: String(threshold) } }),
        prisma.inventoryBalance.updateMany({ where: { warehouseId: warehouse.id, usesDefaultThreshold: true }, data: { lowStockThreshold: threshold } }),
      ]);
      return NextResponse.json({ success: true, data: { threshold } });
    }

    if (body.scope === 'SKU') {
      const sku = await prisma.catalogSku.findUnique({ where: { internalCode: String(body.internalCode || '') } });
      if (!sku) throw new Error('未找到该 SKU');
      const useDefault = Boolean(body.useDefault);
      const threshold = useDefault ? globalThreshold : validThreshold(body.threshold);
      const balance = await prisma.inventoryBalance.upsert({
        where: { warehouseId_skuId: { warehouseId: warehouse.id, skuId: sku.id } },
        update: { lowStockThreshold: threshold, usesDefaultThreshold: useDefault },
        create: { warehouseId: warehouse.id, skuId: sku.id, lowStockThreshold: threshold, usesDefaultThreshold: useDefault },
      });
      return NextResponse.json({ success: true, data: balance });
    }
    throw new Error('阈值设置范围无效');
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : '阈值保存失败' } }, { status: 400 });
  }
}
