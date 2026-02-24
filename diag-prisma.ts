import { prisma } from "./src/lib/prisma";

async function main() {
    console.log("--- PRISMA DIAGNOSTIC ---");
    const connectionCount = await prisma.connection.count();
    const storeCount = await prisma.store.count();
    const userCount = await prisma.user.count();

    console.log(`Connections in DB: ${connectionCount}`);
    console.log(`Stores in DB: ${storeCount}`);
    console.log(`Users in DB: ${userCount}`);

    if (connectionCount > 0) {
        const first = await prisma.connection.findFirst();
        console.log("First connection:", JSON.stringify(first, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
