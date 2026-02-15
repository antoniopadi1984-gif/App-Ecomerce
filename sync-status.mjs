import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkStatus() {
    const orderCount = await prisma.order.count();
    const store = await prisma.store.findFirst();
    const auditLogs = await prisma.auditLog.findMany({
        where: { action: { startsWith: 'BACKFILL' } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log("--- STATUS REPORT ---");
    console.log(`TOTAL_ORDERS: ${orderCount}`);
    console.log(`STORE_FOUND: ${store ? store.name : 'NONE'}`);
    console.log(`AUDIT_LOGS: ${JSON.stringify(auditLogs, null, 2)}`);
    process.exit(0);
}

checkStatus();
