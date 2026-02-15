import { syncRecentShopifyOrders } from "../src/app/logistics/orders/actions";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Starting sync...");
    try {
        const result = await syncRecentShopifyOrders(20);
        console.log("Sync Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Sync error:", e);
    }
}

main().catch(console.error);
