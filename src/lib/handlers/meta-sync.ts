
import { prisma } from "@/lib/prisma";
import { getMetaAdsService } from "@/lib/marketing/meta-ads";
import { encrypt } from "@/lib/security";

export async function metaSyncAccounts(payload: { storeId: string }) {
    const { storeId } = payload;
    const db = prisma as any;

    console.log(`📡 [Job] Starting META_SYNC_ACCOUNTS for Store: ${storeId}`);

    try {
        const metaService = await getMetaAdsService(db, storeId);
        const accounts = await metaService.getAdAccounts();

        console.log(`✅ Found ${accounts.length} Ad Accounts for Meta.`);

        // Upsert into Connections or a specific table if we wanted to select them
        // For now, we update the Connection to store account list in extraConfig
        await db.connection.update({
            where: { storeId_provider: { storeId, provider: 'META_ADS' } },
            data: {
                extraConfig: JSON.stringify({ accounts }),
                lastSyncedAt: new Date(),
                isActive: true
            }
        });

        return { success: true, count: accounts.length };
    } catch (error: any) {
        console.error(`❌ [Job] META_SYNC_ACCOUNTS failed:`, error.message);
        throw error;
    }
}
