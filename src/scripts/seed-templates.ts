/**
 * SEED CREATIVE TEMPLATES
 * Run: npx tsx src/scripts/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import { STATIC_AD_TEMPLATES, generateTemplateVariants, COLOR_SCHEMES } from '../lib/creative/static-templates';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Creative Templates...\n');

    // Clear existing templates
    const deleted = await prisma.creativeTemplate.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.count} old templates\n`);

    let count = 0;

    // Seed base templates
    for (const template of STATIC_AD_TEMPLATES) {
        const existing = await prisma.creativeTemplate.findFirst({
            where: { name: template.name }
        });

        if (!existing) {
            await prisma.creativeTemplate.create({
                data: {
                    name: template.name,
                    category: template.category.toUpperCase(),
                    funnelStage: template.funnelStage,
                    templateJson: JSON.stringify(template.layout),
                    supportedFormats: JSON.stringify([template.dimensions]),
                    usageCount: 0
                }
            });
            console.log(`✅ Created: ${template.name}`);
            count++;
        } else {
            console.log(`⏭️  Skipped: ${template.name} (already exists)`);
        }
    }

    // Generate and seed color variants
    console.log('\n🎨 Generating color variants...\n');

    for (const template of STATIC_AD_TEMPLATES) {
        const variants = generateTemplateVariants(template, COLOR_SCHEMES.slice(0, 3));

        for (const variant of variants) {
            const existing = await prisma.creativeTemplate.findFirst({
                where: { name: variant.name }
            });

            if (!existing) {
                await prisma.creativeTemplate.create({
                    data: {
                        name: variant.name,
                        category: variant.category.toUpperCase(),
                        funnelStage: variant.funnelStage,
                        templateJson: JSON.stringify(variant.layout),
                        supportedFormats: JSON.stringify([variant.dimensions]),
                        usageCount: 0
                    }
                });
                console.log(`✅ Created: ${variant.name}`);
                count++;
            } else {
                console.log(`⏭️  Skipped: ${variant.name} (already exists)`);
            }
        }
    }

    console.log(`\n🎉 Seeding complete! Created ${count} new templates.`);
    console.log(`📊 Total templates in DB: ${await prisma.creativeTemplate.count()}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding templates:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
