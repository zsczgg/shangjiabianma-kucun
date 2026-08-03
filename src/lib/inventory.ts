import { Prisma, StockMovement } from '@prisma/client';
import { prisma, ensureDefaults } from './db';

export type MovementInput = {
  internalCode: string;
  type: 'IN' | 'OUT';
  quantity: number;
  referenceNo?: string;
  note?: string;
  confirmNegative?: boolean;
};

export class InventoryError extends Error {
  constructor(public code: string, message: string, public requiresConfirmation = false) { super(message); }
}

export function nextBalance(current: number, type: 'IN' | 'OUT', quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new InventoryError('INVALID_QUANTITY', '数量必须是大于 0 的整数');
  return type === 'IN' ? current + quantity : current - quantity;
}

function movementNo(type: string) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `${type}-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function changeStock(input: MovementInput): Promise<StockMovement> {
  const warehouse = await ensureDefaults();
  const sku = await prisma.catalogSku.findUnique({ where: { internalCode: input.internalCode } });
  if (!sku) throw new InventoryError('SKU_NOT_FOUND', '未找到该商品，请先同步商品库');
  if ((sku.skuStatus !== 'ACTIVE' || sku.productStatus !== 'ACTIVE') && input.type === 'IN') {
    throw new InventoryError('SKU_INACTIVE', '该商品或规格已停用，不能创建新入库记录');
  }
  const setting = await prisma.appSetting.findUnique({ where: { key: 'negativeStockPolicy' } });
  const policy = setting?.value ?? 'STRICT';

  return prisma.$transaction(async (tx) => {
    const balance = await tx.inventoryBalance.upsert({
      where: { warehouseId_skuId: { warehouseId: warehouse.id, skuId: sku.id } },
      update: {}, create: { warehouseId: warehouse.id, skuId: sku.id },
    });
    const after = nextBalance(balance.quantity, input.type, input.quantity);
    if (after < 0 && policy === 'STRICT') throw new InventoryError('INSUFFICIENT_STOCK', `库存不足，当前可用 ${balance.quantity}`);
    if (after < 0 && policy === 'CONFIRM' && !input.confirmNegative) {
      throw new InventoryError('NEGATIVE_CONFIRMATION_REQUIRED', `本次出库后库存将为 ${after}，需要二次确认`, true);
    }
    await tx.inventoryBalance.update({ where: { id: balance.id }, data: { quantity: after } });
    return tx.stockMovement.create({ data: {
      movementNo: movementNo(input.type), warehouseId: warehouse.id, skuId: sku.id,
      type: input.type, quantity: input.type === 'IN' ? input.quantity : -input.quantity,
      balanceBefore: balance.quantity, balanceAfter: after,
      referenceNo: input.referenceNo?.trim() || null, note: input.note?.trim() || null,
    }});
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function completeCount(items: { internalCode: string; countedQuantity: number }[], note?: string) {
  const warehouse = await ensureDefaults();
  if (!items.length) throw new InventoryError('EMPTY_COUNT', '盘点单至少需要一个商品');
  return prisma.$transaction(async tx => {
    const countNo = `PD-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
    const count = await tx.stockCount.create({ data: { countNo, warehouseId: warehouse.id, note, status: 'COMPLETED', completedAt: new Date() } });
    for (const item of items) {
      if (!Number.isInteger(item.countedQuantity)) throw new InventoryError('INVALID_QUANTITY', '实盘数量必须是整数');
      const sku = await tx.catalogSku.findUnique({ where: { internalCode: item.internalCode } });
      if (!sku) throw new InventoryError('SKU_NOT_FOUND', `未找到 ${item.internalCode}`);
      const balance = await tx.inventoryBalance.upsert({ where: { warehouseId_skuId: { warehouseId: warehouse.id, skuId: sku.id } }, update: {}, create: { warehouseId: warehouse.id, skuId: sku.id } });
      const difference = item.countedQuantity - balance.quantity;
      let movementId: string | undefined;
      if (difference !== 0) {
        const movement = await tx.stockMovement.create({ data: { movementNo: movementNo('COUNT'), warehouseId: warehouse.id, skuId: sku.id, type: 'COUNT', quantity: difference, balanceBefore: balance.quantity, balanceAfter: item.countedQuantity, source: 'STOCK_COUNT', note: `盘点单 ${countNo}` } });
        movementId = movement.id;
        await tx.inventoryBalance.update({ where: { id: balance.id }, data: { quantity: item.countedQuantity } });
      }
      await tx.stockCountItem.create({ data: { countId: count.id, skuId: sku.id, bookQuantity: balance.quantity, countedQuantity: item.countedQuantity, difference, movementId } });
    }
    return count;
  });
}
