gemini#!/usr/bin / env tsx
/**
 * Test script para Research Lab V4 Services
 * 
 * Tests:
 * 1. VOC Categorizer
 * 2. Offer Engineering V2
 * 3. Quality Scorer
 */

import { VOCCategorizer } from '../src/lib/research/voc-categorizer';
import { OfferEngineeringV2 } from '../src/lib/research/offer-engineering-v2';
import { ResearchQualityScorer } from '../src/lib/research/quality-scorer';

async function main() {
    console.log('🧪 Testing Research Lab V4 Services\n');

    // TEST 1: VOC Categorizer
    console.log('=== TEST 1: VOC Categorizer ===');
    try {
        const vocPhrases = [
            { phrase: "No puedo dormir por la noche", meaning: "Insomnio crónico" },
            { phrase: "Quiero tener más energía durante el día", meaning: "Deseo de vitalidad" },
            { phrase: "¿Realmente funciona esto?", meaning: "Duda sobre eficacia" },
            { phrase: "Oferta limitada - solo 24h", meaning: "Urgencia de compra" }
        ];

        const categorized = await VOCCategorizer.categorize(
            vocPhrases,
            "Suplemento NAD+ anti-envejecimiento"
        );

        console.log('✅ VOC Categorization Results:');
        categorized.forEach(c => {
            console.log(`  - "${c.phrase}"`);
            console.log(`    Category: ${c.category} | Intensity: ${c.emotionalIntensity}/10 | Stage: ${c.funnelStage}`);
        });
        console.log('');

    } catch (e: any) {
        console.error('❌ VOC Categorizer failed:', e.message);
    }

    // TEST 2: Offer Engineering V2
    console.log('\n=== TEST 2: Offer Engineering V2 ===');
    try {
        const stacks = await OfferEngineeringV2.generateStacks({
            productId: 'test-product-123',
            basePrice: 79.99,
            unitCost: 25,
            targetMargin: 60,
            productName: 'NAD+ Premium',
            productDescription: 'Suplemento anti-envejecimiento con NAD+ de alta biodisponibilidad'
        });

        console.log(`✅ Generated ${stacks.length} Offer Stacks:`);
        stacks.forEach((stack, i) => {
            console.log(`\n  Stack ${i + 1}: ${stack.name}`);
            console.log(`  Strategy: ${stack.strategy}`);
            console.log(`  Components: ${stack.components.length} items`);
            console.log(`  Total Value: €${stack.totalValue} → Price: €${stack.price}`);
            console.log(`  Discount: ${stack.discount}% (${stack.perceivedValue})`);
            if (stack.urgency) console.log(`  Urgency: ${stack.urgency}`);
        });
        console.log('');

    } catch (e: any) {
        console.error('❌ Offer Engineering failed:', e.message);
    }

    // TEST 3: Quality Scorer
    console.log('\n=== TEST 3: Quality Scorer ===');
    try {
        const mockResearch = {
            productId: 'test-123',
            productName: 'NAD+ Premium',
            productDNA: {
                unique_mechanism: 'Liposomal NAD+ delivery',
                core_benefit: 'Cellular rejuvenation'
            },
            vocInsights: {
                pain: ['No energy', 'Aging symptoms'],
                desire: ['Feel young', 'More vitality'],
                objection: ['Too expensive', 'Does it work?']
            },
            avatars: [
                { name: 'Health-conscious Emma', age: '45-55', awareness: 'AWARE' },
                { name: 'Biohacker Mike', age: '35-45', awareness: 'SOPHISTICATED' }
            ]
        };

        const qualityScore = await ResearchQualityScorer.evaluateResearch(mockResearch);

        console.log('✅ Quality Evaluation:');
        console.log(`  Overall Score: ${qualityScore.score}/10`);
        console.log(`  Completeness: ${qualityScore.completeness}%`);
        console.log(`\n  Breakdown:`);
        Object.entries(qualityScore.breakdown).forEach(([key, score]) => {
            console.log(`    ${key}: ${score}/10`);
        });
        console.log(`\n  Strengths:`);
        qualityScore.strengths.forEach(s => console.log(`    ✓ ${s}`));
        console.log(`\n  Weaknesses:`);
        qualityScore.weaknesses.forEach(w => console.log(`    ✗ ${w}`));
        console.log(`\n  Recommendations:`);
        qualityScore.recommendations.forEach(r => console.log(`    → ${r}`));
        console.log('');

    } catch (e: any) {
        console.error('❌ Quality Scorer failed:', e.message);
    }

    console.log('\n✨ All tests completed!\n');
}

main().catch(console.error);
