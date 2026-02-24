import { google } from 'googleapis';
import { getConnectionSecret } from '@/lib/server/connections';

/**
 * GOOGLE CLOUD UNIFIED AUTHENTICATION
 * 
 * Centralized utility to get a GoogleAuth instance with all required scopes 
 * for the application: Sheets, Drive, Docs, and Analytics.
 */

export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics'
];

export async function getGoogleAuth(storeId: string = 'store-main') {
    try {
        // Fetch Service Account JSON from connections (canonicalized to GOOGLE_CLOUD)
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_CLOUD') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!saKey) {
            throw new Error(`Google Cloud Service Account not configured for store: ${storeId}`);
        }

        let credentials;
        try {
            credentials = typeof saKey === 'string' ? JSON.parse(saKey) : saKey;
        } catch (e) {
            throw new Error('Invalid Google Service Account JSON format');
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: GOOGLE_SCOPES
        });

        return auth;
    } catch (error: any) {
        console.error('[getGoogleAuth] Authentication initialization failed:', error.message);
        throw error;
    }
}
