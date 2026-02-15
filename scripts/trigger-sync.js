require('dotenv').config();
const { syncRecentShopifyOrders } = require('../src/app/logistics/orders/actions');

async function main() {
    console.log('Starting sync...');
    try {
        const result = await syncRecentShopifyOrders(20);
        console.log('Sync Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Sync error:', e);
    }
}

main().catch(console.error);
