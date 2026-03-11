import { NextRequest, NextResponse } from 'next/server';
import { getGCPStorage, GCS_BUCKET } from '@/lib/server/gcp-storage';
import { CreativeStorageService } from '@/lib/creative/services/creative-storage-service';
import { v4 as uuidv4 } from 'uuid';

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser is necessary to consume the request stream when using formData
    }
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const storeId = formData.get('storeId') as string;
        const productId = formData.get('productId') as string;
        const type = formData.get('type') as string || 'propio'; // 'propio' o 'competencia'

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!storeId || !productId) {
            return NextResponse.json({ error: "Missing storeId or productId" }, { status: 400 });
        }

        console.log(`[VideoLab Upload] Uploading ${file.name} to GCP for product ${productId}`);

        const storage = await getGCPStorage(storeId);
        const bucket = storage.bucket(GCS_BUCKET);

        // Subcarpetas por producto
        const pId = productId === 'GLOBAL' ? 'global' : productId;
        const fileName = `${storeId}/products/${pId}/video-lab/uploads/${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
        
        const blob = bucket.file(fileName);
        const buf = await file.arrayBuffer();

        await blob.save(Buffer.from(buf), {
            contentType: file.type,
            resumable: false,
        });

        const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${fileName}`;

        // Guardar en la base de datos de creativos
        console.log(`[VideoLab Upload] Saving asset to database`);
        
        const creative = await CreativeStorageService.saveVideo({
            productId: productId !== 'GLOBAL' ? productId : undefined,
            storeId,
            type: 'VIDEO',
            videoUrl: publicUrl,
            concept: file.name,
            generationCost: 0,
            generatedBy: type === 'propio' ? 'USER_UPLOAD' : 'COMPETITOR_UPLOAD'
        });

        return NextResponse.json({
            success: true,
            fileName,
            publicUrl,
            creative
        });

    } catch (e: any) {
        console.error("🛑 [VideoLab Upload Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
