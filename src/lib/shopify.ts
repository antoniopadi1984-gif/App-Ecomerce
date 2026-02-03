export class ShopifyClient {
    private shop: string;
    private accessToken: string;

    constructor(shop: string, accessToken: string) {
        this.shop = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
        this.accessToken = accessToken;
    }

    private async fetchShopify(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`https://${this.shop}/admin/api/2024-01/${endpoint}`, {
            ...options,
            headers: {
                "X-Shopify-Access-Token": this.accessToken,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Shopify API Error: ${JSON.stringify(error)}`);
        }

        return response.json();
    }

    async getOrders(limit = 250, pageInfo?: string) {
        let endpoint = `orders.json?status=any&limit=${limit}`;
        if (pageInfo) {
            // Shopify pagination uses page_info exclusively if present
            endpoint = `orders.json?limit=${limit}&page_info=${pageInfo}`;
        }

        const response = await fetch(`https://${this.shop}/admin/api/2024-01/${endpoint}`, {
            headers: {
                "X-Shopify-Access-Token": this.accessToken,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Shopify API Error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        const linkHeader = response.headers.get("Link");

        return {
            orders: data.orders,
            nextPage: this.extractNextPageToken(linkHeader)
        };
    }

    async getAllAbandonedCheckouts(onBatch?: (checkouts: any[]) => void) {
        let pageInfo = null;
        let allCheckouts: any[] = [];

        do {
            let endpoint = pageInfo
                ? `abandoned_checkouts.json?limit=250&page_info=${pageInfo}`
                : `abandoned_checkouts.json?limit=250`;

            const response = await fetch(`https://${this.shop}/admin/api/2024-01/${endpoint}`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) break;

            const data = await response.json();
            const checkouts = data.checkouts || [];
            if (onBatch) await onBatch(checkouts);
            allCheckouts = [...allCheckouts, ...checkouts];

            const linkHeader = response.headers.get("Link");
            pageInfo = this.extractNextPageToken(linkHeader);
        } while (pageInfo);

        return allCheckouts;
    }

    async getAllDraftOrders(onBatch?: (drafts: any[]) => void) {
        let pageInfo = null;
        let allDrafts: any[] = [];

        do {
            let endpoint = pageInfo
                ? `draft_orders.json?limit=250&page_info=${pageInfo}`
                : `draft_orders.json?limit=250`;

            const response = await fetch(`https://${this.shop}/admin/api/2024-01/${endpoint}`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) break;

            const data = await response.json();
            const drafts = data.draft_orders || [];
            if (onBatch) await onBatch(drafts);
            allDrafts = [...allDrafts, ...drafts];

            const linkHeader = response.headers.get("Link");
            pageInfo = this.extractNextPageToken(linkHeader);
        } while (pageInfo);

        return allDrafts;
    }

    private extractNextPageToken(linkHeader: string | null) {
        if (!linkHeader) return null;
        const nextLink = linkHeader.split(",").find(l => l.includes('rel="next"'));
        if (!nextLink) return null;
        const urlMatch = nextLink.match(/<(.*)>/);
        if (!urlMatch) return null;
        const url = new URL(urlMatch[1]);
        return url.searchParams.get("page_info");
    }

    async getAllOrders(onBatch?: (orders: any[]) => void, options: { minDate?: string, maxDate?: string } = {}) {
        let pageInfo = null;
        let allOrders: any[] = [];

        do {
            let endpoint = "";
            if (pageInfo) {
                endpoint = `orders.json?limit=250&page_info=${pageInfo}`;
            } else {
                endpoint = `orders.json?status=any&limit=250`;
                if (options.minDate) endpoint += `&created_at_min=${options.minDate}`;
                if (options.maxDate) endpoint += `&created_at_max=${options.maxDate}`;
            }

            const response = await fetch(`https://${this.shop}/admin/api/2024-01/${endpoint}`, {
                headers: {
                    "X-Shopify-Access-Token": this.accessToken,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const err = await response.text();
                console.error(`Shopify Fetch Error (${endpoint}):`, err);
                break;
            }

            const data = await response.json();
            const orders = data.orders || [];

            if (onBatch) await onBatch(orders);
            allOrders = [...allOrders, ...orders];

            const linkHeader = response.headers.get("Link");
            pageInfo = this.extractNextPageToken(linkHeader);

            // Safety break for huge stores if needed, or logging
            if (pageInfo) console.log(`[Shopify Sync] Next Page Token found, continuing...`);

        } while (pageInfo);

        return allOrders;
    }

    async getOrderDetails(orderId: string) {
        return this.fetchShopify(`orders/${orderId}.json`);
    }

    async getProducts() {
        return this.fetchShopify("products.json");
    }

    async cancelOrder(orderId: string, reason: string = "customer") {
        return this.fetchShopify(`orders/${orderId}/cancel.json`, {
            method: "POST",
            body: JSON.stringify({
                reason: reason,
                note: "Anulado desde Nano Banana Maestro"
            }),
        });
    }

    async createWebhook(topic: string, address: string) {
        return this.fetchShopify("webhooks.json", {
            method: "POST",
            body: JSON.stringify({
                webhook: {
                    topic,
                    address,
                    format: "json",
                },
            }),
        });
    }

    async createPage(title: string, bodyHtml: string, handle: string, published: boolean = false) {
        return this.fetchShopify("pages.json", {
            method: "POST",
            body: JSON.stringify({
                page: {
                    title,
                    body_html: bodyHtml,
                    handle,
                    published
                }
            })
        });
    }
}
