
import { PrismaClient } from '@prisma/client';
import { ResearchOrchestrator } from '../src/lib/research/orchestrator';

const prisma = new PrismaClient();

async function forceRun() {
    console.log("🚀 Starting Force Run (Debug Mode)...");

    // 1. Get a product
    const product = await prisma.product.findFirst();
    if (!product) {
        console.error("❌ No products found.");
        return;
    }

    console.log(`🎯 Target Product: ${product.title} (${product.id})`);

    // 2. Instantiate Orchestrator
    const orchestrator = new ResearchOrchestrator(product.id);

    // 3. Run
    try {
        console.log("🚦 Triggering runFullResearch...");
        const result = await orchestrator.runFullResearch();
        console.log("✅ Result:", result);

        const run = await prisma.researchRun.findFirst({
            where: { productId: product.id },
            orderBy: { createdAt: 'desc' }
        });
        console.log("📝 Final Logs:\n", run?.logs);

    } catch (e: any) {
        console.error("🔥 CRITICAL ERROR:", e);
    }
}

forceRun();
