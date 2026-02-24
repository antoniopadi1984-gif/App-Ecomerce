import 'dotenv/config'; // Load .env file automatically
import { syncShopifyProducts, syncRecentShopifyOrders } from './src/app/pedidos/actions';

async function main() {
    console.log('--- STARTING ALECARE SHOP SYNC ---');
    const storeId = 'cmlxrad5405b826d99j9kpgyy'; // AleCare Shop

    console.log('Syncing products...');
    const pRes = await syncShopifyProducts(storeId);
    console.log('Products result:', pRes);

    console.log('\nSyncing recent orders...');
    const oRes = await syncRecentShopifyOrders(storeId);
    console.log('Orders result:', oRes);

    console.log('\n--- SYNC COMPLETED ---');
}

main().catch(console.error).then(() => process.exit(0));
