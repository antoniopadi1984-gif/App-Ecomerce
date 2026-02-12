
import { JobHandler } from "../worker";
import { prisma } from "../prisma";
import { getMetaAdsService } from "../marketing/meta-ads";

const metaSyncAccountsHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        let storeId = payload.storeId;
        const db = prisma as any;

        if (!storeId) {
            const store = await db.store.findFirst();
            storeId = store?.id;
        }

        if (!storeId) {
            throw new Error("No store found to sync Meta accounts.");
        }

        console.log(`📡 [Worker] Starting META_SYNC_ACCOUNTS for Store: ${storeId}`);
        await onProgress(20);

        try {
            const metaService = await getMetaAdsService(db, storeId);
            const accounts = await metaService.getAdAccounts();

            console.log(`✅ Found ${accounts.length} Ad Accounts for Meta.`);
            await onProgress(80);

            await db.connection.upsert({
                where: { storeId_provider: { storeId, provider: 'META_ADS' } },
                update: {
                    extraConfig: JSON.stringify({ accounts }),
                    lastSyncedAt: new Date(),
                    isActive: true
                },
                create: {
                    storeId,
                    provider: 'META_ADS',
                    isActive: true,
                    lastSyncedAt: new Date(),
                    extraConfig: JSON.stringify({ accounts }),
                    // We don't store the raw env token in DB unless we want to "migrate" it, 
                    // but for tracking sync state, the record must exist.
                }
            });

            await onProgress(100);
            return { success: true, count: accounts.length };
        } catch (error: any) {
            console.error(`❌ [Worker] META_SYNC_ACCOUNTS failed:`, error.message);
            throw error;
        }
    }
};

export default metaSyncAccountsHandler;
