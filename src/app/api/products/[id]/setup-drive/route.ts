import { NextRequest, NextResponse } from 'next/server';
import { setupProductDrive } from '@/lib/services/drive-service';

export const runtime = 'nodejs';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const storeId = req.headers.get('X-Store-Id') || 'store-main';
        const folderId = await setupProductDrive(id, storeId);
        return NextResponse.json({ success: true, folderId });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
