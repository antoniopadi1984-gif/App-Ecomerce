import { prisma } from '../src/lib/prisma';

async function dump() {
    try {
        const templates = await (prisma as any).promptTemplate.findMany();
        console.log(JSON.stringify(templates, null, 2));
    } catch (e) {
        console.error(e);
    }
}

dump();
