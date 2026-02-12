/**
 * TEST REAL: Lanzar investigación completa y ver qué tarjetas se rellenan
 */

import { ResearchOrchestrator } from '../src/lib/research/orchestrator';
import { prisma } from '../src/lib/prisma';

async function testRealResearch() {
    console.log('\n🔬 TEST: Research Lab REAL\n');

    const product = await prisma.product.findFirst({
        select: { id: true, title: true, storeId: true }
    });

    if (!product) {
        console.log('❌ No product found');
        return;
    }

    console.log(`Producto: ${product.title}`);
    console.log(`Ejecutando investigación completa...\n`);

    const orchestrator = new ResearchOrchestrator(product.id);

    try {
        const result = await orchestrator.executeResearchPipelineV3();

        if (result.success) {
            console.log('\n✅ Research completado\n');

            // Check what data was actually generated
            const run = await prisma.researchRun.findFirst({
                where: { productId: product.id },
                orderBy: { createdAt: 'desc' },
                select: { results: true }
            });

            if (run?.results) {
                const data = JSON.parse(run.results as string);

                console.log('TARJETAS RELLENADAS:');
                console.log(`   Product Core: ${data.product_core ? 'YES' : 'NO'}`);
                console.log(`   Validacion Mercado: ${data.market_validation ? 'YES' : 'NO'}`);
                console.log(`   Inteligencia VOC: ${data.v3_language_bank ? 'YES' : 'NO'}`);
                console.log(`   Avatares: ${data.v3_avatars ? 'YES' : 'NO'}`);
                console.log(`   Estrategia Angulos: ${data.marketing_angles ? 'YES' : 'NO'}`);
                console.log(`   Economia y Oferta: ${data.offer_strategy ? 'YES' : 'NO'}\n`);

                if (data.market_validation) {
                    console.log('Market Validation Data:');
                    console.log(JSON.stringify(data.market_validation, null, 2).substring(0, 300));
                }

                if (data.offer_strategy) {
                    console.log('\nOffer Strategy Data:');
                    console.log(JSON.stringify(data.offer_strategy, null, 2).substring(0, 300));
                }
            }

        } else {
            console.log(`❌ Research failed: ${result.error}`);
        }

    } catch (error: any) {
        console.error(`💥 ERROR: ${error.message}`);
    }

    await prisma.$disconnect();
}

testRealResearch();
