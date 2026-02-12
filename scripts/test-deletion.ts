
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDeletion(productId: string) {
    console.log(`🧪 TESTING ATOMIC RESET FOR PRODUCT: ${productId}`);

    try {
        // 0. Find Project ID
        const project = await (prisma as any).researchProject.findFirst({
            where: { productId: productId }
        });

        if (project) {
            console.log(`Found Project: ${project.id}`);
            // 1. Find Versions
            const versions = await (prisma as any).researchVersion.findMany({
                where: { projectId: project.id }
            });
            const versionIds = versions.map((v: any) => v.id);
            console.log(`Found Versions: ${versionIds.length}`);

            if (versionIds.length > 0) {
                // 2. Disconnect CreativeProjects (Blocker)
                console.log("Disconnecting CreativeProjects...");
                const cpUpdate = await (prisma as any).creativeProject.updateMany({
                    where: { researchVersionId: { in: versionIds } },
                    data: { researchVersionId: null }
                });
                console.log(`Updated ${cpUpdate.count} CreativeProjects`);

                // 3. Delete Outputs (Deepest dependency)
                console.log("Deleting Outputs...");
                const outDelete = await (prisma as any).researchOutput.deleteMany({
                    where: { versionId: { in: versionIds } }
                });
                console.log(`Deleted ${outDelete.count} Outputs`);

                // 4. Delete Versions
                console.log("Deleting Versions...");
                const vDelete = await (prisma as any).researchVersion.deleteMany({
                    where: { projectId: project.id }
                });
                console.log(`Deleted ${vDelete.count} Versions`);
            }

            // 5. Delete Project
            console.log("Deleting Project...");
            await (prisma as any).researchProject.delete({
                where: { id: project.id }
            });
            console.log("Deleted Project");
        }

        // 6. Delete Forensic Evidence
        console.log("Deleting EvidenceChunks...");
        const evDelete = await (prisma as any).evidenceChunk.deleteMany({
            where: { productId }
        });
        console.log(`Deleted ${evDelete.count} EvidenceChunks`);

        // 7. Delete Search Queries
        console.log("Deleting SearchQueries...");
        const sqDelete = await (prisma as any).searchQuery.deleteMany({
            where: { productId }
        });
        console.log(`Deleted ${sqDelete.count} SearchQueries`);

        // 8. Delete ResearchRuns
        console.log("Deleting ResearchRuns...");
        const rrDelete = await (prisma as any).researchRun.deleteMany({
            where: { productId }
        });
        console.log(`Deleted ${rrDelete.count} ResearchRuns`);

        // 9. Delete ResearchSources
        console.log("Deleting ResearchSources...");
        const rsDelete = await (prisma as any).researchSource.deleteMany({
            where: { productId }
        });
        console.log(`Deleted ${rsDelete.count} ResearchSources`);

        console.log("✅ RESET SUCCESSFUL");
    } catch (error: any) {
        console.error("❌ RESET FAILED");
        console.error("Error Message:", error.message);
        if (error.code) console.error("Prisma Error Code:", error.code);
        if (error.meta) console.error("Prisma Metadata:", JSON.stringify(error.meta, null, 2));
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get product ID from command line or use a fallback
const productId = process.argv[2];
if (!productId) {
    console.error("Please provide a product ID");
    process.exit(1);
}

testDeletion(productId);
