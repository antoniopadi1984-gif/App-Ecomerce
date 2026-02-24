
import { JobHandler } from "../worker";
import { syncShopifyHistory } from "../../app/pedidos/actions";
import prisma from "../prisma";

const shopifySyncHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        console.log("🚀 [Worker] Starting Automated Shopify Sync (Orders/History)...");

        await onProgress(10);

        // Get the first store as default if not provided
        let storeId = payload.storeId;
        if (!storeId) {
            const store = await (prisma as any).store.findFirst();
            storeId = store?.id;
        }

        if (!storeId) {
            throw new Error("No store found to sync Shopify data.");
        }

        await onProgress(20);

        // Call the deep sync action
        const result = await syncShopifyHistory(storeId);

        await onProgress(100);

        console.log(`✅ [Worker] Shopify Sync Completed: ${result.message}`);

        return result;
    }
};

export default shopifySyncHandler;
