import { getGCPStorage, GCS_BUCKET } from '../server/gcp-storage';

/**
 * Utilidad para subir Buffers directamente a Google Cloud Storage y obtener una URL pública
 */
export async function uploadBufferToGCS(
    buffer: Buffer, 
    path: string, 
    contentType: string = 'audio/mpeg',
    storeId: string = 'store-main'
): Promise<string> {
    const storage = await getGCPStorage(storeId);
    const bucket = storage.bucket(GCS_BUCKET);
    const file = bucket.file(path);

    await file.save(buffer, {
        metadata: {
            contentType,
            cacheControl: 'public, max-age=31536000',
        },
        resumable: false
    });

    // Hacerlo público si el bucket no tiene uniform bucket-level access habilitado de forma restrictiva
    try {
        await file.makePublic();
    } catch (e) {
        console.warn(`[GCS] No se pudo hacer público directamente (posible Uniform Bucket Level Access): ${path}`);
    }

    return `https://storage.googleapis.com/${GCS_BUCKET}/${path}`;
}
