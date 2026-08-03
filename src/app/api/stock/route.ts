import { NextRequest, NextResponse } from 'next/server';
import { changeStock, InventoryError } from '@/lib/inventory';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const movement = await changeStock({ ...body, quantity: Number(body.quantity) });
    return NextResponse.json({ success: true, data: movement });
  } catch (error) {
    const known = error instanceof InventoryError;
    return NextResponse.json({ success: false, error: { code: known ? error.code : 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '操作失败', requiresConfirmation: known && error.requiresConfirmation } }, { status: known ? 400 : 500 });
  }
}
