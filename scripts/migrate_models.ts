import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🚀 Iniciando migración de modelos de AgentProfile...");

    // Update AgentProfile models to new standard names
    // gemini-2.0-pro -> gemini-3.1-pro-preview
    // gemini-1.5-pro-002 -> gemini-3.1-pro-preview
    // gemini-2.0-flash -> gemini-3-flash-preview
    // gemini-1.5-flash-001 -> gemini-3-flash-preview

    const resPro = await (prisma as any).agentProfile.updateMany({
        where: {
            OR: [
                { model: "gemini-2.0-pro" },
                { model: "gemini-1.5-pro-002" }
            ]
        },
        data: {
            model: "gemini-3.1-pro-preview"
        }
    });

    const resFlash = await (prisma as any).agentProfile.updateMany({
        where: {
            OR: [
                { model: "gemini-2.0-flash" },
                { model: "gemini-1.5-flash-001" }
            ]
        },
        data: {
            model: "gemini-3-flash-preview"
        }
    });

    console.log(`✅ Modelos actualizados: ${resPro.count} de Pro, ${resFlash.count} de Flash.`);
}

main()
    .catch(e => {
        console.error("🛑 Error en migración:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
