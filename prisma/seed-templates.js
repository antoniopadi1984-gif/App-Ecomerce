const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function seedTemplates() {
    console.log("🌱 Seeding Notification Templates...");

    // Ensure default store exists
    let store = await prisma.store.findUnique({ where: { id: "default-store" } });
    if (!store) {
        store = await prisma.store.create({
            data: { id: "default-store", name: "Default Store", currency: "EUR" }
        });
    }

    const defaults = [
        {
            name: 'CONFIRMATION',
            body: "Hola {{name}}. Gracias por tu confianza. Hemos confirmado tu pedido #{{orderNumber}} de {{product}}. 📦 Estamos preparándolo con cuidado para enviarlo cuanto antes. Te avisaremos cuando salga. Si tienes dudas, estamos aquí.",
            channel: 'WHATSAPP'
        },
        {
            name: 'TRACKING',
            body: "Actualización Logística: Tu pedido #{{orderNumber}} está en camino 🚚. Puedes realizar el seguimiento en tiempo real aquí: {{trackingUrl}}. Tu código es: {{tracking}}.",
            channel: 'WHATSAPP'
        },
        {
            name: 'OUT_FOR_DELIVERY',
            body: "🔔 ¡Es hoy! Tu pedido está en reparto. Por favor, asegúrate de estar disponible o avísanos si necesitas reagendar. Queremos que lo recibas sin problemas.",
            channel: 'WHATSAPP'
        },
        {
            name: 'INCIDENCE',
            body: "Hola {{name}}, hemos intentado entregar tu pedido pero hubo una incidencia. 😟 No te preocupes, es normal. Por favor, indícanos cuándo te viene bien un segundo intento o si prefieres recogerlo en un punto cercano. Queremos solucionarlo rápido para ti.",
            channel: 'WHATSAPP'
        }
    ];

    for (const t of defaults) {
        const exists = await prisma.notificationTemplate.findFirst({
            where: { storeId: "default-store", name: t.name, channel: t.channel }
        });

        if (!exists) {
            await prisma.notificationTemplate.create({
                data: {
                    storeId: "default-store",
                    name: t.name,
                    channel: t.channel,
                    body: t.body,
                    isEnabled: true
                }
            });
            console.log(`✅ Template ${t.name} created.`);
        } else {
            console.log(`ℹ️ Template ${t.name} already exists.`);
        }
    }
}

seedTemplates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
