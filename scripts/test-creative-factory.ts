#!/usr/bin/env tsx

/**
 * TEST SCRIPT - Creative Factory
 * 
 * Prueba REAL del sistema completo generando 3 videos
 * 
 * Ejecutar: npx tsx scripts/test-creative-factory.ts
 */

import { VideoAdOrchestrator } from '../src/lib/creative/orchestrators/video-ad-orchestrator';

async function test() {
    console.log('🧪 TEST: Creative Factory - Generación de Videos\n');
    console.log('='.repeat(60));

    const orchestrator = new VideoAdOrchestrator();

    // Configuración de 3 videos de prueba
    const configs = [
        {
            avatarPrompt: 'Spanish woman, 35 years old, professional businesswoman, friendly smile, looking at camera',
            script: '¿Sabías que el 80% de las personas sufren de falta de energía? Descubre el secreto para tener energía todo el día.',
            concept: 'Video 1 - Pain Point (Mujer profesional)',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        },
        {
            avatarPrompt: 'Spanish man, 45 years old, executive, confident expression, professional attire',
            script: 'Tu cerebro merece lo mejor. Ingredientes naturales, resultados reales. Sin estimulantes artificiales.',
            concept: 'Video 2 - Benefits (Hombre ejecutivo)',
            voiceId: process.env.ELEVENLABS_VOICE_MALE
        },
        {
            avatarPrompt: 'Spanish woman, 28 years old, fitness enthusiast, energetic, athletic wear',
            script: 'Más de 10,000 personas ya confían en nosotros. Energía natural, concentración máxima. Pruébalo hoy.',
            concept: 'Video 3 - Social Proof (Mujer deportista)',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        }
    ];

    try {
        console.log(`\n📋 Configuración:\n`);
        console.log(`   - Videos a generar: ${configs.length}`);
        console.log(`   - Modo: BATCH (paralelo)`);
        console.log(`   - APIs: Vertex AI + ElevenLabs + Replicate\n`);
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
        console.log('\n✅ TEST COMPLETADO CON ÉXITO\n');

    } catch (error) {
        console.error('\n❌ TEST FALLIDO:\n');
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar test
test();
