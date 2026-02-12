
import { PrismaClient } from '@prisma/client';
import { ResearchOrchestrator } from '../src/lib/research/orchestrator';

const prisma = new PrismaClient();

async function testPersistence() {
    console.log("🕵️‍♂️ STARTING PHASE 0: PERSISTENCE AUDIT");

    // 1. Setup
    const product = await prisma.product.findFirst();
    if (!product) { console.error("❌ No products."); return; }
    console.log(`🎯 Product: ${product.title} (${product.id})`);

    const orchestrator = new ResearchOrchestrator(product.id);
    await (orchestrator as any).initializeProject(product);

    // 2. Inject PHASE 0 Payload (50+ items, strict schema)
    const TEST_TIMESTAMP = Date.now();
    const MOCK_PHRASES = Array.from({ length: 55 }, (_, i) => ({
        phrase: `Pain point #${i} - generated for audit`,
        meaning: `Deep meaning ${i}`,
        emotion: i % 2 === 0 ? "Frustration" : "Desire",
        evidence_id: `ev-${i}`,
        source_type: "amazon",
        source_ref: "http://test.com/ref",
        language: "es",
        cluster: "Pricing",
        frequency_score: 10
    }));

    console.log("---------------------------------------------------");
    console.log("🧾 WRITE RECEIPT");
    console.log("---------------------------------------------------");
    console.log(`Storage Namespace: ResearchRun (Postgres)`);
    console.log(`Dataset ID: Pending...`);
    console.log(`Record Count: ${MOCK_PHRASES.length}`);
    console.log(`Timestamp: ${new Date(TEST_TIMESTAMP).toISOString()}`);
    console.log("---------------------------------------------------");

    // Inject
    (orchestrator as any).ctx.data.voc = {
        dictionary: MOCK_PHRASES, // UI often uses dictionary or pain_stack, let's populate both to be safe or check orchestration
        pain_stack: [],
        desires: [],
        objections: [],
        phrases_by_emotion: [],
        prohibited_words: []
    };
    // ALSO populate pain_stack to cover all bases if UI reads that
    (orchestrator as any).ctx.data.voc.pain_stack = MOCK_PHRASES;


    // 3. Trigger Save
    console.log("💾 COMMITTING...");
    await (orchestrator as any).updateStatus(1, 10, `Phase 0 Audit ${TEST_TIMESTAMP}`);
    const runId = (orchestrator as any).runId;
    console.log(`Dataset ID (RunID): ${runId}`);

    // 4. READ BACK
    console.log("---------------------------------------------------");
    console.log("📖 READ BACK");
    console.log("---------------------------------------------------");

    const run = await prisma.researchRun.findUnique({ where: { id: runId } });
    if (!run) { console.error("❌ FAILURE: Run not found."); return; }

    const results = JSON.parse(run.results as string);
    // Determine where it landed
    const readVoc = results.voc?.pain_stack || results.voc?.dictionary || [];

    console.log(`Record Count Read: ${readVoc.length}`);
    if (readVoc.length > 0) {
        console.log(`Sample (first 3):`, JSON.stringify(readVoc.slice(0, 3), null, 2));
    } else {
        console.log("⚠️  PAYLOAD EMPTY OR MOVED.");
        console.log("Structure keys:", Object.keys(results.voc || {}));
    }

    // 5. VALIDATION
    if (readVoc.length === MOCK_PHRASES.length) {
        console.log("✅ SUCCESS: WRITE_COUNT == READ_COUNT");
        console.log("Root Cause: Persistence is functioning correctly for 50+ items.");
    } else {
        console.error(`🔥 FAILURE: Mismatch. Wrote ${MOCK_PHRASES.length}, Read ${readVoc.length}`);
    }
}

testPersistence();
