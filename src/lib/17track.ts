export class TrackSeventeenClient {
    private apiKey: string;
    private baseUrl = 'https://api.17track.net/track/v2.2';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async fetch17(endpoint: string, body: any) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                '17token': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`17track API Error: ${res.status}`);
        return res.json();
    }

    async registerTracking(trackings: { number: string; carrier?: string }[]) {
        return this.fetch17('/register', trackings.map(t => ({
            number: t.number,
            ...(t.carrier ? { carrier: t.carrier } : {})
        })));
    }

    async getTrackingStatus(trackingNumbers: string[]) {
        const data = await this.fetch17('/gettrackinfo',
            trackingNumbers.map(n => ({ number: n }))
        );
        return (data.data?.accepted || []).map((t: any) => ({
            trackingNumber: t.number,
            carrier: t.carrier,
            status: this.normalizeStatus(t.track?.z0?.z),
            lastEvent: t.track?.z0?.a,
            lastLocation: t.track?.z0?.c,
            lastUpdate: t.track?.z0?.d,
            delivered: t.track?.z0?.z === 40,
            events: (t.track?.z || []).map((e: any) => ({
                status: e.z,
                description: e.a,
                location: e.c,
                date: e.d,
            }))
        }));
    }

    private normalizeStatus(code: number): string {
        const map: Record<number, string> = {
            0:  'REGISTERED',
            10: 'IN_TRANSIT',
            20: 'CUSTOMS',
            25: 'UNDELIVERABLE',
            30: 'DELIVERY_FAILED',
            35: 'PICKUP_POINT',
            40: 'DELIVERED',
            50: 'RETURNED',
            60: 'CANCELLED',
        };
        return map[code] || 'IN_TRANSIT';
    }
}

export function get17trackClient(store: any): TrackSeventeenClient | null {
    const cfg = store.extraConfig ? JSON.parse(store.extraConfig) : {};
    const apiKey = cfg.TRACK17_API_KEY || process.env.TRACK17_API_KEY;
    if (!apiKey) return null;
    return new TrackSeventeenClient(apiKey);
}
