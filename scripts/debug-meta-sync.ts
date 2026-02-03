
import { MetaAdsService } from '../src/lib/marketing/meta-ads';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const token = process.env.META_ACCESS_TOKEN;
    console.log('Token starts with:', token?.substring(0, 10));

    if (!token) {
        throw new Error("No META_ACCESS_TOKEN in env");
    }

    const service = new MetaAdsService(token);

    try {
        console.log('Fetching Ad Accounts...');
        const accounts = await service.getAdAccounts();
        console.log('✅ Accounts found:', accounts.length);
        console.log(JSON.stringify(accounts, null, 2));

        if (accounts.length > 0) {
            const acc = accounts[0];
            console.log(`\nFetching insights for account ${acc.name} (${acc.id})...`);
            const insights = await service.getInsights(acc.id, 'account', 'today');
            console.log('✅ Insights:', JSON.stringify(insights, null, 2));
        }

    } catch (e: any) {
        console.error('❌ API Error:', e.message);
        if (e.response) {
            console.error('Response:', e.response.data);
        }
    }
}

main();
