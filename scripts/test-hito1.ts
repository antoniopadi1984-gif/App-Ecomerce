
import { generateMasterCopy } from "./src/lib/copy-hub-protocol";
import { validateContent } from "./src/lib/content-qa";
import { formatCreativeName } from "./src/lib/copy-hub-protocol";

async function testHito1() {
    console.log("--- TEST HITO 1: COPY HUB & COMPLIANCE ---");

    const productName = "Nano Banana Serum";
    const context = "AD_STATIC";
    const concept = "Beneficios Exagerados";

    console.log(`\nTest 1: Generación en MODO SEGURO (Ads)`);
    const safeCopy = await generateMasterCopy({
        productName,
        context: 'AD_STATIC',
        isSafeMode: true,
        researchData: { angles: "Juventud, Brillo" }
    });
    console.log("Output Seguro:", safeCopy);
    const qaSafe = validateContent(safeCopy, 'AD');
    console.log("QA Score (Safe):", qaSafe.score, qaSafe.passed ? "PASADO" : "FALLADO");

    console.log(`\nTest 2: Generación en MODO AGRESIVO (Landing)`);
    const aggressiveCopy = await generateMasterCopy({
        productName,
        context: 'LANDING_PAGE',
        isSafeMode: false,
        researchData: { angles: "Transformación radical" }
    });
    console.log("Output Agresivo:", aggressiveCopy);
    const qaAggressive = validateContent(aggressiveCopy, 'LANDING');
    console.log("QA Score (Aggressive):", qaAggressive.score, qaAggressive.passed ? "PASADO" : "FALLADO");

    console.log(`\nTest 3: Nomenclatura`);
    const name = formatCreativeName({
        product: "Serum Nano",
        concept: "Prueba Social",
        version: "v1",
        language: "es"
    });
    console.log("Nomenclatura Generada:", name);
}

// In a real environment we would use a test runner, here we simulate the run.
testHito1();
