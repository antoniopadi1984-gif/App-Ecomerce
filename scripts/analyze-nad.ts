#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function analyzeNadProduct() {
    console.log('🔍 ANALYZING NAD PRODUCT RESEARCH DATA\n');

    // Find NAD product
    const nadProduct = await prisma.product.findFirst({
        where: {
            title: {
                contains: 'Nad'
            }
        },
        include: {
            researchRuns: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            researchProjects: {
                include: {
                    versions: {
                        include: {
                            outputs: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });

    if (!nadProduct) {
        console.log('❌ NAD product not found');
        return;
    }

    console.log(`✅ Found product: "${nadProduct.title}"`);
    console.log(`   ID: ${nadProduct.id}\n`);

    // Check Research Run
    if (nadProduct.researchRuns.length > 0) {
        const run: any = nadProduct.researchRuns[0];
        console.log(`📊 LATEST RESEARCH RUN:`);
        console.log(`   Status: ${run.status}`);
        console.log(`   Created: ${new Date(run.createdAt).toLocaleString()}`);

        if (run.results) {
            try {
                const results = JSON.parse(run.results);
                console.log(`\n   ✅ Results data exists with ${Object.keys(results).length} top-level keys`);
                console.log(`   \n   DATA QUALITY CHECK:`);
                console.log(`     Summary: ${results.summary ? results.summary.substring(0, 100) + '...' : 'MISSING'}`);
                console.log(`     product_core: ${results.product_core ? 'EXISTS' : 'MISSING'}`);
                console.log(`     product_core.market_intelligence: ${results.product_core?.market_intelligence ? 'EXISTS' : 'MISSING'}`);

                if (results.product_core?.market_intelligence) {
                    const mi = results.product_core.market_intelligence;
                    console.log(`\n     MARKET INTELLIGENCE FORENSIC FIELDS:`);
                    console.log(`       - competitive_saturation_analysis: ${mi.competitive_saturation_analysis ? mi.competitive_saturation_analysis.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - customer_rebellion_narrative: ${mi.customer_rebellion_narrative ? mi.customer_rebellion_narrative.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - white_space_opportunity: ${mi.white_space_opportunity ? mi.white_space_opportunity.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - positioning_angle: ${mi.positioning_angle ? mi.positioning_angle.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - internal_dialogue: ${mi.internal_dialogue ? mi.internal_dialogue.split(' ').length + ' words' : 'MISSING'}`);
                }

                console.log(`\n     v3_desires: ${results.v3_desires ? 'EXISTS' : 'MISSING'}`);
                if (results.v3_desires) {
                    const vd = results.v3_desires;
                    console.log(`       - primary_emotional_hook: ${vd.primary_emotional_hook ? vd.primary_emotional_hook.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - market_saturation_observation: ${vd.market_saturation_observation ? vd.market_saturation_observation.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - white_space_opportunity: ${vd.white_space_opportunity ? vd.white_space_opportunity.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - customer_internal_dialogue: ${vd.customer_internal_dialogue ? vd.customer_internal_dialogue.split(' ').length + ' words' : 'MISSING'}`);
                    console.log(`       - desires array: ${vd.desires?.length || 0} desires`);
                }

                console.log(`\n     Other V3 fields:`);
                console.log(`       - v3_avatars: ${results.v3_avatars?.length || 0} avatars`);
                console.log(`       - truth_layer_v3.evidence: ${results.truth_layer_v3?.evidence?.length || 0} citations`);
                console.log(`       - v3_language_bank: ${results.v3_language_bank?.length || 0} banks`);
                console.log(`       - marketing_angles.angle_tree: ${results.marketing_angles?.angle_tree?.length || 0} angles`);

            } catch (e) {
                console.log(`   ❌ Failed to parse results JSON: ${e}`);
            }
        } else {
            console.log(`   ❌ No results data`);
        }
    } else {
        console.log(`❌ No research runs found`);
    }

    // Check Research Project
    console.log(`\n\n📁 RESEARCH PROJECT (V2 Structure):`);
    if (nadProduct.researchProjects.length > 0) {
        const project = nadProduct.researchProjects[0];
        console.log(`   ✅ Project exists with ${project.versions.length} versions`);

        if (project.versions.length > 0) {
            const version = project.versions[0];
            console.log(`\n   Latest Version:`);
            console.log(`     Version Number: ${version.versionNumber}`);
            console.log(`     Created: ${new Date(version.createdAt).toLocaleString()}`);

            if (version.outputs) {
                console.log(`\n     Outputs:`);
                console.log(`       - exportsJson: ${version.outputs.exportsJson ? 'EXISTS' : 'MISSING'}`);
                console.log(`       - productIntelligence: ${version.outputs.productIntelligence ? 'EXISTS' : 'MISSING'}`);
                console.log(`       - languageBank: ${version.outputs.languageBank ? 'EXISTS' : 'MISSING'}`);
                console.log(`       - macroAvatarSheet: ${version.outputs.macroAvatarSheet ? 'EXISTS' : 'MISSING'}`);
                console.log(`       - hookAngleDb: ${version.outputs.hookAngleDb ? 'EXISTS' : 'MISSING'}`);

                if (version.outputs.exportsJson) {
                    try {
                        const exp = JSON.parse(version.outputs.exportsJson);
                        console.log(`\n       exportsJson contains:`);
                        console.log(`         - v3_desires: ${exp.v3_desires ? 'YES' : 'NO'}`);
                        console.log(`         - v3_avatars: ${exp.v3_avatars ? 'YES' : 'NO'}`);
                        console.log(`         - v3_language_bank: ${exp.v3_language_bank ? 'YES' : 'NO'}`);
                        console.log(`         - summary: ${exp.summary ? 'YES' : 'NO'}`);
                    } catch (e) {
                        console.log(`       ❌ Failed to parse exportsJson`);
                    }
                }
            } else {
                console.log(`     ❌ No outputs`);
            }
        }
    } else {
        console.log(`   ❌ NO RESEARCH PROJECT - This is why UI shows MISSING!`);
        console.log(`   \n   💡 FIX REQUIRED: Add version export logic to executeResearchPipelineV3()`);
    }

    console.log('\n' + '='.repeat(80));
}

analyzeNadProduct()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
