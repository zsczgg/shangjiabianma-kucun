import { NextRequest, NextResponse } from 'next/server';
import { getCatalogKeyStatus, replaceCatalogApiKey } from '@/lib/catalog-config';

export async function GET() {
  return NextResponse.json({ success: true, data: await getCatalogKeyStatus() });
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    if (typeof apiKey !== 'string') throw new Error('请输入新的 API Key');
    await replaceCatalogApiKey(apiKey);
    return NextResponse.json({ success: true, data: await getCatalogKeyStatus() });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'API Key 更新失败' } }, { status: 400 });
  }
}
