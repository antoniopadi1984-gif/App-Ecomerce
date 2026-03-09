/**
 * EcomBoom API Client for Extension (MV3 Fetch version)
 */

export class ApiClient {
    constructor(baseUrl = "http://localhost:3000") {
        this.baseUrl = baseUrl;
    }

    /**
     * Send caught competitor video / image to inbox
     */
    async sendCompetitorAsset(payload) {
        console.log("[ApiClient] Reporting asset to EcomBoom:", payload);

        // Use consolidated competence API
        const endpoint = `${this.baseUrl}/api/centro-creativo/competencia`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: payload.url,
                    productId: payload.productId,
                    storeId: payload.storeId || 'GLOBAL',
                    meta: payload.meta,
                    source: "EXTENSION_SPY"
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Network error");
            }

            return await res.json();
        } catch (err) {
            console.error("[ApiClient] ❌ Error reporting to dashboard:", err);
            throw err;
        }
    }

    /**
     * Report landing page clone assets
     */
    async sendLandingClone(payload) {
        console.log("[ApiClient] Reporting landing clone data:", payload);
        const endpoint = `${this.baseUrl}/api/extension/clone-landing`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) {
            console.error("[ApiClient] ❌ Error sending clone data:", err);
            throw err;
        }
    }
}
