#!/usr/bin/env tsx

/**
 * TEST SCRIPT - Creative Factory con DATOS REALES
 * 
 * Genera 3 videos usando información real de productos del Research Lab
 * Si no hay research, usa configs genéricos como fallback
 * 
 * Ejecutar: npx tsx scripts/test-creative-with-real-products.ts [productId]
 */

import { VideoAdOrchestrator } from '../src/lib/creative/orchestrators/video-ad-orchestrator';
import { ResearchLabConnector } from '../src/lib/creative/integration/research-lab-connector';

async function test() {
    console.log('🧪 TEST: Creative Factory - Videos con Productos REALES\n');
    console.log('='.repeat(60));

    const orchestrator = new VideoAdOrchestrator();
    const productId = process.argv[2]; // Opcional: pasar productId como argumento

    let configs;

    if (productId) {
        console.log(`\n📦 Cargando datos para producto: ${productId}...\n`);
        try {
            configs = await ResearchLabConnector.getVideoConfigsFromResearch(productId, 3);
            console.log(`✅ Encontrado research con ${configs.length} configuraciones`);
        } catch (error) {
            console.warn(`⚠️  No se encontró research para producto ${productId}`);
            console.log(`   Usando configs genéricos de prueba...\n`);
            configs = ResearchLabConnector.getTestConfigs();
        }
    } else {
        console.log(`\n⚠️  No se especificó productId`);
        console.log(`   Usando configs genéricos de prueba...\n`);
        configs = ResearchLabConnector.getTestConfigs();
    }

    try {
        console.log(`\n📋 Configuración:\n`);
        console.log(`   - Videos a generar: ${configs.length}`);
        console.log(`   - Modo: BATCH (paralelo)`);
        console.log(`   - APIs: Vertex AI + ElevenLabs + Replicate`);
        console.log(`   - Producto ID: ${productId || 'Test genérico'}\n`);

        // Mostrar preview de los videos a generar
        console.log(`\n📝 Preview de videos:\n`);
        configs.forEach((config, i) => {
            console.log(`${i + 1}. ${config.concept}`);
            console.log(`   Script: "${config.script.substring(0, 60)}..."`);
            console.log(`   Avatar: ${config.avatarPrompt.substring(0, 60)}...`);
            console.log('');
        });

        console.log('='.repeat(60));
        console.log('\n🚀 Iniciando generación...\n');

        const results = await orchestrator.generateBatch(configs);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ RESULTADOS:\n');

        results.forEach((result, i) => {
            console.log(`Video ${i + 1}: ${result.concept}`);
            console.log(`   📸 Avatar: ${result.avatarUrl}`);
            console.log(`   🎙️  Audio: ${result.audioUrl}`);
            console.log(`   🎬 Video: ${result.videoUrl}`);
            console.log(`   💰 Costo: $${result.cost.total.toFixed(3)} (img: $${result.cost.image.toFixed(3)}, voice: $${result.cost.voice.toFixed(3)}, video: $${result.cost.video.toFixed(3)})`);
            console.log('');
        });

        const totalCost = results.reduce((sum, r) => sum + r.cost.total, 0);
        console.log('='.repeat(60));
        console.log(`\n💰 COSTO TOTAL: $${totalCost.toFixed(2)}`);
        console.log(`📊 COSTO PROMEDIO: $${(totalCost / results.length).toFixed(3)} por video`);
        console.log('\n✅ TEST COMPLETADO CON ÉXITO');
        console.log('\n🎬 Los videos están disponibles en las URLs mostradas arriba\n');

    } catch (error) {
        console.error('\n❌ TEST FALLIDO:\n');
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar test
test();
