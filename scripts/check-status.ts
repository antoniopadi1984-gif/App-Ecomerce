
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
    console.log("🔍 CHECKING LATEST RESEARCH STATUS...");

    const project = await prisma.researchProject.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { versions: true }
    });

    if (!project) {
        console.log("❌ No projects found.");
        return;
    }

    console.log(`📂 Project: ${project.id} (Status: ${project.status})`);
    console.log(`   Latest Version ID in Project: ${project.latestVersionId}`);

    if (project.latestVersionId) {
        const output = await prisma.researchOutput.findUnique({
            where: { versionId: project.latestVersionId }
        });

        if (output) {
            console.log("✅ ResearchOutput FOUND!");
            console.log("   - DNA Length: " + (output.productIntelligence?.length || 0));
            console.log("   - VOC Length: " + (output.languageBank?.length || 0));
            console.log("   - Avatars Length: " + (output.macroAvatarSheet?.length || 0));
            console.log("   - ExportsJSON: " + (output.exportsJson ? "PRESENT" : "MISSING"));

            // Check for Validation Report inside exportsJson since we moved it there
            if (output.exportsJson) {
                const exports = JSON.parse(output.exportsJson);
                console.log("   - Validation Report (in exports): " + (exports.validation_report ? "PRESENT" : "MISSING"));
            }

        } else {
            console.log("❌ ResearchOutput MISSING for latest version.");
        }
    } else {
        console.log("⚠️ No latest version set on project.");
    }

    // Check Last 3 Runs
    const runs = await prisma.researchRun.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
    });

    console.log("\n🏃 LAST 3 RUNS:");
    runs.forEach(r => {
        const res = r.results ? JSON.parse(r.results as string) : {};
        console.log(`   - [${r.status}] ${r.id} (${r.currentPhase}/9) - %: ${res.completionPercentage}`);
    });
}

checkStatus();
