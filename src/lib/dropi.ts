export class DroppiClient {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string, apiUrl: string = "https://api.droppi.com/v1") {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    }

    private async fetchDroppi(endpoint: string, options: RequestInit = {}) {
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
            throw new Error(`Droppi API Error (${response.status}): ${error}`);
        }

        return response.json();
    }

    async getOrder(externalId: string) {
        return this.fetchDroppi(`/shipments/${externalId}`);
    }

    static mapStatus(droppiStatus: string): string {
        const s = droppiStatus.toUpperCase();
        if (s === 'ENTREGADO') return 'DELIVERED';
        if (s === 'DEVOLUCION') return 'RETURNED';
        if (s === 'EN_TRANSITO' || s === 'RECOGIDO') return 'IN_TRANSIT';
        if (s === 'INCIDENCIA' || s === 'SINIESTRO') return 'INCIDENCE';
        return 'PENDING';
    }
}
