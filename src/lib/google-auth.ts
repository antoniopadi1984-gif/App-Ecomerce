import { google } from 'googleapis';
import { getConnectionSecret } from '@/lib/server/connections';

/**
 * GOOGLE CLOUD UNIFIED AUTHENTICATION
 * 
 * Centralized utility to get a GoogleAuth instance with all required scopes 
 * for the application: Sheets, Drive, Docs, Analytics, Gmail, Calendar, Cloud Platform.
 */

export const GOOGLE_SCOPES = [
    // Workspace
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    // Analytics
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics',
    // Gmail
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
    // Calendar
    'https://www.googleapis.com/auth/calendar.readonly',
    // Cloud Platform
    'https://www.googleapis.com/auth/cloud-platform',
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
