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
        if (authHeader && !authHeader.startsWith('Basic ') && !authHeader.startsWith('Bearer ')) {
            authHeader = `Basic ${authHeader}`;
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

            // Logic to determine if there are more pages. 
            // Usually if we get less than per_page, or if response has meta.
            const perPage = response.per_page || 100;
            const total = response.total || 0;

            if (total > 0) {
                if (all.length >= total) hasMore = false;
            } else {
                // If no total provided, stop if we got less than perPage
                if (orders.length < 100) hasMore = false;
            }

            page++;
            if (page > 1000) break; // Safety break
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

    static readonly STATUS_MAP: Record<number, string> = {
        1: "PENDING",           // Pendiente
        2: "STOCK_PENDING",     // Pendiente de stock
        3: "PREPARING",         // En preparación
        4: "SHIPPED",           // Enviado
        5: "RETURNED",          // Devuelto
        6: "PENDING",           // Por confirmar
        0: "CANCELLED"          // Cancelado
    };

    static readonly SHIPMENT_STATUS_MAP: Record<number, string> = {
        1: "NO_STATUS",         // Sin estado logístico
        2: "IN_TRANSIT",        // En Tránsito
        3: "OUT_FOR_DELIVERY",  // En Reparto
        4: "PICKUP_POINT",      // Punto de recogida
        5: "DELIVERED",         // Entregado
        6: "RETURN_TO_SENDER",  // Devuelto al Remitente
        7: "CANCELLED",         // Cancelado
        8: "ACCIDENT"           // Siniestro
    };

    static readonly COURIER_MAP: Record<number | string, string> = {
        1: "Correos Express",
        3: "Correos",
        5: "GLS",
        9: "GLS-14",
        10: "GLS-19",
        11: "GLS-Internacional",
    };

    static mapCourier(courierId: number | string | null | undefined): string | null {
        if (!courierId) return null;
        return this.COURIER_MAP[courierId] || courierId.toString();
    }

    static mapStatus(beepingOrder: any): string {
        const orderStatus = parseInt(beepingOrder.status);
        const shipmentStatus = parseInt(beepingOrder.order_shipment_status_id || beepingOrder.shipment_status);

        // Priority 1: Shipment status
        const shipmentMap: Record<number, string> = {
            1: "PENDING",
            2: "SHIPPED",
            3: "OUT_FOR_DELIVERY",
            4: "INCIDENCE",
            5: "DELIVERED",
            6: "RETURN_TO_SENDER",
            7: "CANCELLED",
            8: "ACCIDENT"
        };

        if (shipmentStatus && shipmentMap[shipmentStatus]) {
            return shipmentMap[shipmentStatus];
        }

        // Priority 2: Order status
        const orderMap: Record<number, string> = {
            1: "PENDING",
            2: "STOCK_PENDING",
            3: "PREPARING",
            4: "SHIPPED",
            5: "RETURNED",
            6: "PENDING",
            0: "CANCELLED"
        };

        if (orderStatus !== undefined && orderMap[orderStatus]) {
            return orderMap[orderStatus];
        }

        return "PROCESSING";
    }
}
