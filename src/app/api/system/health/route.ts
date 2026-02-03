
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkLocalEngineHealth } from '@/lib/health';
import { BeepingClient } from '@/lib/beeping';
import { ShopifyClient } from '@/lib/shopify';
import { MetaAdsService } from '@/lib/marketing/meta-ads';

export async function GET() {
    const health: any = {
        database: { status: 'OFF', message: 'Not checked' },
        worker: { status: 'OFF', message: 'No heartbeat' },
        engine: { status: 'OFF', message: 'Not responding' },
        shopify: { status: 'OFF', message: 'Not connected' },
        meta: { status: 'OFF', message: 'Not connected' },
        beeping: { status: 'OFF', message: 'Not configured' }
    };

    // 1. Database Check
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.database = { status: 'REAL', message: 'Connected' };
    } catch (e: any) {
        health.database = { status: 'OFF', message: e.message };
    }

    // 2. Worker Check (Heartbeat)
    try {
        const heartbeat = await (prisma as any).systemHeartbeat.findUnique({ where: { id: 'singleton' } });
        if (heartbeat) {
            const diff = Date.now() - new Date(heartbeat.timestamp).getTime();
            if (diff < 65000) { // 65s threshold for 1m interval
                health.worker = { status: 'REAL', message: 'Active' };
            } else {
                health.worker = { status: 'OFF', message: `Last heartbeat: ${Math.round(diff/1000)}s ago` };
            }
        }
    } catch (e: any) {
        health.worker = { status: 'OFF', message: 'Heartbeat table missing or error' };
    }

    // 3. Engine Python Check
    try {
        const res = await checkLocalEngineHealth();
        if (res.status === 'operational') {
            health.engine = { status: 'REAL', message: res.details || 'Operational' };
        } else {
            health.engine = { status: res.status === 'disabled' ? 'OFF' : 'PARCIAL', message: res.details || 'Not running' };
        }
    } catch (e) {
        health.engine = { status: 'OFF', message: 'Connection refused' };
    }

    // 4. Shopify Check
    try {
        const store = await (prisma as any).store.findFirst({ include: { connections: true } });
        const conn = store?.connections.find((c: any) => c.provider === 'SHOPIFY');
        if (conn?.apiKey) {
            const shopify = new ShopifyClient(conn.extraConfig, conn.apiKey);
            // Light call
            await shopify.getShop();
            health.shopify = { status: 'REAL', message: 'Connected' };
        }
    } catch (e: any) {
        health.shopify = { status: 'OFF', message: e.message };
    }

    // 5. Meta Check (Deep Check)
    try {
        const store = await (prisma as any).store.findFirst({ include: { connections: true } });
        const conn = store?.connections.find((c: any) => c.provider === 'META_ADS');
        if (conn?.accessToken) {
            const meta = new MetaAdsService(conn.accessToken); // We should use decryption if necessary but MetaAdsService constructor expects raw
            // Deep checks
            await meta.validateToken(); 
            const accounts = await meta.getAdAccounts();
            if (accounts && accounts.length > 0) {
                 // Try insight for first account
                 await meta.getInsights(accounts[0].id, 'account', 'today');
                 health.meta = { status: 'REAL', message: `${accounts.length} Accounts accessible` };
            } else {
                 health.meta = { status: 'PARCIAL', message: 'Token valid but no Ad Accounts found' };
            }
        }
    } catch (e: any) {
        health.meta = { status: 'OFF', message: e.message };
    }

    // 6. Beeping Check
    try {
        const apiKey = process.env.BEEPING_API_KEY;
        if (apiKey) {
            const client = new BeepingClient(apiKey);
            await client.getOrders({ per_page: 1 });
            health.beeping = { status: 'REAL', message: 'Configured' };
        }
    } catch (e: any) {
        health.beeping = { status: 'OFF', message: e.message };
    }

    return NextResponse.json(health);
}
