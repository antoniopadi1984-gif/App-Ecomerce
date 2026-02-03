import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const storeId = "cm6n3a9on0000uxmmsy26x3sh"; // Based on previous context
    const dateStr = "2025-12-14";
    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    console.log(`Checking orders for ${dateStr}...`);

    const orders = await prisma.order.findMany({
        where: {
            storeId,
            createdAt: { gte: dayStart, lte: dayEnd },
            status: { notIn: ['CANCELLED', 'ABANDONED'] }
        },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            finance: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${orders.length} non-cancelled orders.`);

    let totalUnits = 0;
    let totalCogs = 0;

    orders.forEach(order => {
        console.log(`Order ${order.orderNumber} (ID: ${order.id}) Status: ${order.status}`);
        order.items.forEach(item => {
            const cost = item.unitCost || item.product?.finance?.unitCost || 0;
            totalUnits += item.quantity;
            totalCogs += (cost * item.quantity);
            console.log(`  Item: ${item.sku || 'No SKU'} - Qty: ${item.quantity} - Cost: ${cost} - ProductFinanceCost: ${item.product?.finance?.unitCost || 'N/A'}`);
            if (!item.product) {
                console.log(`  ⚠️ ITEM HAS NO PRODUCT LINK!`);
            } else if (!item.product.finance) {
                console.log(`  ⚠️ PRODUCT HAS NO FINANCE RECORD!`);
            }
        });
    });

    console.log(`\nFinal Totals for ${dateStr}:`);
    console.log(`Total Units: ${totalUnits}`);
    console.log(`Total COGS: ${totalCogs}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
