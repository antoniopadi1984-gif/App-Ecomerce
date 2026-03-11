const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const stores = await prisma.store.findMany({
            select: { id: true, name: true, driveRootFolderId: true, driveSetupDone: true }
        });
        console.log("STORES:");
        console.table(stores);

        const products = await prisma.product.findMany({
            where: { driveSetupDone: true },
            select: { id: true, title: true, driveFolderId: true, driveSetupDone: true }
        });
        console.log("PRODUCTS (setup done):");
        console.table(products);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
