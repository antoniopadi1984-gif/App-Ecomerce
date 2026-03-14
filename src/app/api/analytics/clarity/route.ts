import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsConfig } from '@/lib/analytics/analytics-config';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const storeId   = req.nextUrl.searchParams.get('storeId');
    const adName    = req.nextUrl.searchParams.get('adName');    // MICR-C1-V1
    const startDate = req.nextUrl.searchParams.get('startDate') || getPastDate(7);
    const endDate   = req.nextUrl.searchParams.get('endDate')   || getToday();

    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const config = getAnalyticsConfig(storeId);
    if (!config?.clarityProjectId) {
        return NextResponse.json({ error: 'Clarity no configurado para esta tienda' }, { status: 404 });
    }

    const base = `${process.env.CLARITY_ENDPOINT}/${config.clarityProjectId}`;
    const headers = {
        Authorization: `Bearer ${config.clarityToken}`,
        'Content-Type': 'application/json'
    };

    try {
        // Métricas de sesión
        const [sessionRes, pageRes, funnelRes] = await Promise.all([
            fetch(`${base}/sessions?startDate=${startDate}&endDate=${endDate}`, { headers }),
            fetch(`${base}/pages?startDate=${startDate}&endDate=${endDate}`, { headers }),
            fetch(`${base}/funnels?startDate=${startDate}&endDate=${endDate}`, { headers }),
        ]);

        const [sessions, pages, funnels] = await Promise.all([
            sessionRes.json(),
            pageRes.json(),
            funnelRes.json(),
        ]);

        // Filtrar por UTM ad_name si se pasa — utm_term={{ad.name}}
        // Las UTMs llegan como: utm_term=MICR-C1-V1
        const filteredSessions = adName && sessions.data
            ? { ...sessions, filtered: sessions.data.filter((s: any) =>
                s.utm_term === adName || s.utm_content === adName
              )}
            : sessions;

        return NextResponse.json({
            ok: true,
            storeId,
            projectId: config.clarityProjectId,
            storeUrl: config.storeUrl,
            dateRange: { startDate, endDate },
            adFilter: adName || null,
            sessions: filteredSessions,
            pages,
            funnels,
            // Métricas clave extraídas
            summary: {
                totalSessions:    sessions.totalCount || 0,
                avgScrollDepth:   sessions.avgScrollDepth || 0,
                avgTimeOnPage:    sessions.avgTimeOnPage || 0,
                bounceRate:       sessions.bounceRate || 0,
                rageClicks:       sessions.rageClicks || 0,
                deadClicks:       sessions.deadClicks || 0,
                quickBacks:       sessions.quickBacks || 0,
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function getPastDate(days: number) {
    return new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
}
function getToday() {
    return new Date().toISOString().split('T')[0];
}
