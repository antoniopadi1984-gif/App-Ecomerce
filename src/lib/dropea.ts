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
     * GET /orders/{id}
     */
    async getOrder(externalId: string) {
        return this.fetchDropea(`/orders/${externalId}`);
    }

    /**
     * Map Dropea Status to Internal Status
     */
    static mapStatus(dropeaStatus: string): string {
        const s = dropeaStatus.toUpperCase();
        if (s === 'DELIVERED') return 'DELIVERED';
        if (s === 'RETURNED' || s === 'DEVOLUCION') return 'RETURNED';
        if (s === 'SHIPPED' || s === 'ENVIADO') return 'IN_TRANSIT';
        if (s === 'INCIDENCE' || s === 'INCIDENCIA') return 'INCIDENCE';
        return 'PENDING';
    }
}
