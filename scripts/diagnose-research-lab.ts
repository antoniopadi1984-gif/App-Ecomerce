#!/usr/bin/env tsx

/**
 * RESEARCH LAB DIAGNOSTIC SCRIPT
 * 
 * Purpose: Validate complete data flow from executeResearchPipelineV3() to UI display
 * 
 * Checks:
 * 1. Database Records (ResearchRun vs ResearchProject/ResearchVersion)
 * 2. Data Completeness (all new forensic fields present)
 * 3. UI Status Logic (why cards show MISSING)
 * 4. Version Export Logic (is data being saved to v2 structure?)
 */

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('🔍 RESEARCH LAB DIAGNOSTIC REPORT\n');
    console.log('='.repeat(80));

    // 1. Check Products
    console.log('\n\n📦 PRODUCTS IN DATABASE:');
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    researchRuns: true,
                    researchProjects: true
                }
            }
        }
    });

    console.table(products.map(p => ({
        ID: p.id.substring(0, 8),
        Title: p.title,
        Status: p.status,
        'Research Runs': p._count.researchRuns,
        'Research Projects': p._count.researchProjects,
        Updated: new Date(p.updatedAt).toLocaleDateString()
    })));

    if (products.length === 0) {
        console.log('❌ NO PRODUCTS FOUND! Create a product first.');
        return;
    }

    const latestProduct = products[0];

    // 2. Check ResearchRuns (V3 saves here)
    console.log(`\n\n🏃 RESEARCH RUNS for "${latestProduct.title}":`);
    const runs = await (prisma.researchRun as any).findMany({
        where: { productId: latestProduct.id },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    console.log(`Found ${runs.length} research runs:`);
    runs.forEach((run: any, idx: number) => {
        console.log(`\n  Run ${idx + 1}:`);
        console.log(`    ID: ${run.id}`);
        console.log(`    Status: ${run.status}`);
        console.log(`    Created: ${new Date(run.createdAt).toLocaleString()}`);

        if (run.results) {
            try {
                const results = JSON.parse(run.results);
                console.log(`    ✅ Results JSON parsed successfully`);
                console.log(`    Fields present:`);
                console.log(`      - summary: ${results.summary ? '✅ (' + results.summary.split(' ').length + ' words)' : '❌'}`);
                console.log(`      - product_core: ${results.product_core ? '✅' : '❌'}`);
                console.log(`      - product_core.market_intelligence: ${results.product_core?.market_intelligence ? '✅' : '❌'}`);
                console.log(`      - dna_forense: ${results.dna_forense?.vehiculo ? '✅' : '❌'}`);
                console.log(`      - v3_desires: ${results.v3_desires ? '✅' : '❌'}`);
                console.log(`      - v3_desires.primary_emotional_hook: ${results.v3_desires?.primary_emotional_hook ? '✅ (' + results.v3_desires.primary_emotional_hook.split(' ').length + ' words)' : '❌'}`);
                console.log(`      - v3_desires.market_saturation_observation: ${results.v3_desires?.market_saturation_observation ? '✅ (' + results.v3_desires.market_saturation_observation.split(' ').length + ' words)' : '❌'}`);
                console.log(`      - v3_desires.white_space_opportunity: ${results.v3_desires?.white_space_opportunity ? '✅ (' + results.v3_desires.white_space_opportunity.split(' ').length + ' words)' : '❌'}`);
                console.log(`      - v3_desires.customer_internal_dialogue: ${results.v3_desires?.customer_internal_dialogue ? '✅ (' + results.v3_desires.customer_internal_dialogue.split(' ').length + ' words)' : '❌'}`);
                console.log(`      - truth_layer_v3: ${results.truth_layer_v3?.evidence?.length ? `✅ (${results.truth_layer_v3.evidence.length} evidence)` : '❌'}`);
                console.log(`      - v3_avatars: ${results.v3_avatars?.length ? `✅ (${results.v3_avatars.length} avatars)` : '❌'}`);
                console.log(`      - marketing_angles: ${results.marketing_angles?.angle_tree?.length ? `✅ (${results.marketing_angles.angle_tree.length} angles)` : '❌'}`);
                console.log(`      - v3_language_bank: ${results.v3_language_bank?.length ? `✅ (${results.v3_language_bank.length} banks)` : '❌'}`);
            } catch (e) {
                console.log(`    ❌ Results JSON parse error: ${e}`);
            }
        } else {
            console.log(`    ❌ NO RESULTS DATA`);
        }
    });

    // 3. Check ResearchProjects (V2 structure - UI prioritizes this!)
    console.log(`\n\n📊 RESEARCH PROJECTS (V2) for "${latestProduct.title}":`);
    const projects = await (prisma as any).researchProject.findMany({
        where: { productId: latestProduct.id },
        include: {
            versions: {
                include: {
                    outputs: true
                },
                orderBy: { createdAt: 'desc' },
                take: 3
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${projects.length} research projects:`);

    if (projects.length === 0) {
        console.log('  ❌ NO RESEARCH PROJECTS FOUND!');
        console.log('  💡 THIS IS THE PROBLEM: UI looks for data.researchProjects[0].versions[0]');
        console.log('  💡 executeResearchPipelineV3 saves to researchRun.results but NOT to ResearchProject/Version!');
    } else {
        projects.forEach((proj: any, idx: number) => {
            console.log(`\n  Project ${idx + 1}:`);
            console.log(`    ID: ${proj.id}`);
            console.log(`    Versions: ${proj.versions.length}`);

            proj.versions.forEach((ver: any, vIdx: number) => {
                console.log(`\n    Version ${vIdx + 1}:`);
                console.log(`      ID: ${ver.id}`);
                console.log(`      Version Number: ${ver.versionNumber}`);
                console.log(`      Created: ${new Date(ver.createdAt).toLocaleString()}`);

                if (ver.outputs) {
                    const out = ver.outputs;
                    console.log(`      Outputs:`);
                    console.log(`        - exportsJson: ${out.exportsJson ? '✅' : '❌'}`);
                    console.log(`        - productIntelligence: ${out.productIntelligence ? '✅' : '❌'}`);
                    console.log(`        - languageBank: ${out.languageBank ? '✅' : '❌'}`);
                    console.log(`        - macroAvatarSheet: ${out.macroAvatarSheet ? '✅' : '❌'}`);
                    console.log(`        - hookAngleDb: ${out.hookAngleDb ? '✅' : '❌'}`);

                    if (out.exportsJson) {
                        try {
                            const exports = JSON.parse(out.exportsJson);
                            console.log(`\n        exportsJson fields:`);
                            console.log(`          - summary: ${exports.summary ? '✅' : '❌'}`);
                            console.log(`          - v3_desires: ${exports.v3_desires ? '✅' : '❌'}`);
                            console.log(`          - v3_avatars: ${exports.v3_avatars ? '✅' : '❌'}`);
                            console.log(`          - v3_language_bank: ${exports.v3_language_bank ? '✅' : '❌'}`);
                        } catch (e) {
                            console.log(`        ❌ exportsJson parse error`);
                        }
                    }
                } else {
                    console.log(`      ❌ NO OUTPUTS`);
                }
            });
        });
    }

    // 4. UI Status Logic Simulation
    console.log('\n\n🎨 UI STATUS LOGIC SIMULATION:');
    console.log('Based on ResearchLab.tsx lines 457-596:\n');

    let resultsJson: any = {
        summary: '', dna_forense: {}, voc: {}, avatar_scoring: {},
        breakthrough_advertising: {}, angles: {}, economics: {},
        truth_layer: { evidence: [], claims: [] }, v3_desires: null,
        v3_avatars: null, v3_language_bank: null
    };

    // Priority 1: Version Data
    if (projects.length > 0 && projects[0].versions.length > 0) {
        const ver = projects[0].versions[0];
        if (ver.outputs?.exportsJson) {
            try {
                const exp = JSON.parse(ver.outputs.exportsJson);
                resultsJson = { ...resultsJson, ...exp };
                console.log('  ✅ Data loaded from ResearchProject/Version (v2 structure)');
            } catch (e) {
                console.log('  ❌ Failed to parse version exportsJson');
            }
        }
    } else {
        console.log('  ⚠️  NO VERSION DATA - falling back to activeRun');
    }

    // Priority 2: Active Run (Healing Layer)
    if (runs.length > 0 && runs[0].results) {
        try {
            const live = JSON.parse(runs[0].results);
            if (live.summary) resultsJson.summary = live.summary;
            if (live.product_core) resultsJson.product_core = live.product_core;
            if (live.dna_forense) resultsJson.dna_forense = { ...resultsJson.dna_forense, ...live.dna_forense };
            if (live.v3_desires) resultsJson.v3_desires = live.v3_desires;
            if (live.v3_avatars) resultsJson.v3_avatars = live.v3_avatars;
            if (live.truth_layer_v3) resultsJson.truth_layer = live.truth_layer_v3;
            if (live.marketing_angles) resultsJson.angles = live.marketing_angles;
            console.log('  ✅ Data merged from ResearchRun (activeRun healing layer)');
        } catch (e) {
            console.log('  ❌ Failed to parse run results');
        }
    }

    // Calculate statuses (from ResearchLab.tsx:590-595)
    const status_dna = (resultsJson?.summary?.split(' ').length > 1500 || (resultsJson?.product_core && resultsJson?.dna_forense?.vehiculo))
        ? "CONFIRMADO" : (resultsJson?.summary ? "PARCIAL" : "MISSING");
    const status_truth = (resultsJson?.truth_layer_v3?.evidence?.length >= 50 || resultsJson?.truth_layer?.evidence?.length >= 30)
        ? "CONFIRMADO" : (resultsJson?.truth_layer_v3?.evidence?.length > 0 ? "PARCIAL" : "MISSING");
    const status_voc = (resultsJson?.voc?.dictionary?.length >= 200 || resultsJson?.v3_language_bank?.length >= 2)
        ? "CONFIRMADO" : (resultsJson?.voc?.dictionary?.length > 0 ? "PARCIAL" : "MISSING");
    const status_avatars = (resultsJson?.v3_avatars?.length >= 5)
        ? "CONFIRMADO" : (resultsJson?.v3_avatars?.length > 0 ? "PARCIAL" : "MISSING");
    const status_angles = (resultsJson?.marketing_angles?.angle_tree?.length >= 8 || resultsJson?.angles?.angle_tree?.length >= 10)
        ? "CONFIRMADO" : (resultsJson?.marketing_angles?.angle_tree?.length > 0 ? "PARCIAL" : "MISSING");
    const status_economics = (resultsJson?.economics?.scenarios?.length >= 1 || resultsJson?.offer_strategy)
        ? "CONFIRMADO" : "MISSING";

    console.log('\n  📊 CALCULATED STATUS VALUES:');
    console.log(`    ADN del Producto: ${status_dna}`);
    console.log(`    Validación de Mercado: ${status_truth}`);
    console.log(`    Inteligencia VOC: ${status_voc}`);
    console.log(`    Avatar Scoring: ${status_avatars}`);
    console.log(`    Estrategia de Ángulos: ${status_angles}`);
    console.log(`    Economía y Oferta: ${status_economics}`);

    // 5. Root Cause Analysis
    console.log('\n\n🔴 ROOT CAUSE ANALYSIS:\n');

    if (runs.length > 0 && runs[0].status === 'READY' && runs[0].results) {
        console.log('✅ ResearchRun exists with READY status and results data');
        console.log(`   └─ Data saved to researchRun.results (line 531 in orchestrator.ts)`);
    } else {
        console.log('❌ No completed ResearchRun found');
    }

    if (projects.length === 0) {
        console.log('\n❌ PROBLEM: No ResearchProject records found');
        console.log('   UI Priority: data.researchProjects[0].versions[0] (ResearchLab.tsx:460)');
        console.log('   executeResearchPipelineV3: Only saves to researchRun.results (line 531)');
        console.log('   Missing: Logic to create ResearchProject + ResearchVersion + ResearchOutput');
    } else {
        console.log('\n✅ ResearchProject records exist');
    }

    // 6. Recommendations
    console.log('\n\n💡 RECOMMENDATIONS:\n');

    if (projects.length === 0 && runs.length > 0) {
        console.log('IMMEDIATE FIX NEEDED:');
        console.log('1. Add version export logic to executeResearchPipelineV3() around line 525');
        console.log('2. Create ResearchProject if not exists');
        console.log('3. Create ResearchVersion with outputs.exportsJson = ctx.data');
        console.log('4. Reference existing version export from runFullResearch() (if exists)');
        console.log('\nOr SIMPLER FIX:');
        console.log('1. Update UI to prioritize activeRun.results over version data');
        console.log('2. Update loadProductData() to set activeRun from researchRuns[0]');
    }

    if (status_dna === 'MISSING' && runs.length > 0) {
        console.log('\nDATA FLOW ISSUE:');
        console.log('- Data exists in researchRun.results');
        console.log('- But UI is not reading it correctly');
        console.log('- Check loadProductData() at line 84-123 in ResearchLab.tsx');
    }

    console.log('\n' + '='.repeat(80));
    console.log('END OF DIAGNOSTIC REPORT\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
