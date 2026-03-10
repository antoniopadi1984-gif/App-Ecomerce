import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/replicate-client';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const storeId = req.headers.get('X-Store-Id');
  const { productId, prompt, aspectRatio = '9:16', style = 'photorealistic' } = await req.json();
  if (!storeId || !productId || !prompt) return NextResponse.json({ error: 'storeId, productId y prompt requeridos' }, { status: 400 });

  let imageUrl: string;
  try {
      imageUrl = await generateImage({
          prompt: `${prompt}`,
          mode: 'generate',
          aspectRatio: aspectRatio as any
      });
  } catch (err: any) {
      return NextResponse.json({ error: 'Generación fallida', detail: err.message }, { status: 500 });
  }

  // Descargar imagen y subir a Drive
  const imageRes = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true } });
  const fileName = `static_ad_${Date.now()}.webp`;
  
  const uploadRes = await uploadToProduct(
      imageBuffer,
      fileName,
      'image/webp',
      productId,
      storeId,
      { conceptCode: 'C01', funnelStage: 'TOF', fileType: 'IMAGE' }
  );

  // Registrar en CreativeAsset
  const asset = await (prisma as any).creativeAsset.create({
    data: { 
        productId, 
        storeId, 
        type: 'IMAGE', 
        name: fileName, 
        driveFileId: uploadRes.driveFileId, 
        drivePath: uploadRes.drivePath,
        driveUrl: uploadRes.driveUrl,
        processingStatus: 'READY',
        metadata: JSON.stringify({ prompt, style, aspectRatio }) 
    }
  });

  return NextResponse.json({ ok: true, assetId: asset.id, driveFileId: uploadRes.driveFileId, imageUrl });
}
