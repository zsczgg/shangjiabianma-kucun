import { NextRequest, NextResponse } from 'next/server';
import { completeCount, InventoryError } from '@/lib/inventory';
export async function POST(request: NextRequest) {
  try { const body = await request.json(); return NextResponse.json({ success: true, data: await completeCount(body.items, body.note) }); }
  catch (error) { return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : '盘点失败', code: error instanceof InventoryError ? error.code : 'INTERNAL_ERROR' } }, { status: 400 }); }
}
