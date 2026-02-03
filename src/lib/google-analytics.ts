export class GoogleAnalyticsClient {
    private accessToken: string;
    private propertyId: string;

    constructor(accessToken: string, propertyId: string) {
        this.accessToken = accessToken;
        this.propertyId = propertyId;
    }

    async getVisitors(days = 30) {
        const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
                metrics: [{ name: 'activeUsers' }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("GA4 API Error:", JSON.stringify(err));
            // Just return 0 on error to avoid crashing the whole dashboard
            return 0;
        }

        const data = await response.json();
        return parseInt(data.rows?.[0]?.metricValues?.[0]?.value || "0");
    }

    async getPageViews(days = 30) {
        const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
                metrics: [{ name: 'screenPageViews' }]
            })
        });

        if (!response.ok) return 0;

        const data = await response.json();
        return parseInt(data.rows?.[0]?.metricValues?.[0]?.value || "0");
    }
}
