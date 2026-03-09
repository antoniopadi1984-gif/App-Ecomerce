import { NextRequest, NextResponse } from 'next/server';
import { getGCPStorage, GCS_BUCKET } from '@/lib/server/gcp-storage';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || req.headers.get('X-Store-Id');
    if (!storeId) return NextResponse.json({ error: 'Falta storeId' }, { status: 400 });
    const prefix = searchParams.get('prefix') || ''; // folder-like prefix

    try {
        const storage = await getGCPStorage(storeId);
        const bucket = storage.bucket(GCS_BUCKET);

        // List files
        const [files] = await bucket.getFiles({ prefix });

        const result = files.map(file => ({
            name: file.name,
            size: file.metadata.size,
            updated: file.metadata.updated,
            contentType: file.metadata.contentType,
            url: `https://storage.googleapis.com/${GCS_BUCKET}/${file.name}`
        }));

        return NextResponse.json({ success: true, files: result });
    } catch (e: any) {
        console.error("🛑 [Drive Listing Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
