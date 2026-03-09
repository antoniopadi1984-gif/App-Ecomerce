export class DropiClient {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string, apiUrl: string = "https://api.dropi.co/v1") {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    }

    private async fetchDropi(endpoint: string, options: RequestInit = {}) {
        const url = `${this.apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropi API Error (${response.status}): ${error}`);
        }

        return response.json();
    }

    /**
     * GET /orders
     */
    async getOrders(params: { page?: number; per_page?: number; from_date?: string; status?: string } = {}) {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.status) queryParams.append("status", params.status);

        // Actual implementation depends on Dropi.co API docs (usually /orders or /shipments)
        return this.fetchDropi(`/orders?${queryParams.toString()}`);
    }

    /**
     * Automatic pagination for full sync
     */
    async getAllOrders(onBatch?: (orders: any[]) => void) {
        let page = 1;
        const per_page = 100;
        let hasMore = true;
        let all: any[] = [];

        while (hasMore) {
            console.log(`[Dropi Sync] Fetching page ${page}...`);
            const response = await this.getOrders({ page, per_page });
            const orders = Array.isArray(response) ? response : (response.data || []);

            if (!orders || orders.length === 0) {
                hasMore = false;
                break;
            }

            if (onBatch) await onBatch(orders);
            all = [...all, ...orders];

            if (orders.length < per_page || page >= 500) {
                hasMore = false;
            }

            page++;
        }

        return all;
    }

    async getOrder(externalId: string) {
        return this.fetchDropi(`/shipments/${externalId}`);
    }

    async createOrder(orderData: any) {
        return this.fetchDropi("/orders", {
            method: "POST",
            body: JSON.stringify(orderData)
        });
    }

    static mapStatus(dropiStatus: string): string {
        const s = (dropiStatus || '').toUpperCase();
        if (s === 'ENTREGADO' || s === 'DELIVERED') return 'DELIVERED';
        if (s === 'DEVOLUCION' || s === 'RETURNED' || s === 'RECHAZADO') return 'RETURNED';
        if (s === 'EN_TRANSITO' || s === 'RECOGIDO' || s === 'IN_TRANSIT') return 'IN_TRANSIT';
        if (s === 'INCIDENCIA' || s === 'SINIESTRO') return 'INCIDENCE';
        return 'PENDING';
    }
}
