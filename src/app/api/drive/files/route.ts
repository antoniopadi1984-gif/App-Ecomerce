import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const folderId = searchParams.get('folderId');
    
    const params = new URLSearchParams();
    if (productId) params.set('productId', productId);
    if (folderId) params.set('folderId', folderId);
    
    const res = await fetch(`${req.nextUrl.origin}/api/video-lab/drive-files?${params}`, {
        headers: { 'X-Store-Id': req.headers.get('X-Store-Id') || '' }
    });
    const data = await res.json().catch(() => ({ files: [] }));
    return NextResponse.json(data);
}
