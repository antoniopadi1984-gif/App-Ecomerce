import { google } from 'googleapis';

export async function queryGa4BigQuery(query: string) {
    const auth = new google.auth.GoogleAuth({
        credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?
            JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
        scopes: ['https://www.googleapis.com/auth/bigquery'],
    });

    const bigquery = google.bigquery({ version: 'v2', auth });
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    const res = await bigquery.jobs.query({
        projectId,
        requestBody: {
            query,
            useLegacySql: false,
        },
    });

    return res.data.rows || [];
}

/**
 * Obtiene métricas GA4 cruzadas por ad_name (utm_term)
 */
export async function getGa4MetricsByAd(startDate: string, endDate: string) {
    const datasetId = process.env.GOOGLE_BIGQUERY_DATASET_ID;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!datasetId || !projectId) {
        throw new Error('GA4 BigQuery configuration missing');
    }

    // Query para obtener sesiones y compras por utm_term
    // Adaptado al esquema estándar de GA4 BigQuery Export
    const query = `
        SELECT
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'utm_term') as ad_name,
            COUNT(DISTINCT CONCAT(user_pseudo_id, CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING))) as sessions,
            COUNTIF(event_name = 'purchase') as purchases,
            SUM((SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value')) as revenue
        FROM
            \`${projectId}.${datasetId}.events_*\`
        WHERE
            _TABLE_SUFFIX BETWEEN '${startDate.replace(/-/g, '')}' AND '${endDate.replace(/-/g, '')}'
            AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'utm_term') IS NOT NULL
        GROUP BY 1
    `;

    return queryGa4BigQuery(query);
}
