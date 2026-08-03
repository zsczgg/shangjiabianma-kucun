import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
const allowed = new Set(['STRICT', 'ALLOW', 'CONFIRM']);
export async function POST(request: NextRequest) {
  const { negativeStockPolicy } = await request.json();
  if (!allowed.has(negativeStockPolicy)) return NextResponse.json({ success: false, error: { message: '策略无效' } }, { status: 400 });
  await prisma.appSetting.upsert({ where: { key: 'negativeStockPolicy' }, update: { value: negativeStockPolicy }, create: { key: 'negativeStockPolicy', value: negativeStockPolicy } });
  return NextResponse.json({ success: true });
}
