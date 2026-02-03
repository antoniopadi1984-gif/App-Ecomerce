
/**
 * Marketing Metrics Utility
 * Standardizes Meta and TikTok data and calculates derived KPIs.
 */

export interface NormalizedMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    video_3s_views: number;
    video_50pct_views: number;
    landing_page_views: number;
    add_to_cart: number;
    initiate_checkout: number;
    purchases: number;
    revenue: number;
}

export interface CalculatedMetrics extends NormalizedMetrics {
    cpc: number;
    ctr: number;
    roas: number;
    hook_rate: number;
    hold_rate_50: number;
    atc_rate: number;
    checkout_rate: number;
    purchase_rate: number;
}

/**
 * Normalizes raw platform data into a standard structure.
 */
export function normalizeMarketingMetrics(raw: any, platform: 'META' | 'TIKTOK'): NormalizedMetrics {
    if (platform === 'META') {
        return {
            spend: parseFloat(raw.spend || 0),
            impressions: parseInt(raw.impressions || 0),
            clicks: parseInt(raw.inline_link_clicks || raw.clicks || 0),
            video_3s_views: parseInt(raw.video_3s_watched_actions?.[0]?.value || 0),
            video_50pct_views: parseInt(raw.video_p50_watched_actions?.[0]?.value || 0),
            landing_page_views: parseInt(raw.landing_page_view || 0),
            add_to_cart: parseInt(raw.add_to_cart || 0),
            initiate_checkout: parseInt(raw.initiate_checkout || 0),
            purchases: parseInt(raw.purchase || 0),
            revenue: parseFloat(raw.purchase_value || 0)
        };
    } else {
        // TIKTOK
        return {
            spend: parseFloat(raw.spend || 0),
            impressions: parseInt(raw.impressions || 0),
            clicks: parseInt(raw.clicks || 0),
            video_3s_views: parseInt(raw.video_views_p3 || 0),
            video_50pct_views: parseInt(raw.video_views_p50 || 0),
            landing_page_views: parseInt(raw.page_view || 0),
            add_to_cart: parseInt(raw.add_to_cart || 0),
            initiate_checkout: parseInt(raw.initiate_checkout || 0),
            purchases: parseInt(raw.complete_payment || 0),
            revenue: parseFloat(raw.complete_payment_value || 0)
        };
    }
}

/**
 * Calculates derived KPIs from normalized metrics.
 */
export function calculateMarketingKPIs(m: NormalizedMetrics): CalculatedMetrics {
    const safeDiv = (num: number, den: number) => den === 0 ? 0 : num / den;

    return {
        ...m,
        cpc: safeDiv(m.spend, m.clicks),
        ctr: safeDiv(m.clicks, m.impressions),
        roas: safeDiv(m.revenue, m.spend),
        hook_rate: safeDiv(m.video_3s_views, m.impressions),
        hold_rate_50: safeDiv(m.video_50pct_views, m.video_3s_views),
        atc_rate: safeDiv(m.add_to_cart, m.landing_page_views || m.clicks),
        checkout_rate: safeDiv(m.initiate_checkout, m.add_to_cart),
        purchase_rate: safeDiv(m.purchases, m.landing_page_views || m.clicks)
    };
}

/**
 * es-ES Formatting utilities
 */
export const metricsFormatter = {
    currency: (val: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val),

    percent: (val: number) =>
        new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val),

    ratio: (val: number, suffix = 'x') =>
        new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + suffix,

    number: (val: number) =>
        new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(val),

    display: (val: number | undefined | null, formatter: (v: number) => string) => {
        if (val === undefined || val === null || isNaN(val)) return '---';
        return formatter(val);
    }
};
