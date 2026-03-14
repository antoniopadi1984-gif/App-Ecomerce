import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsConfig } from '@/lib/analytics/analytics-config';
import { GoogleAuth } from 'google-auth-library';

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

    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client = await auth.getClient();
    const token  = await client.getAccessToken();

    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${config.ga4PropertyId}:runReport`;

    // Reporte base — sesiones por fuente y UTMs
    const reportBody = {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
            { name: 'sessionCampaignName' },     // {{campaign.name}}
            { name: 'sessionManualAdContent' },   // {{adset.name}}
            { name: 'sessionManualTerm' },         // {{ad.name}} = MICR-C1-V1
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
        // Filtrar por ad_name si se pasa
        ...(adName ? {
            dimensionFilter: {
                filter: {
                    fieldName: 'sessionManualTerm',
                    stringFilter: { matchType: 'EXACT', value: adName }
                }
            }
        } : {}),
        limit: 500,
    };

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportBody)
    });

    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.error?.message || 'GA4 API error', raw: data }, { status: 500 });
    }

    // Procesar rows en formato legible
    const rows = (data.rows || []).map((row: any) => {
        const dims = row.dimensionValues || [];
        const mets = row.metricValues   || [];
        return {
            campaign:    dims[0]?.value,
            adContent:   dims[1]?.value,
            adName:      dims[2]?.value,   // MICR-C1-V1
            landingPage: dims[3]?.value,
            sourceMedium:dims[4]?.value,
            sessions:         parseInt(mets[0]?.value || '0'),
            users:            parseInt(mets[1]?.value || '0'),
            bounceRate:       parseFloat(mets[2]?.value || '0'),
            avgDuration:      parseFloat(mets[3]?.value || '0'),
            conversions:      parseInt(mets[4]?.value || '0'),
            revenue:          parseFloat(mets[5]?.value || '0'),
            purchases:        parseInt(mets[6]?.value || '0'),
            conversionRate:   mets[0]?.value
                ? (parseInt(mets[4]?.value || '0') / parseInt(mets[0]?.value || '1') * 100).toFixed(2)
                : '0',
        };
    });

    return NextResponse.json({
        ok: true,
        storeId,
        propertyId: config.ga4PropertyId,
        adFilter: adName || null,
        dateRange: { startDate, endDate },
        rows,
        totals: data.totals || [],
        rowCount: data.rowCount || 0,
    });
}
