
import { getConnectionSecret } from '../server/connections';

const META_API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaAdAccount {
    id: string;
    name: string;
    currency: string;
    account_status: number;
}

/**
 * Meta Ads Service
 * Handles interaction with Meta Marketing API.
 */
export class MetaAdsService {
    constructor(private accessToken: string) { }

    private async fetch(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`${BASE_URL}/${endpoint}`);
        url.searchParams.append('access_token', this.accessToken);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.error) {
            console.error('🛑 [Meta API Error]', data.error);
            throw new Error(data.error.message || 'Meta API Error');
        }

        return data;
    }

    /**
     * List accessible Ad Accounts
     */
    async getAdAccounts(): Promise<MetaAdAccount[]> {
        const data = await this.fetch('me/adaccounts', {
            fields: 'id,name,currency,account_status'
        });
        return data.data;
    }

    /**
     * Get Ad Objects (Campaigns, AdSets, Ads)
     */
    async getAdObjects(id: string, edge: 'campaigns' | 'adsets' | 'ads', fields: string = 'id,name') {
        const data = await this.fetch(`${id}/${edge}`, {
            fields,
            limit: '1000'
        });
        return data.data;
    }

    /**
     * Validate Token
     */
    async validateToken(): Promise<boolean> {
        try {
            // 1. Basic check
            await this.fetch('me', { fields: 'id' });
            // 2. Deep check: can we actually see any ad accounts?
            const accounts = await this.getAdAccounts();
            return !!(accounts && accounts.length > 0);
        } catch (e: any) {
            console.error('🛑 [Meta Token Validation Failed]', e.message);
            return false;
        }
    }


    /**
     * Get Insights for Account/Campaign/Adset/Ad
     */
    async getInsights(
        id: string,
        level: 'account' | 'campaign' | 'adset' | 'ad',
        timeRange?: { since: string, until: string } | string // 'today' or object
    ) {
        const params: Record<string, string> = {
            level,
            fields: [
                'account_id', 'account_name',
                'campaign_id', 'campaign_name',
                'adset_id', 'adset_name',
                'ad_id', 'ad_name',
                'spend', 'impressions', 'clicks', 'reach', 'frequency',
                'unique_clicks', 'inline_link_clicks', 'inline_link_click_ctr',
                'unique_inline_link_clicks', 'unique_inline_link_click_ctr',
                'outbound_clicks', 'unique_outbound_clicks', 'outbound_clicks_ctr',
                'cpc', 'cpm', 'cpp', 'ctr', 'unique_ctr',
                'cost_per_unique_click', 'cost_per_inline_link_click',
                'purchase_roas', 'website_ctr',
                'actions', 'action_values',
                'video_p25_watched_actions', 'video_p50_watched_actions',
                'video_p75_watched_actions', 'video_p100_watched_actions',
                'video_30_sec_watched_actions', 'video_thruplay_watched_actions',
                'quality_ranking', 'engagement_rate_ranking', 'conversion_rate_ranking',
                'objective', 'buying_type', 'canvas_avg_view_time'
            ].join(','),
        };

        if (typeof timeRange === 'string') {
            params.date_preset = timeRange;
        } else if (timeRange) {
            params.time_range = JSON.stringify(timeRange);
        } else {
            params.date_preset = 'today';
        }

        const data = await this.fetch(`${id}/insights`, params);
        return data.data;
    }
}

/**
 * Helper to get a Meta service instance for a store
 */
export async function getMetaAdsService(prisma: any, storeId: string): Promise<MetaAdsService> {
    const token = await getConnectionSecret(storeId, 'META_ADS');

    if (token) {
        return new MetaAdsService(token);
    }

    // Fallback to Env for development or global config
    const envToken = process.env.META_ACCESS_TOKEN;
    if (envToken) {
        return new MetaAdsService(envToken);
    }

    throw new Error('Meta Ads connection not configured (no dynamic connection or env token)');
}
