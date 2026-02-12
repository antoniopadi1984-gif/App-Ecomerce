#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkAll() {
    console.log('🔍 CHECKING ALL RESEARCH DATA IN DATABASE\n');

    const totalRuns = await (prisma.researchRun as any).count();
    const totalProjects = await (prisma as any).researchProject.count();
    const totalProducts = await prisma.product.count();

    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total ResearchRuns: ${totalRuns}`);
    console.log(`Total ResearchProjects: ${totalProjects}`);

    if (totalRuns === 0 && totalProjects === 0) {
        console.log('\n❌❌❌ CRITICAL: NO RESEARCH HAS EVER BEEN RUN!');
        console.log('\n💡 ACTION REQUIRED:');
        console.log('   1. Open Research Lab UI');
        console.log('   2. Select a product');
        console.log('   3. Click "INICIAR INVESTIGACIÓN PROFUNDA" button');
        console.log('   4. Wait for completion (10-20 minutes)');
        console.log('\n📋 The research process will:');
        console.log('   - Run 10 phases of deep analysis');
        console.log('   - Generate forensic-level product DNA');
        console.log('   - Extract 50+ evidence citations');
        console.log('   - Create 5+ avatars');
        console.log('   - Generate 10+ marketing angles');
        console.log('   - Build language bank with 200+ phrases');
    } else if (totalRuns > 0) {
        console.log('\n✅ Research runs exist, checking status...\n');

        const runs = await (prisma.researchRun as any).findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                product: {
                    select: {
                        title: true
                    }
                }
            }
        });

        runs.forEach((run: any, idx: number) => {
            console.log(`Run ${idx + 1}:`);
            console.log(`  Product: ${run.product.title}`);
            console.log(`  Status: ${run.status}`);
            console.log(`  Created: ${new Date(run.createdAt).toLocaleString()}`);
            console.log(`  Has Results: ${run.results ? 'YES' : 'NO'}`);
            console.log('');
        });
    }
}

checkAll()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
