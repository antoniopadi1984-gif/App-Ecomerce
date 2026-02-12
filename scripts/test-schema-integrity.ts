
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
    console.log("🧪 TESTING SCHEMA INTEGRITY...");

    // 1. Find a valid version or project
    const project = await prisma.researchProject.findFirst();
    if (!project) {
        console.log("SKIP: No project to attach to.");
        return;
    }

    const versionId = "test-schema-" + Date.now();

    // Create a dummy version to link to
    await prisma.researchVersion.create({
        data: {
            id: versionId,
            projectId: project.id,
            versionNumber: 999,
        }
    });

    console.log(`Created dummy version: ${versionId}`);

    try {
        // 2. Try to create ResearchOutput with the SAME fields as Orchestrator
        await prisma.researchOutput.create({
            data: {
                versionId: versionId,
                macroAvatarSheet: "{}",
                languageBank: "{}",
                productIntelligence: "{}",
                competitorBreakdown: "{}",
                creativeInsights: "{}",
                economicsJson: "{}",
                marketSophisticationJson: "{}",
                // Removed: competitorIntelJson, hookAngleDb
                exportsMarkdown: "Pending",
                exportsJson: "{}"
            }
        });
        console.log("✅ SUCCESS: ResearchOutput created matching Orchestrator fields.");
    } catch (e: any) {
        console.error("❌ FAIL: Schema Mismatch detected.");
        console.error(e.message);
    } finally {
        // Cleanup
        try {
            await prisma.researchOutput.deleteMany({ where: { versionId } });
            await prisma.researchVersion.delete({ where: { id: versionId } });
            console.log("🧹 Cleanup done.");
        } catch (e) { }
    }
}

testSchema();
