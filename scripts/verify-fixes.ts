
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFixes() {
    console.log("🛡️ VERIFYING DEEP RESEARCH HARDENING FIXES...");
    const LOG_PREFIX = "[TEST-VERIFY]";

    // 1. Simular Orchestrator Save (Upsert + JSON Stringify)
    // We will verify that we can save a "ResearchOutput" with JSON data using the Logic we implemented

    // Create Dummy Project & Version
    const project = await prisma.researchProject.findFirst();
    if (!project) { console.log("⚠️ No project found to test."); return; }

    const versionId = "verify-fix-" + Date.now();
    await prisma.researchVersion.create({
        data: { id: versionId, projectId: project.id, versionNumber: 888 }
    });
    console.log(`${LOG_PREFIX} Created Test Version: ${versionId}`);

    const mockData = {
        avatar_scoring: { winner: "Avatar 1", score: 99 },
        voc: { pain_stack: ["pain1", "pain2"] },
        dna_forense: { mechanism: "Unique" },
        // ... other fields
    };

    // Simulate Orchestrator Logic (Local Copy of logic for testing)
    try {
        const dataPayload = {
            macroAvatarSheet: JSON.stringify(mockData.avatar_scoring),
            languageBank: JSON.stringify(mockData.voc),
            productIntelligence: JSON.stringify(mockData.dna_forense),
            competitorBreakdown: "{}",
            creativeInsights: "{}",
            economicsJson: "{}",
            marketSophisticationJson: "{}",
            exportsMarkdown: "Pending",
            exportsJson: JSON.stringify({ ...mockData, validation_report: { status: 'A' } })
        };

        // TEST 1: UPSERT (First Create)
        await prisma.researchOutput.upsert({
            where: { versionId: versionId },
            update: dataPayload,
            create: { versionId: versionId, ...dataPayload }
        });
        console.log(`${LOG_PREFIX} ✅ Test 1 Passed: Initial Upsert (Create)`);

        // TEST 2: UPSERT (Update)
        await prisma.researchOutput.upsert({
            where: { versionId: versionId },
            update: { ...dataPayload, exportsMarkdown: "Updated" },
            create: { versionId: versionId, ...dataPayload }
        });
        console.log(`${LOG_PREFIX} ✅ Test 2 Passed: Upsert Update (Idempotency)`);

        // TEST 3: READ & PARSE (UI Logic Simulation)
        const output = await prisma.researchOutput.findUnique({ where: { versionId } });
        if (!output) throw new Error("Output not found after save");

        const parsedExports = JSON.parse(output.exportsJson || "{}");
        if (parsedExports.validation_report?.status === 'A') {
            console.log(`${LOG_PREFIX} ✅ Test 3 Passed: Data Roundtrip & Parsing`);
        } else {
            console.error(`${LOG_PREFIX} ❌ Test 3 Failed: Data mismatch`);
        }

    } catch (e: any) {
        console.error(`${LOG_PREFIX} ❌ FAILED:`, e.message);
    } finally {
        // Cleanup
        await prisma.researchOutput.deleteMany({ where: { versionId } });
        await prisma.researchVersion.delete({ where: { id: versionId } });
        console.log(`${LOG_PREFIX} 🧹 Cleanup Complete`);
    }
}

verifyFixes();
