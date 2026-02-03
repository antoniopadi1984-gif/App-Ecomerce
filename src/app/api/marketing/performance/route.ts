
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMarketingMetrics, calculateMarketingKPIs } from "@/lib/marketing/metrics";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level') || 'CAMPAIGN';
        const period = searchParams.get('period') || 'today';
        const window = searchParams.get('window') || 'DAY';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const idsParam = searchParams.get('ids');
        const campaignIdsParam = searchParams.get('campaign_ids');
        const adsetIdsParam = searchParams.get('adset_ids');

        const selectedIds = idsParam ? idsParam.split(',') : [];
        const campaignIds = campaignIdsParam ? campaignIdsParam.split(',') : [];
        const adsetIds = adsetIdsParam ? adsetIdsParam.split(',') : [];

        console.log(`[API Performance] Request: Level=${level}, Period=${period}, Window=${window}, From=${from}, To=${to}`);

        const store = await prisma.store.findFirst();
        if (!store) return NextResponse.json({ rows: [], insights: [] });

        // Build Date Filter
        let dateFilter: any = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfToday.getDate() + 1);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfToday.getDate() - 1);

        if (from || to) {
            dateFilter = {};
            if (from) dateFilter.gte = new Date(from);
            if (to) dateFilter.lte = new Date(to);
        } else if (period === 'today') {
            // Strict Today
            dateFilter = { gte: startOfToday, lt: startOfTomorrow };
        } else if (period === 'yesterday') {
            // Strict Yesterday
            dateFilter = { gte: startOfYesterday, lt: startOfToday };
        } else if (period === 'last_3d' || period === '3d') {
            const startOf3d = new Date(startOfToday);
            startOf3d.setDate(startOfToday.getDate() - 3);
            dateFilter = { gte: startOf3d, lt: startOfTomorrow };
        } else if (period === 'last_7d' || period === '7d') {
            const startOf7d = new Date(startOfToday);
            startOf7d.setDate(startOfToday.getDate() - 7);
            dateFilter = { gte: startOf7d, lt: startOfTomorrow };
        } else if (period === 'last_30d' || period === '30d') {
            const startOf30d = new Date(startOfToday);
            startOf30d.setDate(startOfToday.getDate() - 30);
            dateFilter = { gte: startOf30d, lt: startOfTomorrow };
        } else if (period === 'lifetime' || period === 'total') {
            // No date filter for lifetime - get all data
            dateFilter = {};
        }

        console.log(`[API Performance] Filter: Level=${level}, Period=${period}, DateRange=${JSON.stringify(dateFilter)}`);

        const where: any = {
            storeId: store.id,
            level: level,
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
            window: 'DAY' // Always use DAY window and aggregate in code
        };

        const platform = searchParams.get('platform') || 'ALL';
        if (platform !== 'ALL') where.platform = platform;

        const accountParam = searchParams.get('account');
        if (accountParam && accountParam !== 'ALL') {
            const cleanId = accountParam.replace('act_', '');
            where.metricsNorm = { contains: cleanId }; // Match ID regardless of act_ prefix or JSON positioning
        }

        // Add ID filter to where clause if present
        if (selectedIds.length > 0) {
            where.externalId = { in: selectedIds };
        }

        // Parent Filtering (Hierarchical Drill-Down) - Multi-selection support using OR
        if (level === 'ADSET' && campaignIds.length > 0) {
            where.OR = campaignIds.map(id => ({ metricsNorm: { contains: id.replace('act_', '') } }));
        }
        if (level === 'AD') {
            if (adsetIds.length > 0) {
                where.OR = adsetIds.map(id => ({ metricsNorm: { contains: id.replace('act_', '') } }));
            } else if (campaignIds.length > 0) {
                where.OR = campaignIds.map(id => ({ metricsNorm: { contains: id.replace('act_', '') } }));
            }
        }

        console.log(`[API Performance] Prisma Where Clause:`, JSON.stringify(where));

        const snapshots = await prisma.adMetricDaily.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 10000 // Increased limit to ensure all entities (active & paused) are returned
        });

        console.log(`[API Performance] Fetched ${snapshots.length} snapshots.`);
        if (snapshots.length > 0) {
            console.log(`[API Performance] First snapshot window: ${snapshots[0].window}, date: ${snapshots[0].date.toISOString()}`);
        }

        // Group by externalId to get totals for the period
        const grouped = snapshots.reduce((acc: any, curr: any) => {
            const id = `${curr.platform}_${curr.externalId}`;
            if (!acc[id]) {
                acc[id] = {
                    id: curr.externalId,
                    entity_id: curr.externalId,
                    name: curr.name,
                    platform: curr.platform,
                    level: curr.level,
                    metricsNorm: {} as any,
                    // These top-level fields will be derived from metricsNorm later
                    spend: 0, impressions: 0, clicks: 0, roas: 0
                };
            }

            // Parse metricsNorm
            const norm = typeof curr.metricsNorm === 'string' ? JSON.parse(curr.metricsNorm) : (curr.metricsNorm || {});
            const completeness = curr.completeness ? JSON.parse(curr.completeness) : { spend: true, attribution: true };

            if (!acc[id].account_id) {
                acc[id].account_id = norm.account_id;
                acc[id].account_name = norm.account_name;
                acc[id].last_active = curr.date;
            } else if (new Date(curr.date) > new Date(acc[id].last_active)) {
                acc[id].last_active = curr.date;
            }

            // Initialize norm accumulator if empty or if new keys appear
            if (Object.keys(acc[id].metricsNorm).length === 0) {
                // Clone initial keys and set numeric values to 0 for summing
                Object.keys(norm).forEach(k => {
                    if (typeof norm[k] === 'number') {
                        acc[id].metricsNorm[k] = 0;
                    } else {
                        acc[id].metricsNorm[k] = norm[k]; // Copy non-numeric values like names
                    }
                });
            }

            console.log(`[Grouping ${id}] Prev Spend: ${acc[id].spend}, Adding: ${norm.gasto || norm.spend || 0}`);

            // Deep Sum metricsNorm
            Object.keys(norm).forEach(key => {
                if (typeof norm[key] === 'number') {
                    acc[id].metricsNorm[key] = (acc[id].metricsNorm[key] || 0) + norm[key];
                } else if (!acc[id].metricsNorm[key]) {
                    acc[id].metricsNorm[key] = norm[key];
                }
            });

            // Compatibility/Aggregated fields for main table
            acc[id].spend += (norm.gasto || norm.spend || 0);
            acc[id].impressions += (norm.impresiones || norm.impressions || 0);
            acc[id].clicks += (norm.clics || norm.clicks || 0);
            acc[id].video_3s_views += (norm.vistas_3seg || norm.video_3s_views || 0);
            acc[id].video_thruplay += (norm.vistas_thruplay || norm.video_thruplay || 0);
            acc[id].landing_page_views += (norm.vistas_landing || norm.landing_page_views || 0);
            acc[id].add_to_cart += (norm.anadir_carrito || norm.add_to_cart || 0);
            acc[id].initiate_checkout += (norm.iniciar_pago || norm.initiate_checkout || 0);
            acc[id].purchases += (norm.compras || norm.purchases || 0);
            acc[id].revenue += (norm.valor_compras || norm.revenue || 0);

            // Pass through status
            acc[id].isActive = curr.isActive;
            acc[id].completeness = completeness;

            return acc;
        }, {});

        // Fetch Real Delivery Data from Orders (UTM Matching)
        // CRITICAL: Filter orders by the same DATE RANGE as the metrics
        const orders = await prisma.order.findMany({
            where: {
                storeId: store.id,
                status: { not: 'CANCELLED' },
                createdAt: dateFilter // Lock attribution to the same period
            },
            select: {
                totalPrice: true,
                logisticsStatus: true,
                source: true,
                medium: true,
                campaign: true,
                content: true,
                adsetId: true,
                adId: true,
                term: true
            }
        });

        const rows = Object.values(grouped).map((m: any) => {
            const kpis = calculateMarketingKPIs(m);

            // Match orders to this metric level (Robust Matching)
            const matchedOrders = orders.filter(o => {
                // Helper for safe string comparison
                const safeMatch = (orderVal: string | null, metricId: string, metricName: string) => {
                    if (!orderVal) return false;
                    const o = orderVal.toLowerCase().trim();
                    if (o === 'default' || o === 'unknown') return false;

                    const mid = metricId.toLowerCase().trim();
                    const mname = metricName.toLowerCase().trim();

                    // 1. Exact matches (ID or Name)
                    if (o === mid || o === mname) return true;

                    // 2. Contains match (Only for IDs or long names to avoid false positives with short strings)
                    if (mid.length > 5 && o.includes(mid)) return true;
                    // For names, we only match if order value is at least 6 characters and is a significant part
                    if (mname.length > 6 && o.includes(mname)) return true;

                    return false;
                };

                if (m.level === 'AD') {
                    // 1. Direct Ad ID match
                    if (o.adId === m.id) return true;
                    // 2. Check UTM Content, Term, and Campaign (Ads often inherit names from parents in UTMs)
                    return safeMatch(o.content, m.id, m.name) ||
                        safeMatch(o.term, m.id, m.name) ||
                        safeMatch(o.campaign, m.id, m.name);
                }
                if (m.level === 'ADSET') {
                    // 1. Direct AdSet ID match
                    if (o.adsetId === m.id) return true;
                    // 2. Exact match on term, content or campaign (Some UTM setups use campaign for adset name)
                    return safeMatch(o.term, m.id, m.name) ||
                        safeMatch(o.content, m.id, m.name) ||
                        safeMatch(o.campaign, m.id, m.name);
                }
                if (m.level === 'CAMPAIGN') {
                    // Try to match by Campaign ID or Name in ANY UTM field
                    return safeMatch(o.campaign, m.id, m.name) ||
                        safeMatch(o.term, m.id, m.name) ||
                        safeMatch(o.content, m.id, m.name) ||
                        safeMatch(o.source, m.id, m.name);
                }
                return false;
            });

            // Calc Real Metrics
            const delivered = matchedOrders.filter(o => o.logisticsStatus === 'DELIVERED').length;
            const revenueReal = matchedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const totalSpend = m.spend || 0;

            return {
                ...kpis,
                metricsNorm: m.metricsNorm,
                isActive: m.isActive,
                real_purchases: matchedOrders.length,
                real_revenue: revenueReal,
                delivered_orders: delivered,
                delivery_rate: matchedOrders.length > 0 ? (delivered / matchedOrders.length) : 0,
                real_cpa: matchedOrders.length > 0 ? totalSpend / matchedOrders.length : 0,
                real_roas: totalSpend > 0 ? revenueReal / totalSpend : 0,
                name: m.name,
                entity_id: m.id, // Meta external ID for sorting
                account_id: m.account_id,
                account_name: m.account_name,
                last_active: m.last_active
            };
        }).sort((a, b) => {
            // Sort by Meta ID (entity_id) - Descending (Newest First, like Ads Manager)
            const idA = BigInt(a.entity_id || '0');
            const idB = BigInt(b.entity_id || '0');
            if (idB > idA) return 1;
            if (idB < idA) return -1;
            return 0;
        });

        // Global Totals
        const globalDelivered = orders.filter(o => o.logisticsStatus === 'DELIVERED').length;
        const globalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const globalPurchases = orders.length;

        return NextResponse.json({
            success: true,
            data: rows,
            totals: {
                revenue: globalRevenue,
                purchases: globalPurchases,
                delivered: globalDelivered,
                spend: rows.reduce((sum, r) => sum + (r.spend || 0), 0)
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
