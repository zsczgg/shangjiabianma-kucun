import { prisma, ensureDefaults } from './db';

type ApiSku = {
  skuId: string; internalCode: string; spec: string; status: string; createdAt?: string;
  product: { name: string; brand?: string | null; category?: string | null; imageUrl?: string | null; status: string; updatedAt?: string };
  codes?: { manufacturerBarcode?: string | null; warehouseCode?: string | null; otherCodes?: unknown[] };
  platformMappings?: unknown[];
};

export async function syncCatalog(trigger: 'MANUAL' | 'SCHEDULED' = 'MANUAL') {
  const base = process.env.CATALOG_API_BASE_URL?.replace(/\/$/, '');
  const key = process.env.CATALOG_API_KEY;
  const run = await prisma.syncRun.create({ data: { trigger } });
  if (!base || !key) {
    const message = '尚未配置 CATALOG_API_BASE_URL 或 CATALOG_API_KEY';
    await prisma.syncRun.update({ where: { id: run.id }, data: { status: 'FAILED', errorMessage: message, finishedAt: new Date() } });
    throw new Error(message);
  }
  try {
    await ensureDefaults();
    let page = 1, totalPages = 1, fetched = 0, created = 0, updated = 0;
    do {
      const response = await fetch(`${base}/skus?page=${page}&pageSize=100&status=ALL`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
      if (!response.ok) throw new Error(`上游接口返回 HTTP ${response.status}`);
      const body = await response.json() as { success: boolean; data: ApiSku[]; meta: { totalPages: number }; error?: { message?: string } };
      if (!body.success || !Array.isArray(body.data)) throw new Error(body.error?.message || '上游响应格式不正确');
      totalPages = body.meta?.totalPages ?? 1;
      for (const item of body.data) {
        const existing = await prisma.catalogSku.findUnique({ where: { internalCode: item.internalCode }, select: { id: true } });
        const data = { upstreamSkuId: item.skuId, productName: item.product.name, brand: item.product.brand || null, category: item.product.category || null, spec: item.spec, imageUrl: item.product.imageUrl || null, productStatus: item.product.status, skuStatus: item.status, manufacturerBarcode: item.codes?.manufacturerBarcode || null, warehouseCode: item.codes?.warehouseCode || null, otherCodesJson: JSON.stringify(item.codes?.otherCodes || []), platformMappingsJson: JSON.stringify(item.platformMappings || []), upstreamUpdatedAt: item.product.updatedAt ? new Date(item.product.updatedAt) : null, lastSyncedAt: new Date() };
        const sku = await prisma.catalogSku.upsert({ where: { internalCode: item.internalCode }, update: data, create: { internalCode: item.internalCode, ...data } });
        if (!existing) { created++; const warehouse = await ensureDefaults(); await prisma.inventoryBalance.create({ data: { warehouseId: warehouse.id, skuId: sku.id } }); } else updated++;
      }
      fetched += body.data.length; page++;
    } while (page <= totalPages);
    return await prisma.syncRun.update({ where: { id: run.id }, data: { status: 'SUCCESS', fetched, created, updated, finishedAt: new Date() } });
  } catch (error) {
    await prisma.syncRun.update({ where: { id: run.id }, data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : '未知错误', finishedAt: new Date() } });
    throw error;
  }
}
