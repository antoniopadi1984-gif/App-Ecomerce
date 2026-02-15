import { prisma } from "./src/lib/prisma";

async function checkCount() {
    const count = await prisma.order.count();
    console.log("TOTAL_ORDERS:" + count);
    process.exit(0);
}

checkCount();
