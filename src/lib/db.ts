import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function ensureDefaults() {
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: { code: 'MAIN', name: '主仓库', isDefault: true },
  });
  await prisma.appSetting.upsert({
    where: { key: 'negativeStockPolicy' }, update: {}, create: { key: 'negativeStockPolicy', value: 'STRICT' },
  });
  return warehouse;
}
