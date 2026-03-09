export class DropeaClient {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string, apiUrl: string = "https://api.dropea.com/v1") {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    }

    private async fetchDropea(endpoint: string, options: RequestInit = {}) {
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
            throw new Error(`Dropea API Error (${response.status}): ${error}`);
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

        return this.fetchDropea(`/orders?${queryParams.toString()}`);
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
            console.log(`[Dropea Sync] Fetching page ${page}...`);
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

    /**
     * POST /orders
     */
    async createOrder(orderData: any) {
        return this.fetchDropea("/orders", {
            method: "POST",
            body: JSON.stringify(orderData)
        });
    }

    /**
     * PUT /orders/{id}
     */
    async updateOrder(externalId: string, data: any) {
        return this.fetchDropea(`/orders/${externalId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE /orders/{id} or POST /cancel
     */
    async cancelOrder(externalId: string) {
        // Dropea usually uses POST /cancel or similar, if not supported throw
        try {
            return await this.fetchDropea(`/orders/${externalId}/cancel`, {
                method: "POST"
            });
        } catch (e) {
            throw new Error(`Dropea no soporta cancelación directa para el ID ${externalId}`);
        }
    }

    /**
     * Map Dropea Status to Internal Status
     */
    static mapStatus(dropeaStatus: string): string {
        const s = (dropeaStatus || '').toUpperCase();
        if (s === 'DELIVERED' || s === 'ENTREGADO') return 'DELIVERED';
        if (s === 'RETURNED' || s === 'DEVOLUCION' || s === 'RECHAZADO') return 'RETURNED';
        if (s === 'SHIPPED' || s === 'ENVIADO' || s === 'EN_CAMINO') return 'IN_TRANSIT';
        if (s === 'INCIDENCE' || s === 'INCIDENCIA') return 'INCIDENCE';
        if (s === 'PROCESANDO' || s === 'PREPARANDO') return 'PREPARING';
        if (s === 'LISTO' || s === 'READY') return 'READY';
        return 'PENDING';
    }
}
