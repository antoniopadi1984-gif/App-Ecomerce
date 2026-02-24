import { prisma } from "@/lib/prisma";

/**
 * Cleanup function to remove legacy profiles and drafts.
 */
export async function cleanupLegacyAvatars(storeId?: string) {
    console.log("🧹 [Cleanup] Starting avatar cleanup...");
    try {
        const where: any = {
            OR: [
                { name: { contains: "Claudia" } },
                { name: "Avatar de Prueba" },
                { status: "DRAFT" },
                { lastError: { not: null } }
            ]
        };

        if (storeId) {
            where.storeId = storeId;
        }

        const result = await prisma.avatarProfile.deleteMany({ where });
        console.log(`✅ [Cleanup] Deleted ${result.count} profiles.`);
        return { success: true, deletedCount: result.count };
    } catch (error: any) {
        console.error("❌ [Cleanup] Error during legacy cleanup:", error.message);
        return { success: false, error: error.message };
    }
}
