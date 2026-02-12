
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
    console.log("🔍 CHECKING LATEST RESEARCH STATUS (VERBOSE)...");

    const runs = await prisma.researchRun.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' }
    });

    if (runs.length === 0) {
        console.log("❌ No runs found.");
        return;
    }

    const r = runs[0];
    console.log(`🏃 LATEST RUN: ${r.id}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Phase: ${r.currentPhase}`);

    // Parse results length
    const res = r.results ? JSON.parse(r.results as string) : {};
    console.log(`   Results Keys: ${Object.keys(res).join(', ')}`);

    console.log("\n📜 INTERNAL LOGS (Last 20 lines):");
    const logs = (r.logs || "").split('\n').filter(l => l.trim().length > 0);
    console.log(logs.slice(-20).join('\n'));
}

checkStatus();
