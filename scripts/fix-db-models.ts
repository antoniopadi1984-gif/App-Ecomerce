
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 DEEP SCAN for "gemini-3" references...');

    // 1. ResearchRun - Check ALL string fields
    const researchFields = ['logs', 'results', 'summary', 'avatarMatrix', 'awareness', 'marketMechanism', 'sophistication', 'objectionHeatmap', 'status'];

    const researchRuns = await prisma.researchRun.findMany();
    let fixedResearch = 0;

    for (const run of researchRuns) {
        let needsUpdate = false;
        const updateData: any = {};

        for (const field of researchFields) {
            const val = (run as any)[field];
            if (typeof val === 'string' && val.includes('gemini-3')) {
                console.log(`⚠️ For ResearchRun ${run.id}, field ${field} has invalid model.`);
                let newVal = val.replace(/gemini-3\.5-flash/g, 'gemini-1.5-flash')
                    .replace(/gemini-3\.5-pro/g, 'gemini-1.5-pro')
                    .replace(/gemini-3/g, 'gemini-1.5-flash'); // Catch-all
                updateData[field] = newVal;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await prisma.researchRun.update({
                where: { id: run.id },
                data: updateData
            });
            fixedResearch++;
        }
    }
    console.log(`✅ Fixed ${fixedResearch} ResearchRun records.`);

    // 2. ContentTemplate - configJson
    const contentTemplates = await prisma.contentTemplate.findMany({
        where: { configJson: { contains: 'gemini-3' } }
    });

    if (contentTemplates.length > 0) {
        console.log(`⚠️ Found ${contentTemplates.length} bad ContentTemplates.`);
        for (const t of contentTemplates) {
            const newConfig = t.configJson.replace(/gemini-3\.5-flash/g, 'gemini-1.5-flash')
                .replace(/gemini-3\.5-pro/g, 'gemini-1.5-pro');
            await prisma.contentTemplate.update({
                where: { id: t.id },
                data: { configJson: newConfig }
            });
        }
        console.log('✅ ContentTemplates fixed.');
    }

    // 3. AgentRun - context, input, output
    const agentRuns = await prisma.agentRun.findMany({
        where: {
            OR: [
                { context: { contains: 'gemini-3' } },
                { input: { contains: 'gemini-3' } },
                { output: { contains: 'gemini-3' } }
            ]
        }
    });

    if (agentRuns.length > 0) {
        console.log(`⚠️ Found ${agentRuns.length} bad AgentRuns.`);
        // We notify only, mostly logs. But context might be used.
        for (const ar of agentRuns) {
            const updateData: any = {};
            if (ar.context?.includes('gemini-3')) updateData.context = ar.context.replace(/gemini-3\.5/g, 'gemini-1.5');
            if (Object.keys(updateData).length > 0) {
                await prisma.agentRun.update({ where: { id: ar.id }, data: updateData });
            }
        }
        console.log('✅ AgentRuns fixed.');
    }

    // 4. PromptTemplate (Re-check)
    const prompts = await prisma.promptTemplate.findMany({ where: { content: { contains: 'gemini-3' } } });
    if (prompts.length > 0) {
        console.log(`⚠️ Found ${prompts.length} bad PromptTemplates.`);
        for (const p of prompts) {
            await prisma.promptTemplate.update({
                where: { id: p.id },
                data: { content: p.content.replace(/gemini-3\.5/g, 'gemini-1.5') }
            });
        }
    }

    console.log('🎉 Deep scan complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
