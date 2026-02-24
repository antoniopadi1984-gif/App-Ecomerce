import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Child provider IDs that should NOT have their own DB rows
 * (they show as sub-icons on their parent card)
 */
const CHILD_PROVIDER_IDS = ['ANTHROPIC', 'VERTEX', 'GA4', 'GOOGLE_MAPS', 'GCP'];

/**
 * POST /api/connections/cleanup
 * 
 * Removes orphan DB rows that don't belong:
 * 1. 'GCP' rows (should be 'GOOGLE_CLOUD')
 * 2. Child providers that have parentProviderId
 */
export async function POST() {
    try {
        const children = await prisma.connection.findMany({
            where: { provider: { in: CHILD_PROVIDER_IDS } }
        });

        for (const child of children) {
            const PROVIDER_REGISTRY = (await import("@/lib/providers/registry")).PROVIDER_REGISTRY;
            const config = PROVIDER_REGISTRY[child.provider.toUpperCase()];
            const parentProvider = config?.parentProviderId?.toUpperCase();

            if (parentProvider) {
                // Check if parent already has a connection
                const existingParent = await prisma.connection.findUnique({
                    where: { storeId_provider: { storeId: child.storeId, provider: parentProvider } }
                });

                if (!existingParent) {
                    // Migrate this child to be the parent
                    await prisma.connection.update({
                        where: { id: child.id },
                        data: { provider: parentProvider }
                    });
                    console.log(`[Cleanup] Migrated ${child.provider} to ${parentProvider} (ID: ${child.id})`);
                    continue; // Skip deletion as it's now a parent
                }
            }
            // If we can't migrate (parent exists or no mapping), delete as before
            await prisma.connection.delete({ where: { id: child.id } });
        }

        const summary = {
            success: true,
            processedCount: children.length,
            childIds: CHILD_PROVIDER_IDS
        };

        console.log("🧹 [Cleanup]", summary);
        return NextResponse.json(summary);
    } catch (error: any) {
        console.error("[Cleanup] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
