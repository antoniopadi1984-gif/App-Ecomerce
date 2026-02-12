
import { prisma } from "@/lib/prisma";
import { getMetaAdsService } from "../marketing/meta-ads";
import { format, isSameDay } from "date-fns";

type WindowType = "DAY" | "3H" | "6H";

/**
 * Intraday Sync Service
 * Handles fetching real-time metrics from Meta Ads and storing them with window granularity.
 */
export class IntradaySyncService {

    /**
     * Circuit Breaker Check
     */
    static async checkCircuitBreaker(storeId: string): Promise<boolean> {
        const logs = await prisma.auditLog.findMany({
            where: { storeId, action: "INTRADAY_SYNC" },
            orderBy: { createdAt: "desc" },
            take: 2
        });

        if (logs.length < 2) return true;
        const recentFailures = logs.filter(l => l.newValue === "FAILURE");
        return recentFailures.length < 2;
    }

    private static async logAttempt(storeId: string, status: "SUCCESS" | "FAILURE", error?: string) {
        await prisma.auditLog.create({
            data: {
                storeId,
                action: "INTRADAY_SYNC",
                entity: "SYSTEM",
                entityId: "circuit-breaker",
                oldValue: error ? JSON.stringify({ error }) : null,
                newValue: status
            } as any
        });
    }

    /**
     * Normalize Meta Insights to Standard Metrics
     */
    private static normalize(m: any) {
        const getAction = (type: string) => {
            const a = m.actions?.find((x: any) => x.action_type === type);
            return a ? parseInt(a.value) : 0;
        };
        const getValue = (type: string) => {
            const a = m.action_values?.find((x: any) => x.action_type === type);
            return a ? parseFloat(a.value) : 0;
        };

        const spend = parseFloat(m.spend || "0");
        const impressions = parseInt(m.impressions || "0");
        const clicks = parseInt(m.clicks || "0");
        const reach = parseInt(m.reach || "0");
        const lpv = getAction('landing_page_view');
        const purch = getAction('purchase');
        const revenue = getValue('purchase');

        // Spanish mapping as requested by user
        return {
            // Meta Identifiers
            campaign_id: m.campaign_id,
            campaign_name: m.campaign_name,
            adset_id: m.adset_id,
            adset_name: m.adset_name,
            ad_id: m.ad_id,
            ad_name: m.ad_name,
            account_id: m.account_id,
            account_name: m.account_name,

            // Status & Configuration
            effective_status: m.effective_status,
            status: m.status,
            configured_status: m.configured_status,
            objective: m.objective,
            buying_type: m.buying_type,

            // Performance Metrics
            gasto: spend,
            impresiones: impressions,
            alcance: reach,
            frecuencia: parseFloat(m.frequency || "0"),
            clics: clicks,
            clics_unicos: parseInt(m.unique_clicks || "0"),
            clics_enlace: parseInt(m.inline_link_clicks || "0"),
            ctr_enlace: parseFloat(m.inline_link_click_ctr || "0"),
            clics_enlace_unicos: parseInt(m.unique_inline_link_clicks || "0"),
            ctr_enlace_unico: parseFloat(m.unique_inline_link_click_ctr || "0"),
            clics_salientes: parseInt(m.outbound_clicks?.[0]?.value || "0"),
            clics_salientes_unicos: parseInt(m.unique_outbound_clicks?.[0]?.value || "0"),
            ctr_clics_salientes: parseFloat(m.outbound_clicks_ctr?.[0]?.value || "0"),
            cpc: parseFloat(m.cpc || "0"),
            cpm: parseFloat(m.cpm || "0"),
            cpp: parseFloat(m.cpp || "0"),
            ctr: parseFloat(m.ctr || "0"),
            ctr_unico: parseFloat(m.unique_ctr || "0"),

            // Granular Costs
            coste_por_clic_unico: parseFloat(m.cost_per_unique_click || "0"),
            coste_por_clic_enlace: parseFloat(m.cost_per_inline_link_click || "0"),

            // Conversions
            compras: purch,
            anadir_carrito: getAction('add_to_cart'),
            iniciar_pago: getAction('initiate_checkout'),
            vistas_contenido: getAction('view_content'),
            vistas_landing: lpv,
            leads: getAction('lead'),
            registros_completados: getAction('complete_registration'),

            // Values
            valor_compras: revenue,
            valor_anadir_carrito: getValue('add_to_cart'),
            valor_iniciar_pago: getValue('initiate_checkout'),

            // Costs (Calculated)
            coste_compra: purch > 0 ? spend / purch : 0,
            coste_carrito: getAction('add_to_cart') > 0 ? spend / getAction('add_to_cart') : 0,
            coste_pago: getAction('initiate_checkout') > 0 ? spend / getAction('initiate_checkout') : 0,
            coste_landing: lpv > 0 ? spend / lpv : 0,
            coste_lead: getAction('lead') > 0 ? spend / getAction('lead') : 0,
            coste_registro: getAction('complete_registration') > 0 ? spend / getAction('complete_registration') : 0,

            // Video
            vistas_3seg: getAction('video_view'),
            vistas_2seg: getAction('video_continuous_2_sec_watched_actions'),
            vistas_30seg: getAction('video_30_sec_watched_actions'),
            vistas_25: getAction('video_p25_watched_actions'),
            vistas_50: getAction('video_p50_watched_actions'),
            vistas_75: getAction('video_p75_watched_actions'),
            vistas_100: getAction('video_p100_watched_actions'),
            vistas_thruplay: getAction('video_thruplay_watched_actions'),
            reproducciones_video: getAction('video_play'),
            tiempo_promedio_video: getAction('video_avg_time_watched_actions'),

            // Quality & ROAS
            roas_compras: m.purchase_roas ? parseFloat(m.purchase_roas[0]?.value || "0") : (spend > 0 ? revenue / spend : 0),
            ranking_calidad: m.quality_ranking,
            ranking_engagement: m.engagement_rate_ranking,
            ranking_conversion: m.conversion_rate_ranking,

            // Compatibility with existing UI
            spend, impressions, clicks, roas: m.purchase_roas ? parseFloat(m.purchase_roas[0]?.value || "0") : (spend > 0 ? revenue / spend : 0),
            landing_page_views: lpv, purchases: purch, revenue,
            atc_rate: lpv > 0 ? (getAction('add_to_cart') / lpv) * 100 : 0,
            hook_rate: impressions > 0 ? (getAction('video_view') / impressions) * 100 : 0,
            hold_rate: getAction('video_view') > 0 ? (getAction('video_thruplay_watched_actions') / getAction('video_view')) * 100 : 0
        };
    }

    /**
     * Save Metric to DB
     */
    private static async saveMetric(
        storeId: string,
        platform: string,
        level: string,
        externalId: string,
        name: string,
        date: Date,
        window: string,
        raw: any,
        norm: any
    ) {
        if (!externalId) {
            console.warn(`[IntradaySyncService] Skipping save: externalId is missing for level ${level}`);
            return;
        }

        // Completeness Check (Simple: has spend or has impressions?)
        const isComplete = { spend: norm.spend > 0, attribution: norm.purchases > 0 };

        console.log(`[IntradaySyncService] Saving ${level} metric. Spend: ${norm.spend}, Purchases: ${norm.purchases}`);

        try {
            await prisma.adMetricDaily.upsert({
                where: {
                    storeId_platform_level_externalId_date_window: {
                        storeId, platform, level, externalId, date, window
                    }
                } as any,
                update: {
                    name: name || "Unknown",
                    metricsRaw: JSON.stringify(raw),
                    metricsNorm: JSON.stringify(norm),
                    isActive: norm.effective_status === 'ACTIVE',
                    completeness: JSON.stringify(isComplete)
                } as any,
                create: {
                    storeId, platform, level, externalId, date, window,
                    name: name || "Unknown",
                    metricsRaw: JSON.stringify(raw),
                    metricsNorm: JSON.stringify(norm),
                    isActive: norm.effective_status === 'ACTIVE',
                    completeness: JSON.stringify(isComplete)
                } as any
            });
        } catch (e: any) {
            const msg = `[IntradaySyncService] Error saving metric: ${e.message}`;
            console.error(msg);
            return msg;
        }
        return null;
    }

    /**
     * Process Level (Fetch Objects + Insights & Merge)
     */
    private static async processLevel(
        storeId: string,
        metaService: any,
        accountId: string,
        accountName: string,
        level: string, // CAMPAIGN, ADSET, AD
        edge: 'campaigns' | 'adsets' | 'ads',
        date: Date,
        window: string,
        timeRange: any
    ) {
        let synced = 0;
        const errors: string[] = [];

        try {
            // 1. Fetch Objects (Status + IDs)
            const objects = await metaService.getAdObjects(accountId, edge, 'id,name,effective_status,status,configured_status,objective,buying_type');

            // 2. Fetch Insights (Metrics)
            const insights = await metaService.getInsights(accountId, level.toLowerCase(), timeRange);
            const insightMap = new Map(insights.map((i: any) => {
                const id = i[`${level.toLowerCase()}_id`];
                return [id, i];
            }));

            // 3. Iterate ALL Objects
            for (const obj of objects) {
                const insight = insightMap.get(obj.id);
                let m: any = {};

                if (insight) {
                    m = { ...insight, ...obj };
                } else {
                    m = {
                        ...obj,
                        spend: "0", impressions: "0", clicks: "0", actions: [],
                        [`${level.toLowerCase()}_id`]: obj.id,
                        [`${level.toLowerCase()}_name`]: obj.name
                    };
                }

                // Inject Account Info
                m.account_id = accountId;
                m.account_name = accountName;

                const norm = this.normalize(m);
                // Ensure status is correct in norm
                norm.effective_status = obj.effective_status;

                const err = await this.saveMetric(storeId, 'META', level, obj.id, obj.name, date, window, m, norm);
                if (err) errors.push(err);
                synced++;
            }
        } catch (e: any) {
            errors.push(`Error processing ${level}: ${e.message}`);
        }

        return { synced, errors };
    }

    /**
     * Master Sync Function
     */
    static async syncWindow(storeId: string, window: WindowType, targetDate?: Date) {
        const errorLogs: string[] = [];
        const isToday = !targetDate || isSameDay(targetDate, new Date());

        // 1. Circuit Breaker & Throttling
        const isHealthy = await this.checkCircuitBreaker(storeId);
        if (!isHealthy) {
            console.warn(`[CircuitBreaker] Sync BLOCKED... BUT PROCEEDING FOR DEBUG.`);
        }

        // Throttling: Only for "Today" syncs to prevent constant polling
        if (isToday) {
            const lastSync = await prisma.auditLog.findFirst({
                where: { storeId, action: "INTRADAY_SYNC", newValue: "SUCCESS" },
                orderBy: { createdAt: "desc" }
            });

            if (lastSync && (new Date().getTime() - lastSync.createdAt.getTime() < 15 * 60 * 1000)) {
                console.log(`[IntradaySyncService] Throttling: Last sync was ${Math.round((new Date().getTime() - lastSync.createdAt.getTime()) / 60000)}m ago.`);
                return { success: true, synced: 0, logs: ["Throttled: Recently synced"] };
            }
        }

        try {
            const date = targetDate || new Date();
            date.setHours(0, 0, 0, 0); // Start of day
            const dateStr = format(date, 'yyyy-MM-dd');

            const metaService = await getMetaAdsService(prisma, storeId);

            // 2. Fetch Active Accounts directly from Meta
            const accounts = await metaService.getAdAccounts();

            let synced = 0;
            const timeRange = { since: dateStr, until: dateStr };

            for (const acc of accounts) {
                // 3. Account Level (Direct Insight)
                let hasSpend = false;
                try {
                    const accInsights = await metaService.getInsights(acc.id, 'account', timeRange);
                    if (accInsights && accInsights.length > 0) {
                        const m = accInsights[0];
                        hasSpend = parseFloat(m.spend || "0") > 0;

                        // Account Status comes from acc object
                        m.effective_status = acc.account_status === 1 ? 'ACTIVE' : 'PAUSED';
                        m.account_status = acc.account_status;

                        const norm = this.normalize(m);
                        const err = await this.saveMetric(storeId, 'META', 'ACCOUNT', acc.id, acc.name, date, window, m, norm);
                        if (err) errorLogs.push(err);
                        synced++;
                    }
                } catch (e: any) {
                    errorLogs.push(`Account Level Error: ${e.message}`);
                }

                // Optimization: If no spend for the day, skip fetching campaigns/ads/adsets
                if (!hasSpend) {
                    console.log(`[IntradaySyncService] Account ${acc.name} (${acc.id}) has 0 spend. Skipping details.`);
                    continue;
                }

                // 4. Campaign Level
                const cmpRes = await this.processLevel(storeId, metaService, acc.id, acc.name, 'CAMPAIGN', 'campaigns', date, window, timeRange);
                synced += cmpRes.synced;
                errorLogs.push(...cmpRes.errors);

                // 5. AdSet Level
                const adsetRes = await this.processLevel(storeId, metaService, acc.id, acc.name, 'ADSET', 'adsets', date, window, timeRange);
                synced += adsetRes.synced;
                errorLogs.push(...adsetRes.errors);

                // 6. Ad Level
                const adRes = await this.processLevel(storeId, metaService, acc.id, acc.name, 'AD', 'ads', date, window, timeRange);
                synced += adRes.synced;
                errorLogs.push(...adRes.errors);
            }

            console.log(`[Intraday Sync] Sync completed. Processed: ${synced}`);
            await this.logAttempt(storeId, "SUCCESS");
            return { success: true, synced, logs: errorLogs };

        } catch (error: any) {
            console.error(`[Intraday Sync] Failed:`, error);
            await this.logAttempt(storeId, "FAILURE", error.message);
            return { success: false, error: error.message, logs: errorLogs };
        }
    }
}
