
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRun() {
    console.log("🔍 Checking latest Research Run...");
    const lastRun = await prisma.researchRun.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!lastRun) {
        console.log("❌ No runs found.");
        return;
    }

    console.log(`🆔 Run ID: ${lastRun.id}`);
    console.log(`📅 Created: ${lastRun.createdAt}`);
    console.log(`🚦 Status: ${lastRun.status}`);
    console.log(`📝 Logs:\n${lastRun.logs}`);
}

checkRun();
