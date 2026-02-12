
import { prisma } from './src/lib/prisma';

async function checkTemplates() {
    console.log("--- Checking Prompt Templates ---");
    const templates = await (prisma as any).promptTemplate.findMany();

    if (templates.length === 0) {
        console.log("❌ No templates found in the database.");
    } else {
        console.log(`✅ Found ${templates.length} templates.`);
        templates.forEach((t: any) => {
            console.log(`- [${t.category}] ${t.name} (ID: ${t.id})`);
        });
    }

    const vocTemplate = await (prisma as any).promptTemplate.findFirst({ where: { category: 'VOC' } });
    console.log(`VOC Template present? ${!!vocTemplate}`);

    const avatarTemplate = await (prisma as any).promptTemplate.findFirst({ where: { category: 'AVATAR' } });
    console.log(`AVATAR Template present? ${!!avatarTemplate}`);

    const awarenessTemplate = await (prisma as any).promptTemplate.findFirst({ where: { category: 'AWARENESS' } });
    console.log(`AWARENESS Template present? ${!!awarenessTemplate}`);

    const angleTemplate = await (prisma as any).promptTemplate.findFirst({ where: { category: 'ANGLE' } });
    console.log(`ANGLE Template present? ${!!angleTemplate}`);

    process.exit(0);
}

checkTemplates();
