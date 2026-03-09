import { NextRequest, NextResponse } from 'next/server';
import { getGCPStorage, GCS_BUCKET } from '@/lib/server/gcp-storage';
import { v4 as uuidv4 } from 'uuid';

export const config = {
    api: {
        bodyParser: false, // For large files if needed
    }
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const storeId = formData.get('storeId') as string || 'store-main';
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const storage = await getGCPStorage(storeId);
        const bucket = storage.bucket(GCS_BUCKET);

        const fileName = `${folder}/${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
        const blob = bucket.file(fileName);

        const buf = await file.arrayBuffer();
        await blob.save(Buffer.from(buf), {
            contentType: file.type,
            resumable: false,
        });

        const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${fileName}`;

        return NextResponse.json({
            success: true,
            fileName,
            publicUrl,
            metadata: {
                size: file.size,
                type: file.type
            }
        });
    } catch (e: any) {
        console.error("🛑 [Drive Upload Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
