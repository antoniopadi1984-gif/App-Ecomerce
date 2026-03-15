// src/lib/17track.ts
// API v2.4 — https://api.17track.net/track/v2.4

const BASE_URL = 'https://api.17track.net/track/v2.4';

export class TrackSeventeenClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async post(endpoint: string, body: any) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                '17token': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (res.status === 429) throw new Error('17track: rate limit (3 req/s)');
        if (res.status === 401) throw new Error('17track: clave inválida o IP no en whitelist');
        if (!res.ok) throw new Error(`17track API error: ${res.status}`);

        return res.json();
    }

    // Registrar trackings (máx 40 por llamada)
    async register(trackings: Array<{
        number: string;
        tag?: string;           // útil para guardar el orderId de EcomBoom
        origin_country?: string;
        destination_country?: string;
        lang?: string;
    }>) {
        const data = await this.post('/register', trackings);
        return {
            accepted: data.data?.accepted || [],
            rejected: data.data?.rejected || [],
        };
    }

    // Obtener info de tracking (máx 40 por llamada)
    async getTrackInfo(trackings: Array<{ number: string; carrier?: number }>) {
        const data = await this.post('/gettrackinfo', trackings);
        return (data.data?.accepted || []).map((t: any) => this.parseTrackInfo(t));
    }

    // Forzar push manual (útil para depurar)
    async pushManual(trackings: Array<{ number: string; carrier?: number }>) {
        return this.post('/push', trackings);
    }

    // Parar tracking (pedidos entregados/cancelados)
    async stopTracking(trackings: Array<{ number: string; carrier?: number }>) {
        return this.post('/stoptrack', trackings);
    }

    // Verificar cuota disponible
    async getQuota() {
        const data = await this.post('/getquota', {});
        return data.data;
    }

    // Parsear respuesta de gettrackinfo al formato interno de EcomBoom
    parseTrackInfo(t: any) {
        const latestStatus = t.track_info?.latest_status;
        const latestEvent = t.track_info?.latest_event;
        const timeMetrics = t.track_info?.time_metrics;

        return {
            trackingNumber: t.number,
            carrier: t.carrier,
            status: this.normalizeStatus(latestStatus?.status),
            subStatus: latestStatus?.sub_status || null,
            lastDescription: latestEvent?.description || null,
            lastLocation: latestEvent?.location || null,
            lastUpdate: latestEvent?.time_utc || null,
            estimatedDelivery: timeMetrics?.estimated_delivery_date?.from || null,
            daysInTransit: timeMetrics?.days_of_transit || 0,
            daysWithoutUpdate: timeMetrics?.days_after_last_update || 0,
            delivered: latestStatus?.status === 'Delivered',
            returning: latestStatus?.status === 'Exception' &&
                       latestStatus?.sub_status?.includes('Return'),
        };
    }

    // Mapear status 17track → status interno EcomBoom
    normalizeStatus(status17: string): string {
        const map: Record<string, string> = {
            'NotFound':             'REGISTERED',
            'InfoReceived':         'REGISTERED',
            'InTransit':            'IN_TRANSIT',
            'Expired':              'INCIDENCE',
            'AvailableForPickup':   'PICKUP_POINT',
            'OutForDelivery':       'OUT_FOR_DELIVERY',
            'DeliveryFailure':      'DELIVERY_FAILED',
            'Delivered':            'DELIVERED',
            'Exception':            'INCIDENCE',
        };
        return map[status17] || 'IN_TRANSIT';
    }

    // Verificar firma del webhook (seguridad)
    static verifyWebhookSignature(body: string, signatureHeader: string, apiKey: string): boolean {
        const crypto = require('crypto');
        const content = `${body}/${apiKey}`;
        const calculated = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
        return calculated === signatureHeader;
    }
}

export function get17trackClient(store?: any): TrackSeventeenClient | null {
    const cfg = store?.extraConfig ? JSON.parse(store.extraConfig) : {};
    const apiKey = cfg.TRACK17_API_KEY || process.env.TRACK17_API_KEY;
    if (!apiKey) return null;
    return new TrackSeventeenClient(apiKey);
}
