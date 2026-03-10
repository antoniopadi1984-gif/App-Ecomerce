
import { getConnectionSecret } from '../server/connections';

const META_API_VERSION = 'v25.0';
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

    public async fetch(endpoint: string, params: Record<string, string> = {}, method: 'GET' | 'POST' = 'GET', body?: any) {
        const url = new URL(`${BASE_URL}/${endpoint}`);
        url.searchParams.append('access_token', this.accessToken);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        const options: RequestInit = {
            method,
            headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), options);
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
     * Optimized for January 2026 standards: No legacy attribution, no 10s video.
     */
    async getInsights(
        id: string,
        level: 'account' | 'campaign' | 'adset' | 'ad',
        dateRanges: string | { since: string, until: string } = 'last_7d'
    ) {
        const params: Record<string, string> = {
            level,
            fields: [
                'impressions', 'reach', 'frequency', 'spend', 'clicks', 'ctr', 'cpc', 'cpm',
                'actions', 'action_values', 'cost_per_action_type',
                'video_thruplay_watched_actions', 'video_p25_watched_actions',
                'video_p50_watched_actions', 'video_p75_watched_actions',
                'video_continuous_2_sec_watched_actions'
            ].join(','),
            action_attribution_windows: JSON.stringify([
                "1d_click", "7d_click", "28d_click", "1d_engaged_view"
            ])
        };

        if (typeof dateRanges === 'string') {
            params.date_preset = dateRanges;
        } else {
            params.time_range = JSON.stringify(dateRanges);
        }

        const data = await this.fetch(`${id}/insights`, params);
        return data.data;
    }

    /**
     * Upload Video to Meta
     * POST /{ad_account_id}/advideos
     */
    async uploadVideo(adAccountId: string, videoUrl: string, title: string) {
        const id = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const data = await this.fetch(`${id}/advideos`, {
            source: videoUrl,
            title
        }, 'POST');
        return data.id as string; // video_id
    }

    /**
     * Create AdCreative
     * POST /{ad_account_id}/adcreatives
     */
    async createAdCreative(adAccountId: string, options: {
        name: string,
        pageId: string,
        videoId: string,
        message: string,
        callToAction: string
    }) {
        const id = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const body = {
            name: options.name,
            object_story_spec: {
                page_id: options.pageId,
                video_data: {
                    video_id: options.videoId,
                    message: options.message,
                    call_to_action: {
                        type: options.callToAction,
                        value: { link: "https://your-store-link.com" } // Replace with landing_id logic later
                    }
                }
            }
        };
        const data = await this.fetch(`${id}/adcreatives`, {}, 'POST', body);
        return data.id as string; // creative_id
    }

    /**
     * Create Ad (Always first in PAUSED status)
     * POST /{ad_account_id}/ads
     */
    async createAd(adAccountId: string, options: {
        name: string,
        adsetId: string,
        creativeId: string
    }) {
        const id = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const data = await this.fetch(`${id}/ads`, {
            name: options.name,
            adset_id: options.adsetId,
            creative: JSON.stringify({ creative_id: options.creativeId }),
            status: "PAUSED"
        }, 'POST');
        return data.id as string; // ad_id
    }

    /**
     * Search Ads Library for Competition
     */
    async searchAdsLibrary(searchTerms: string) {
        const params = {
            search_terms: searchTerms,
            ad_type: 'ALL',
            ad_active_status: 'ACTIVE',
            fields: [
                'id', 'ad_creative_bodies', 'ad_creative_link_captions',
                'ad_creative_link_titles', 'page_name', 'page_id',
                'ad_delivery_start_time', 'ad_delivery_stop_time'
            ].join(',')
        };
        const data = await this.fetch('ads_archive', params);
        return data.data;
    }

    /**
     * Get Campaigns for Selector
     */
    async getCampaigns(adAccountId: string) {
        const id = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const data = await this.fetch(`${id}/campaigns`, {
            fields: 'id,name,status,objective'
        });
        return data.data;
    }

    /**
     * Get AdSets for Selector
     */
    async getAdSets(campaignId: string) {
        const data = await this.fetch(`${campaignId}/adsets`, {
            fields: 'id,name,status,daily_budget'
        });
        return data.data;
    }
}

/**
 * Helper to get a Meta service instance for a store
 */
export async function getMetaAdsService(prisma: any, storeId: string): Promise<MetaAdsService> {
    const token = await getConnectionSecret(storeId, 'META');

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
