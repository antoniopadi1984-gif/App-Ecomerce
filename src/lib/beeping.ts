export class BeepingClient {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string, apiUrl: string = "https://app.gobeeping.com/api") {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    }

    private async fetchBeeping(endpoint: string, options: RequestInit = {}) {
        const url = `${this.apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        let authHeader = this.apiKey;
        if (authHeader && !authHeader.startsWith('Bearer ')) {
            authHeader = `Bearer ${authHeader}`;
        }

        console.log(`[Beeping API] ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": authHeader,
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[Beeping API Error] ${response.status}: ${error}`);
            throw new Error(`Beeping API Error (${response.status}): ${error}`);
        }

        return response.json();
    }

    async getOrders(params: { from_date?: string; per_page?: number; shop_id?: number | string; in?: string; page?: number } = {}) {
        const queryParams = new URLSearchParams();
        if (params.from_date) queryParams.append("from_date", params.from_date);
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.shop_id) queryParams.append("shop_id", params.shop_id.toString());
        if (params.in) queryParams.append("in", params.in);
        if (params.page) queryParams.append("page", params.page.toString());

        return this.fetchBeeping(`/get_orders?${queryParams.toString()}`);
    }

    async getAllOrders(onBatch?: (orders: any[]) => void) {
        let page = 1;
        let hasMore = true;
        let all: any[] = [];

        while (hasMore) {
            console.log(`[Beeping Sync] Fetching page ${page}...`);
            const response = await this.getOrders({ per_page: 100, page });
            const orders = Array.isArray(response) ? response : (response.data || []);

            if (orders.length === 0) {
                hasMore = false;
                break;
            }

            if (onBatch) await onBatch(orders);
            all = [...all, ...orders];

            const perPage = response.per_page || 100;
            const total = response.total || 0;

            if (total > 0) {
                if (all.length >= total) hasMore = false;
            } else {
                if (orders.length < 100) hasMore = false;
            }

            page++;
            if (page > 1000) break;
        }

        return all;
    }

    async getOrderDetails(externalId: string) {
        return this.fetchBeeping(`/order/${externalId}`);
    }

    async updateOrder(externalId: string, data: any, lines: any[]) {
        return this.fetchBeeping(`/order/${externalId}`, {
            method: "PUT",
            body: JSON.stringify({ data, lines })
        });
    }

    async createOrder(orderData: any) {
        return this.fetchBeeping("/order", {
            method: "POST",
            body: JSON.stringify(orderData)
        });
    }

    async markAsReady(externalId: string) {
        return this.fetchBeeping(`/order/${externalId}/confirm`, {
            method: "POST"
        });
    }

    async cancelOrder(externalId: string) {
        return this.fetchBeeping(`/order/${externalId}/cancel`, {
            method: "POST"
        });
    }

    // Normalización de estados EcomBoom PHASE 2 - Official Mapping (Spanish Labels & Priorities)
    static mapStatus(beepingOrder: any): string {
        const orderStatus = parseInt(beepingOrder.status);
        const shipmentStatus = parseInt(beepingOrder.order_shipment_status_id || beepingOrder.shipment_status);

        // Rule: Priority is Shipment status if available (order_shipment_status_id)
        const shipmentMap: Record<number, string> = {
            1: "Sin estado logístico",
            2: "En Tránsito",
            3: "En Reparto",
            4: "Punto de recogida",
            5: "Entregado",
            6: "Devuelto al remitente",
            7: "Cancelado",
            8: "Siniestro"
        };

        if (shipmentStatus && shipmentMap[shipmentStatus]) {
            return shipmentMap[shipmentStatus];
        }

        // Fallback: Order status (status)
        const orderMap: Record<number, string> = {
            1: "Pendiente",
            2: "Pendiente de stock",
            3: "En preparación",
            4: "Enviado",
            5: "Devuelto",
            6: "Por confirmar",
            0: "Cancelado"
        };

        if (orderStatus !== undefined && orderMap[orderStatus] !== undefined) {
            return orderMap[orderStatus];
        }

        return "Pendiente";
    }

    static mapCourier(courierId: number | string | null | undefined): string | null {
        const COURIER_MAP: Record<number | string, string> = {
            1: "Correos Express",
            3: "Correos",
            5: "GLS",
            9: "GLS-14",
            10: "GLS-19",
            11: "GLS Internacional",
        };
        if (!courierId) return null;
        return COURIER_MAP[courierId] || courierId.toString();
    }
}
