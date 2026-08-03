import { NextRequest, NextResponse } from 'next/server';
import { syncCatalog } from '@/lib/sync';
export async function POST(request: NextRequest) {
  const internal = request.headers.get('x-internal-sync-token');
  const trigger = internal && internal === process.env.INTERNAL_SYNC_TOKEN ? 'SCHEDULED' : 'MANUAL';
  try { return NextResponse.json({ success: true, data: await syncCatalog(trigger) }); }
  catch (error) { return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : '同步失败' } }, { status: 500 }); }
}
