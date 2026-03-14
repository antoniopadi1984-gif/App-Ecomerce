import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Usa el mismo service account de Google Drive ya configurado
export const analyticsClient = new BetaAnalyticsDataClient({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
});
