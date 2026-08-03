import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim();
  if (!code) return NextResponse.json({ success: false, error: { message: '请输入编码' } }, { status: 400 });
  const sku = await prisma.catalogSku.findFirst({ where: { OR: [{ internalCode: code }, { manufacturerBarcode: code }, { warehouseCode: code }, { otherCodesJson: { contains: code } }, { platformMappingsJson: { contains: code } }] }, include: { balances: { include: { warehouse: true } } } });
  return sku ? NextResponse.json({ success: true, data: sku }) : NextResponse.json({ success: false, error: { message: '没有找到对应商品' } }, { status: 404 });
}
