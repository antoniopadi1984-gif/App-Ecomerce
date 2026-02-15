import { prisma } from "../prisma";

/**
 * Attribution Service
 * Handles extracting marketing data (UTMs, Click IDs) from Shopify orders.
 */
export class AttributionService {
    /**
     * Extracts marketing metadata from a raw Shopify order object.
     */
    static extractFromOrder(o: any) {
        const S = (v: any) => (v == null ? '' : String(v).trim());
        const norm = (s: string) => S(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const NA = Array.isArray(o.note_attributes) ? o.note_attributes : [];
        const LI = Array.isArray(o.line_items) ? o.line_items : [];

        const pickNA = (names: string[]) => {
            const want = names.map(norm);
            for (const kv of NA) {
                const k = norm(kv?.name || '');
                if (want.includes(k)) return S(kv?.value);
            }
            return '';
        };

        const getFromProps = (keys: string[]) => {
            const want = keys.map(norm);
            for (const li of LI) {
                const props = Array.isArray(li?.properties) ? li.properties : [];
                for (const p of props) {
                    const k = norm(p?.name || '');
                    if (want.includes(k)) return S(p?.value);
                }
            }
            return '';
        };

        const parseQS = (s: string) => {
            const out: any = {};
            const raw = S(s);
            if (!raw) return out;
            const q = raw.includes('?') ? raw.split('?')[1] : raw;
            if (!q) return out;
            for (const part of q.split('&')) {
                const [k, v = ''] = part.split('=');
                const kk = norm(decodeURIComponent(k || ''));
                const vv = decodeURIComponent(v.replace(/\+/g, ' '));
                if (kk) out[kk] = vv;
            }
            return out;
        };

        const getQS = (url: string, key: string) => parseQS(url)[norm(key)] || '';

        // Search keys
        const KEYS_SOURCE = ['utm_source', 'source', 'utm_site', 'site_source_name'];
        const KEYS_MEDIUM = ['utm_medium', 'medium', 'utm_medium'];
        const KEYS_CAMPAIGN = ['utm_campaign', 'campaign', 'campaign_name'];
        const KEYS_CONTENT = ['utm_content', 'content', 'utm_adset', 'adset_name'];
        const KEYS_TERM = ['utm_term', 'term', 'utm_ad', 'ad_name'];

        // Click IDs
        const landingUrl = S(o.landing_site);
        const fbclid = getQS(landingUrl, 'fbclid') || pickNA(['fbclid', 'fbc']);
        const gclid = getQS(landingUrl, 'gclid') || pickNA(['gclid', 'gac']);
        const ttclid = getQS(landingUrl, 'ttclid') || pickNA(['ttclid']);

        // --- STRICT ATTRIBUTION HIERARCHY ---
        const utmCampaign = pickNA(KEYS_CAMPAIGN) || getFromProps(KEYS_CAMPAIGN) || getQS(landingUrl, 'utm_campaign');
        const utmContent = pickNA(KEYS_CONTENT) || getFromProps(KEYS_CONTENT) || getQS(landingUrl, 'utm_content');
        const utmTerm = pickNA(KEYS_TERM) || getFromProps(KEYS_TERM) || getQS(landingUrl, 'utm_term');
        const utmMedium = pickNA(KEYS_MEDIUM) || getFromProps(KEYS_MEDIUM) || getQS(landingUrl, 'utm_medium');
        const utmSource = pickNA(KEYS_SOURCE) || getFromProps(KEYS_SOURCE) || getQS(landingUrl, 'utm_source');

        // Rule: If no UTMs valid -> NO ATTRIBUTED
        const hasUtms = !!(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);
        const finalSource = hasUtms ? (utmSource || 'direct') : 'NO ATTRIBUTED';

        return {
            utmSource: finalSource,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            utmContent: utmContent || null,
            utmTerm: utmTerm || null,
            fbclid: fbclid || null,
            gclid: gclid || null,
            ttclid: ttclid || null,
            landingSite: o.landing_site || null,
            referringSite: o.referring_site || null,
            referrer: o.referrer || null,
            clientDetails: o.client_details ? JSON.stringify(o.client_details) : null,
            rawNoteAttrs: o.note_attributes ? JSON.stringify(o.note_attributes) : null,
        };
    }

    /**
     * Creates or updates the attribution record for an order.
     */
    static async syncForOrder(orderId: string, rawOrder: any) {
        const data = this.extractFromOrder(rawOrder);
        return prisma.orderAttribution.upsert({
            where: { orderId },
            update: data,
            create: { ...data, orderId }
        });
    }
}
