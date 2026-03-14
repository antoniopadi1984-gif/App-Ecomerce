import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId');
    const adName  = req.nextUrl.searchParams.get('adName'); // MICR-C1-V1
    const base    = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!storeId || !adName) {
        return NextResponse.json({ error: 'storeId y adName requeridos' }, { status: 400 });
    }

    // Llamar a los 3 endpoints en paralelo
    const [metaRes, ga4Res, clarityRes] = await Promise.allSettled([
        fetch(`${base}/api/analytics/creative-performance?storeId=${storeId}&adName=${adName}`),
        fetch(`${base}/api/analytics/ga4?storeId=${storeId}&adName=${adName}`),
        fetch(`${base}/api/analytics/clarity?storeId=${storeId}&adName=${adName}`),
    ]);

    const meta    = metaRes.status    === 'fulfilled' ? await metaRes.value.json()    : null;
    const ga4     = ga4Res.status     === 'fulfilled' ? await ga4Res.value.json()     : null;
    const clarity = clarityRes.status === 'fulfilled' ? await clarityRes.value.json() : null;

    // Creativo base
    const creative = meta?.table?.[0] || null;

    // Construir análisis completo
    return NextResponse.json({
        ok: true,
        adName,
        storeId,

        // Identificación Spencer
        concept:      creative?.concept,
        conceptName:  creative?.conceptName,
        traffic:      creative?.traffic,
        awareness:    creative?.awareness,
        awarenessName:creative?.awarenessName,
        angle:        creative?.angle,
        hookScore:    creative?.hookScore,
        driveUrl:     creative?.driveUrl,

        // Métricas Meta (tráfico pagado)
        meta: {
            spend:       creative?.spend,
            impressions: creative?.impressions,
            clicks:      creative?.clicks,
            ctr:         creative?.ctr,
            cpc:         creative?.cpc,
            roas:        creative?.roas,
            hookRate:    creative?.hookRate,
            holdRate:    creative?.holdRate,
            cpa:         creative?.cpa,
            conversions: creative?.conversions,
            verdict:     creative?.verdict,
        },

        // Métricas GA4 (comportamiento landing)
        ga4: {
            sessions:       ga4?.rows?.[0]?.sessions,
            users:          ga4?.rows?.[0]?.users,
            bounceRate:     ga4?.rows?.[0]?.bounceRate,
            avgDuration:    ga4?.rows?.[0]?.avgDuration,
            conversionRate: ga4?.rows?.[0]?.conversionRate,
            purchases:      ga4?.rows?.[0]?.purchases,
            revenue:        ga4?.rows?.[0]?.revenue,
            landingPage:    ga4?.rows?.[0]?.landingPage,
        },

        // Comportamiento Clarity (UX)
        clarity: {
            avgScrollDepth: clarity?.summary?.avgScrollDepth,
            avgTimeOnPage:  clarity?.summary?.avgTimeOnPage,
            bounceRate:     clarity?.summary?.bounceRate,
            rageClicks:     clarity?.summary?.rageClicks,
            deadClicks:     clarity?.summary?.deadClicks,
            quickBacks:     clarity?.summary?.quickBacks,
        },

        // Funnel completo: ad click → landing → purchase
        funnel: {
            clicks:         creative?.clicks,
            sessions:       ga4?.rows?.[0]?.sessions,
            purchases:      ga4?.rows?.[0]?.purchases,
            clickToSession: creative?.clicks && ga4?.rows?.[0]?.sessions
                ? (ga4.rows[0].sessions / creative.clicks * 100).toFixed(1) + '%'
                : null,
            sessionToSale:  ga4?.rows?.[0]?.conversionRate
                ? ga4.rows[0].conversionRate + '%'
                : null,
        },

        // UTMs completas para referencia
        utmStructure: {
            source:    'facebook',
            medium:    'paid_social',
            campaign:  '{{campaign.name}}',
            content:   '{{adset.name}}',
            term:      adName,   // MICR-C1-V1
            ad_name:   adName,
        }
    });
}
