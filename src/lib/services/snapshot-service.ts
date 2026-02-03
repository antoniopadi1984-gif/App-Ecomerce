import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { IntradaySyncService } from "./intraday-service";

const TIMEZONE = "Europe/Madrid";

export type SnapshotView = 'ORDERS_CREATED' | 'DELIVERED';
export type CompletenessState = 'OK' | 'PARTIAL' | 'MISSING';
export type ProfitStatus = 'REAL' | 'PARTIAL';

export interface DataCompleteness {
    shopify: CompletenessState;
    ads: CompletenessState;
    logistics: CompletenessState;
    costs: CompletenessState;
}


export class SnapshotService {
    /**
     * Patch a daily snapshot for a specific block.
     * Use this to update only a segment of the daily data without overwriting others.
     */
    static async patchSnapshot(storeId: string, date: Date, view: SnapshotView, block: keyof DataCompleteness, data: any) {
        const dayStart = startOfDay(date);

        // 1. Get current snapshot OR initialize empty
        const existing = await prisma.dailySnapshot.findUnique({
            where: { storeId_date_view: { storeId, date: dayStart, view } }
        });

        const currentMetrics = existing?.metricsJson ? JSON.parse(existing.metricsJson) : this.getEmptyMetrics();
        const currentCompleteness = existing?.dataCompleteness ? JSON.parse(existing.dataCompleteness) : this.getEmptyCompleteness();

        // 2. Merge Block Data
        const updatedMetrics = this.mergeBlockData(currentMetrics, block, data);
        const updatedCompleteness = { ...currentCompleteness, [block]: 'OK' }; // For simplicity, we mark block as OK if data is provided

        // 3. Recalculate Derivatives (Profit, Margins, Rates)
        const finalMetrics = this.calculateDerivatives(updatedMetrics, updatedCompleteness);

        // 4. Save
        return await prisma.dailySnapshot.upsert({
            where: { storeId_date_view: { storeId, date: dayStart, view } },
            create: {
                store: { connect: { id: storeId } },
                date: dayStart,
                view,
                spendAds: finalMetrics.financials.spendAds || 0,
                revenueReal: finalMetrics.financials.revenueReal || 0,
                costsReal: this.calculateTotalCosts(finalMetrics) || 0,
                netProfit: finalMetrics.financials.netProfit || 0,
                roasReal: finalMetrics.rates.roasReal || 0,
                deliveryRate: finalMetrics.rates.deliveryRate || 0,
                incidenceRate: finalMetrics.rates.incidenceRate || 0,
                metricsJson: JSON.stringify(finalMetrics),
                dataCompleteness: JSON.stringify(updatedCompleteness),
                isComplete: this.isSnapshotComplete(updatedCompleteness)
            },
            update: {
                spendAds: finalMetrics.financials.spendAds || 0,
                revenueReal: finalMetrics.financials.revenueReal || 0,
                costsReal: this.calculateTotalCosts(finalMetrics) || 0,
                netProfit: finalMetrics.financials.netProfit || 0,
                roasReal: finalMetrics.rates.roasReal || 0,
                deliveryRate: finalMetrics.rates.deliveryRate || 0,
                incidenceRate: finalMetrics.rates.incidenceRate || 0,
                metricsJson: JSON.stringify(finalMetrics),
                dataCompleteness: JSON.stringify(updatedCompleteness),
                isComplete: this.isSnapshotComplete(updatedCompleteness),
                updatedAt: new Date()
            }
        });
    }

    /**
     * Sync Shopify Block (Orders, Revenue, Visitors)
     */
    static async syncShopifyBlock(storeId: string, date: Date, view: SnapshotView) {
        const start = startOfDay(date);
        const end = endOfDay(date);

        // Filters based on view
        const orderFilter: any = { storeId };
        if (view === 'ORDERS_CREATED') {
            orderFilter.createdAt = { gte: start, lte: end };
        } else {
            orderFilter.deliveredAt = { gte: start, lte: end };
            orderFilter.logisticsStatus = 'DELIVERED';
        }

        const orders = await prisma.order.findMany({
            where: orderFilter,
            include: { items: true }
        });

        const confirmed = orders.filter(o => !['CANCELLED', 'ABANDONED'].includes(o.status || ''));
        const cancelled = orders.filter(o => o.status === 'CANCELLED' || o.logisticsStatus === 'CANCELLED');

        const units = orders.reduce((acc, o) => acc + (o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || o.units || 0), 0);
        const revenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
        const revenueConfirmed = confirmed.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

        // LPV/Clicks from Meta
        const adMetrics = await prisma.adMetricDaily.findMany({ where: { storeId, date: start, level: 'ACCOUNT' } });
        let lpv = 0;
        let clicks = 0;
        adMetrics.forEach(m => {
            try {
                const n = JSON.parse(m.metricsNorm || '{}');
                lpv += (n.landing_page_views || n.vistas_landing || 0);
                clicks += (n.clicks || n.clics || 0);
            } catch (e) { }
        });

        await this.patchSnapshot(storeId, date, view, 'shopify', {
            orders: orders.length,
            units,
            revenueConfirmed,
            revenueReal: view === 'DELIVERED' ? revenueConfirmed : 0,
            revenueTotal: revenue,
            lpv,
            clicks,
            confirmed: confirmed.length,
            cancelled: cancelled.length
        });

    }

    /**
     * Sync Ads Block (Spend, Reach, Clicks)
     */
    static async syncAdsBlock(storeId: string, date: Date, view: SnapshotView, force = false) {
        const start = startOfDay(date);

        // Trigger sync if missing, forced, or today
        const existing = await prisma.adMetricDaily.findFirst({
            where: { storeId, date: start, level: 'ACCOUNT' }
        });

        if (force || !existing || isSameDay(date, new Date())) {
            try {
                await IntradaySyncService.syncWindow(storeId, 'DAY', start);
            } catch (e) {
                console.error(`[SnapshotService] Ads Sync Failed for ${start.toISOString()}`, e);
            }
        }

        const adMetrics = await prisma.adMetricDaily.findMany({ where: { storeId, date: start, level: 'ACCOUNT' } });
        let spend = 0;
        adMetrics.forEach(m => {
            let n: any = {};
            try { n = JSON.parse(m.metricsNorm || '{}'); } catch (e) { }
            spend += (n.spend || 0);
        });

        await this.patchSnapshot(storeId, date, view, 'ads', { spendAds: spend });
    }


    /**
     * Sync Logistics Block (Statuses, Costs)
     */
    static async syncLogisticsBlock(storeId: string, date: Date, view: SnapshotView) {
        const start = startOfDay(date);
        const end = endOfDay(date);

        // Logistics is tricky because it depends on the view too
        const orderFilter: any = { storeId };
        if (view === 'ORDERS_CREATED') {
            orderFilter.createdAt = { gte: start, lte: end };
        } else {
            orderFilter.deliveredAt = { gte: start, lte: end };
            orderFilter.logisticsStatus = 'DELIVERED';
        }

        const orders = await prisma.order.findMany({ where: orderFilter });
        const delivered = orders.filter(o => o.logisticsStatus === 'DELIVERED');
        const returned = orders.filter(o => ['RETURNED', 'RETURN_TO_SENDER', 'REFUNDED'].includes(o.logisticsStatus || ''));
        const incidents = orders.filter(o => o.logisticsStatus === 'INCIDENCE' || o.incidenceReason != null);
        const recovered = orders.filter(o => o.logisticsStatus === 'DELIVERED' && (o.incidenceResult === 'RECOVERED' || o.incidenciaType === 'RECOVERED'));
        const deliveredRevenue = delivered.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

        // Logistics Costs Rules
        const rules = await (prisma as any).fulfillmentRule.findMany({ where: { storeId, isActive: true } });
        const getRule = (provider: string | null) => {
            const rule = rules.find((r: any) => r.provider === provider);
            return rule || rules.find((r: any) => r.provider === "GENÉRICO") || { baseShippingCost: 6.5, returnCost: 5.0, codFeeFixed: 1.0, codFeePercent: 0 };
        };

        const shippingCosts = orders.filter(o => !['CANCELLED', 'ABANDONED'].includes(o.status || '')).reduce((acc, o) => {
            const r = getRule(o.logisticsProvider);
            let c = (r.baseShippingCost || 0) + (r.packagingCost || 0) + (r.handlingCost || 0);
            if (o.paymentMethod === 'COD') {
                c += (r.codFeeFixed || 0) + ((o.totalPrice || 0) * (r.codFeePercent || 0) / 100);
            }
            return acc + c;
        }, 0);

        const returnLoss = returned.reduce((acc, o) => {
            const r = getRule(o.logisticsProvider);
            return acc + (r.baseShippingCost || 0) + (r.returnCost || 0);
        }, 0);

        await this.patchSnapshot(storeId, date, view, 'logistics', {
            delivered: delivered.length,
            returned: returned.length,
            incidents: incidents.length,
            recovered: recovered.length,
            shipping: shippingCosts,
            returnLoss,
            revenueReal: view === 'DELIVERED' ? deliveredRevenue : 0
        });
    }

    /**
     * Sync Costs Block (COGS)
     */
    static async syncCostsBlock(storeId: string, date: Date, view: SnapshotView) {
        const start = startOfDay(date);
        const end = endOfDay(date);

        const orderFilter: any = { storeId };
        if (view === 'ORDERS_CREATED') {
            orderFilter.createdAt = { gte: start, lte: end };
            orderFilter.status = { notIn: ['CANCELLED', 'ABANDONED'] };
        } else {
            orderFilter.deliveredAt = { gte: start, lte: end };
            orderFilter.logisticsStatus = 'DELIVERED';
        }

        const items = await prisma.orderItem.findMany({
            where: { order: orderFilter },
            include: { product: { include: { finance: true } } }
        });

        let cogs = 0;
        let hasMissingCosts = false;

        items.forEach(item => {
            const cost = item.unitCost || item.product?.finance?.unitCost;
            if (cost === undefined || cost === null) {
                hasMissingCosts = true;
            }
            cogs += ((cost || 0) * (item.quantity || 0));
        });

        await this.patchSnapshot(storeId, date, view, 'costs', {
            cogs,
            profitStatus: hasMissingCosts ? 'PARTIAL' : 'REAL'
        });
    }


    /**
     * Full recalculation of all derive metrics
     */
    private static calculateDerivatives(m: any, c: any) {
        const f = m.financials;
        const counts = m.counts;

        // Ticket & Conv
        f.averageTicket = counts.orders > 0 ? f.revenueConfirmed / counts.orders : 0;
        m.rates.convRate = counts.visitors > 0 ? (counts.orders / counts.visitors) * 100 : 0;

        // Fact Entreg (Only in DELIVERED view really, but we map it here)
        f.revenueReal = f.revenueReal || 0; // Usually set by shopifyBlock or logisticsBlock

        // Profit Math
        const totalVariableCosts = f.cogs + f.shipping + f.returnLoss + (f.communicationCost || 0) + (f.storeExpenses || 0);
        f.netProfit = f.revenueReal - (totalVariableCosts + f.spendAds);
        f.directProfit = f.revenueConfirmed - (totalVariableCosts + f.spendAds);

        // Margins
        m.rates.profitMargin = f.revenueReal > 0 ? (f.netProfit / f.revenueReal) * 100 : 0;
        m.rates.roasReal = f.spendAds > 0 ? f.revenueReal / f.spendAds : 0;

        // Operations Rates
        m.rates.deliveryRate = counts.confirmed > 0 ? (counts.delivered / counts.confirmed) * 100 : 0;
        m.rates.shipmentRate = counts.orders > 0 ? (counts.confirmed / counts.orders) * 100 : 0;
        m.rates.recoveryRate = counts.incidents > 0 ? (counts.recovered / counts.incidents) * 100 : 0;
        m.rates.incidenceRate = counts.confirmed > 0 ? (counts.incidents / counts.confirmed) * 100 : 0;

        return m;
    }

    private static getEmptyMetrics() {
        return {
            counts: { lpv: 0, clicks: 0, orders: 0, units: 0, confirmed: 0, cancelled: 0, delivered: 0, returned: 0, incidents: 0, recovered: 0 },
            financials: { spendAds: 0, revenueConfirmed: 0, revenueReal: 0, averageTicket: 0, cogs: 0, shipping: 0, returnLoss: 0, communicationCost: 0, storeExpenses: 0, netProfit: 0, directProfit: 0 },
            rates: { convRate: 0, roasReal: 0, profitMargin: 0, deliveryRate: 0, shipmentRate: 0, recoveryRate: 0, incidenceRate: 0 },
            profitStatus: 'REAL'
        };
    }


    private static getEmptyCompleteness(): DataCompleteness {
        return { shopify: 'MISSING', ads: 'MISSING', logistics: 'MISSING', costs: 'MISSING' };
    }

    private static mergeBlockData(current: any, block: keyof DataCompleteness, data: any) {
        if (block === 'shopify') {
            current.counts.orders = data.orders;
            current.counts.units = data.units;
            current.counts.lpv = data.lpv;
            current.counts.clicks = data.clicks;
            current.counts.confirmed = data.confirmed;
            current.counts.cancelled = data.cancelled;
            current.financials.revenueConfirmed = data.revenueConfirmed;
            if (data.revenueReal) current.financials.revenueReal = data.revenueReal;
        } else if (block === 'ads') {
            current.financials.spendAds = data.spendAds;
        } else if (block === 'logistics') {
            current.counts.delivered = data.delivered;
            current.counts.returned = data.returned;
            current.counts.incidents = data.incidents;
            current.counts.recovered = data.recovered;
            current.financials.shipping = data.shipping;
            current.financials.returnLoss = data.returnLoss;
        } else if (block === 'costs') {
            current.financials.cogs = data.cogs;
            current.profitStatus = data.profitStatus;
        }
        return current;
    }


    private static calculateTotalCosts(m: any) {
        const f = m.financials;
        return f.cogs + f.shipping + f.returnLoss + (f.communicationCost || 0) + (f.storeExpenses || 0);
    }

    private static isSnapshotComplete(c: DataCompleteness) {
        return c.shopify === 'OK' && c.ads === 'OK' && c.logistics === 'OK' && c.costs === 'OK';
    }

    /**
     * Aggregates snapshots for a month, merging both views.
     */
    static async getMonthlySummary(storeId: string, month: number, year: number) {
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(start);

        const snapshots = await prisma.dailySnapshot.findMany({
            where: {
                storeId,
                date: { gte: start, lte: end }
            },
            orderBy: { date: 'asc' }
        });

        const dayMap = new Map<string, { date: Date, created: any, delivered: any }>();

        snapshots.forEach(s => {
            const d = new Date(s.date);
            const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

            if (!dayMap.has(dateKey)) {
                dayMap.set(dateKey, { date: s.date, created: null, delivered: null });
            }
            const entry = dayMap.get(dateKey)!;
            if (s.view === 'ORDERS_CREATED') entry.created = s;
            else if (s.view === 'DELIVERED') entry.delivered = s;
        });

        const fullDays = Array.from(dayMap.values()).map(d => {
            const c = d.created;
            const dv = d.delivered;

            const cM = JSON.parse(c?.metricsJson || '{}');
            const dM = JSON.parse(dv?.metricsJson || '{}');

            // Merge for UI
            const mergedMetrics = {
                ...cM,
                counts: {
                    ...(cM.counts || {}),
                    delivered: dM.counts?.delivered || 0,
                    returned: dM.counts?.returned || 0,
                },
                financials: {
                    ...(cM.financials || {}),
                    revenueReal: dM.financials?.revenueReal || 0,
                    netProfit: dM.financials?.netProfit || 0
                }
            };

            return {
                id: c?.id || dv?.id,
                date: d.date,
                spendAds: c?.spendAds || 0,
                revenueReal: dv?.revenueReal || 0,
                netProfit: dv?.netProfit || 0,
                deliveryRate: dv?.deliveryRate || (c?.deliveryRate || 0),
                isComplete: (c?.isComplete && dv?.isComplete) || false,
                status: dv?.status || c?.status || 'NEUTRAL',
                metricsJson: JSON.stringify(mergedMetrics)
            };
        });

        // Totals
        const totals: any = {
            revenueReal: 0, netProfit: 0, spendAds: 0, orders: 0, delivered: 0,
            confirmed: 0, cancelled: 0, returned: 0, lpv: 0, clicks: 0, units: 0,
            revenueConfirmed: 0, cogs: 0, shipping: 0, returnLoss: 0
        };


        fullDays.forEach(day => {
            const m = JSON.parse(day.metricsJson);
            totals.revenueReal += (day.revenueReal || 0);
            totals.netProfit += (day.netProfit || 0);
            totals.spendAds += (day.spendAds || 0);
            totals.orders += (m.counts?.orders || 0);
            totals.delivered += (m.counts?.delivered || 0);
            totals.confirmed += (m.counts?.confirmed || 0);
            totals.cancelled += (m.counts?.cancelled || 0);
            totals.returned += (m.counts?.returned || 0);
            totals.lpv += (m.counts?.lpv || 0);
            totals.clicks += (m.counts?.clicks || 0);
            totals.units += (m.counts?.units || 0);
            totals.revenueConfirmed += (m.financials?.revenueConfirmed || 0);
            totals.cogs += (m.financials?.cogs || 0);
            totals.shipping += (m.financials?.shipping || 0);
            totals.returnLoss += (m.financials?.returnLoss || 0);

        });

        const averages = {
            roasReal: totals.spendAds > 0 ? totals.revenueReal / totals.spendAds : 0,
            profitPercent: totals.revenueReal > 0 ? (totals.netProfit / totals.revenueReal) * 100 : 0,
            deliveryRate: totals.confirmed > 0 ? (totals.delivered / totals.confirmed) * 100 : 0,
            roasConfirmed: totals.spendAds > 0 ? totals.revenueConfirmed / totals.spendAds : 0,
        };

        return { days: fullDays, totals, averages };
    }

    /**
     * Unified Synchronizer for a single day
     */
    static async generateDailySnapshot(storeId: string, date: Date, forceAds = false) {
        const views: SnapshotView[] = ['ORDERS_CREATED', 'DELIVERED'];
        for (const view of views) {
            await this.syncShopifyBlock(storeId, date, view);
            await this.syncAdsBlock(storeId, date, view, forceAds);
            await this.syncLogisticsBlock(storeId, date, view);
            await this.syncCostsBlock(storeId, date, view);
        }
    }

    /**
     * FULL REBUILD: Guarantees 1 row per day from start to end.
     */
    static async rebuildFullHistory(storeId: string, startStr = "2025-09-01") {
        const start = startOfDay(fromZonedTime(new Date(startStr), TIMEZONE));
        const end = endOfDay(toZonedTime(new Date(), TIMEZONE));

        const days = eachDayOfInterval({ start, end });
        console.log(`[SnapshotService] FULL REBUILD: Processing ${days.length} days for store ${storeId}...`);

        for (const day of days) {
            try {
                // Ensure daily logic uses correct bounds
                await this.generateDailySnapshot(storeId, day);
            } catch (e) {
                console.error(`[SnapshotService] Rebuild failed for ${day.toISOString()}:`, e);
            }
        }
        console.log(`[SnapshotService] FULL REBUILD COMPLETED.`);
    }

    /**
     * Backfills snapshots for a date range.
     */
    static async generateRangeSnapshots(storeId: string, start: Date, end: Date) {
        const days = eachDayOfInterval({ start, end });
        for (const day of days) {
            try {
                await this.generateDailySnapshot(storeId, day);
            } catch (e) { }
        }
    }
}

