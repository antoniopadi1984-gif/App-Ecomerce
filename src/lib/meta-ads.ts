export class MetaAdsClient {
    private accessToken: string;
    private adAccountId: string;

    constructor(accessToken: string, adAccountId: string) {
        this.accessToken = accessToken;
        this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    }

    private async fetchMeta(endpoint: string) {
        const url = `https://graph.facebook.com/v18.0/${endpoint}&access_token=${this.accessToken}`;
        const res = await fetch(url);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Meta API Error: ${JSON.stringify(err)}`);
        }
        return res.json();
    }

    async getAdInsights(days = 30) {
        // Fetch insights grouped by ad_id
        const endpoint = `${this.adAccountId}/insights?level=ad&filtering=[{"field":"ad.impressions","operator":"GREATER_THAN","value":0}]&fields=ad_id,ad_name,spend,impressions,clicks,purchase_roas,actions&date_preset=last_${days}_days`;
        const data = await this.fetchMeta(endpoint);

        return data.data.map((item: any) => {
            const purchases = item.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;
            const revenue = item.actions?.find((a: any) => a.action_type === 'purchase_value' || a.action_type === 'offsite_conversion.fb_pixel_purchase_value')?.value || 0;

            return {
                adId: item.ad_id,
                adName: item.ad_name,
                spend: parseFloat(item.spend),
                impressions: parseInt(item.impressions),
                clicks: parseInt(item.clicks),
                purchases: parseInt(purchases),
                revenue: parseFloat(revenue),
                ctr: (parseInt(item.clicks) / parseInt(item.impressions)) * 100
            };
        });
    }

    async getCampaignInsights(days = 30) {
        const endpoint = `${this.adAccountId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,purchase_roas,actions&date_preset=last_${days}_days`;
        const data = await this.fetchMeta(endpoint);

        return data?.data?.map((item: any) => {
            const purchases = item.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;
            const revenue = item.actions?.find((a: any) => a.action_type === 'purchase_value' || a.action_type === 'offsite_conversion.fb_pixel_purchase_value')?.value || 0;

            return {
                campaignId: item.campaign_id,
                campaignName: item.campaign_name,
                spend: parseFloat(item.spend || "0"),
                impressions: parseInt(item.impressions || "0"),
                clicks: parseInt(item.clicks || "0"),
                purchases: parseInt(purchases),
                revenue: parseFloat(revenue),
                ctr: item.impressions > 0 ? (parseInt(item.clicks) / parseInt(item.impressions)) * 100 : 0,
                cpc: parseInt(item.clicks) > 0 ? parseFloat(item.spend) / parseInt(item.clicks) : 0
            };
        }) || [];
    }
}
