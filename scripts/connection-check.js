const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const connections = await prisma.connection.findMany();
    console.log('Connections:', JSON.stringify(connections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
