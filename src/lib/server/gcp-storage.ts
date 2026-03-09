import { Storage } from '@google-cloud/storage';
import { getConnectionSecret } from './connections';

export async function getGCPStorage(storeId: string = 'store-main') {
    const saKey = await getConnectionSecret(storeId, 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!saKey) throw new Error("Missing GCP Service Account Key for Storage");

    try {
        const credentials = JSON.parse(saKey);
        return new Storage({ credentials });
    } catch (e) {
        throw new Error("Invalid GCP Service Account JSON");
    }
}

export const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'ecompulse-creatives';
