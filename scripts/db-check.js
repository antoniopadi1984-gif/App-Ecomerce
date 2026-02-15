const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count();
    const itemCount = await prisma.orderItem.count();
    const storeCount = await prisma.store.count();

    console.log('Order Count:', orderCount);
    console.log('Product Count:', productCount);
    console.log('OrderItem Count:', itemCount);
    console.log('Store Count:', storeCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
