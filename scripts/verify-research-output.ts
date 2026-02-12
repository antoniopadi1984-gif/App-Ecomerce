
import { prisma } from "../src/lib/prisma";

async function main() {
    const args = process.argv.slice(2);
    const productId = args[0];

    if (!productId) {
        console.error("Usage: npx ts-node scripts/verify-research-output.ts <productId>");
        process.exit(1);
    }

    console.log(`🔍 Verifying Research Output for Product: ${productId}`);

    const run = await (prisma as any).researchRun.findFirst({
        where: { productId, status: 'READY' },
        orderBy: { createdAt: 'desc' }
    });

    if (!run) {
        console.error("❌ No READY research run found for this product.");
        process.exit(1);
    }

    // Check for new structure
    if (!run?.results) {
        console.log("❌ No results JSON found.");
        return;
    }

    const results = JSON.parse(run.results);

    console.log("✅ Results parsed.");
    console.log(`- Truth Layer: ${results.truth_layer ? results.truth_layer.claims.length + ' claims' : 'MISSING ❌'}`);
    console.log(`- VOC: ${results.voc ? 'Present' : 'MISSING ❌'}`);
    console.log(`- Avatar Winner: ${results.avatar_scoring?.winner?.name || 'MISSING ❌'}`);
    console.log(`- Economics: ${results.economics ? results.economics.offer_simulations.length + ' offers' : 'MISSING ❌'}`);
    console.log(`- Claude Brief: ${results.claude_brief ? 'Present' : 'MISSING ❌'}`);

    if (results.truth_layer && results.avatar_scoring && results.economics && results.claude_brief) {
        console.log("\n✅ DEEP RESEARCH ENGINE INTEGRITY CHECK PASSED.");
    } else {
        console.log("\n⚠️ SOME MODULES ARE MISSING DATA.");
    }

    // 1. Verify Positioning
    if (results.positioning?.mass_desire && results.positioning?.dominant_avatar) {
        console.log("✅ Positioning: OK (Mass Desire + Dominant Avatar found)");
    } else {
        console.error("❌ Positioning: MISSING or Invalid Structure");
    }

    // 2. Verify Economics
    if (results.economics?.simulations?.length > 0 && results.economics?.rates?.net_delivery) {
        console.log(`✅ Economics: OK (${results.economics.simulations.length} simulations, Net Delivery Rate: ${results.economics.rates.net_delivery})`);
    } else {
        console.error("❌ Economics: MISSING or Invalid Structure");
    }

    // 3. Verify Logic: Claims with Evidence
    let claims = [];
    try {
        // Handle if claims are in truthLayer object or separate
        const truth = results.truthLayer || (run.truthLayer ? JSON.parse(run.truthLayer as string) : {});
        claims = truth.claims || [];
    } catch (e) { }

    const confirmedClaims = claims.filter((c: any) => c.status === 'CONFIRMED');
    const invalidConfirmed = confirmedClaims.filter((c: any) => !c.evidence_ids || c.evidence_ids.length === 0);

    if (invalidConfirmed.length > 0) {
        console.error(`❌ CRITICAL: Found ${invalidConfirmed.length} CONFIRMED claims WITHOUT evidence! (Smoke detected)`);
        invalidConfirmed.forEach(((c: any) => console.log(`   - "${c.claim.substring(0, 50)}..."`)));
    } else {
        console.log(`✅ Truth Layer: OK (${confirmedClaims.length} Confirmed Claims, all with evidence)`);
    }

    // 4. Verify Claude Brief Structure
    const brief = results.claudeBrief;
    if (brief && brief.landing_master && brief.offer_stack) {
        console.log("✅ Claude Brief: OK (Structured JSON with Landing Master + Offer Stack)");
    } else {
        console.error("❌ Claude Brief: MISSING or Invalid Structure (Might be old text format)");
    }

    console.log("\n--- Verification Complete ---");
}

main();
