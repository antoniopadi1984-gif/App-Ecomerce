import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsConfig } from '@/lib/analytics/analytics-config';
import { analyticsClient } from '@/lib/analytics/ga4-client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const storeId   = req.nextUrl.searchParams.get('storeId');
    const adName    = req.nextUrl.searchParams.get('adName');   // MICR-C1-V1
    const startDate = req.nextUrl.searchParams.get('startDate') || '7daysAgo';
    const endDate   = req.nextUrl.searchParams.get('endDate')   || 'today';

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const config = getAnalyticsConfig(storeId);
    if (!config?.ga4PropertyId) {
        return NextResponse.json({
            error: 'GA4 Property ID no configurado — añadir GA4_PROPERTY_ID al .env',
            measurementId: config?.ga4MeasurementId
        }, { status: 404 });
    }

    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${config.ga4PropertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [
                { name: 'sessionCampaignName' },
                { name: 'sessionManualAdContent' },
                { name: 'sessionManualTerm' },
                { name: 'landingPage' },
                { name: 'sessionSourceMedium' },
            ],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' },
                { name: 'conversions' },
                { name: 'totalRevenue' },
                { name: 'ecommercePurchases' },
            ],
            ...(adName ? {
                dimensionFilter: {
                    filter: {
                        fieldName: 'sessionManualTerm',
                        stringFilter: { matchType: 'EXACT', value: adName }
                    }
                }
            } : {}),
            limit: 500,
        });

        const rows = (response.rows || []).map((row: any) => ({
            campaign:       row.dimensionValues?.[0]?.value,
            adContent:      row.dimensionValues?.[1]?.value,
            adName:         row.dimensionValues?.[2]?.value,
            landingPage:    row.dimensionValues?.[3]?.value,
            sourceMedium:   row.dimensionValues?.[4]?.value,
            sessions:       parseInt(row.metricValues?.[0]?.value || '0'),
            users:          parseInt(row.metricValues?.[1]?.value || '0'),
            bounceRate:     parseFloat(row.metricValues?.[2]?.value || '0'),
            avgDuration:    parseFloat(row.metricValues?.[3]?.value || '0'),
            conversions:    parseInt(row.metricValues?.[4]?.value || '0'),
            revenue:        parseFloat(row.metricValues?.[5]?.value || '0'),
            purchases:      parseInt(row.metricValues?.[6]?.value || '0'),
            conversionRate: row.metricValues?.[0]?.value
                ? (parseInt(row.metricValues?.[4]?.value || '0') / parseInt(row.metricValues?.[0]?.value || '1') * 100).toFixed(2)
                : '0',
        }));

        return NextResponse.json({
            ok: true,
            storeId,
            propertyId: config.ga4PropertyId,
            adFilter: adName || null,
            dateRange: { startDate, endDate },
            rows,
            rowCount: response.rowCount || 0,
        });
    } catch (err: any) {
        console.error('[API GA4] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
