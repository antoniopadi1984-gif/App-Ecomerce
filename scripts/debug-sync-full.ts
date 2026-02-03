
import { MetaAdsService } from '../src/lib/marketing/meta-ads';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.META_ACCESS_TOKEN;

async function main() {
    console.log('🔍 Starting Deep Sync Debug...');

    if (!TOKEN) {
        console.error('❌ NO TOKEN FOUND');
        return;
    }
    console.log('🔑 Token Prefix:', TOKEN.substring(0, 10));

    const service = new MetaAdsService(TOKEN);

    try {
        // 1. Get Accounts
        console.log('\n📡 Fetching Ad Accounts...');
        const accounts = await service.getAdAccounts();
        console.log(`✅ Found ${accounts.length} accounts.`);

        if (accounts.length === 0) {
            console.log('⚠️ No accounts found. Check permissions.');
            return;
        }

        // 2. Fetch Insights for Today
        const acc = accounts[0];
        console.log(`\n🎯 Testing Account: ${acc.name} (${acc.id})`);

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        console.log(`📅 Date: ${dateStr} (today)`);

        console.log('\n📥 Fetching Campaign Level Insights...');
        // Mirrors IntradaySyncService logic
        const insights = await service.getInsights(acc.id, 'campaign', 'today'); // 'today' preset

        console.log(`✅ Raw Insights Count: ${insights.length}`);

        if (insights.length > 0) {
            console.log('\n📄 First Record Sample:');
            console.log(JSON.stringify(insights[0], null, 2));
        } else {
            console.log('⚠️ No insights returned for today.');
            console.log('Trying "lifetime" to verify ANY data...');
            const lifetime = await service.getInsights(acc.id, 'campaign', 'maximum');
            console.log(`Lifetime Count: ${lifetime.length}`);
        }

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
        if (e.response) {
            console.error('Response:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
