import { prisma } from '../src/lib/prisma';

async function dump() {
    try {
        const templates = await (prisma as any).promptTemplate.findMany({
            where: { category: 'VOC' }
        });
        for (const t of templates) {
            console.log(`--- CATEGORY: ${t.category} | NAME: ${t.name} ---`);
            console.log(t.content);
            console.log('-------------------------------------------');
        }
    } catch (e) {
        console.error(e);
    }
}

dump();
