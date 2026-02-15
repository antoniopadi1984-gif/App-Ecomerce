
"use server";

import { prisma } from "@/lib/prisma";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { ThresholdService } from "@/lib/threshold-service";
import { revalidatePath } from "next/cache";

export async function triggerHistoricalSync(storeId: string, month: number, year: number) {
    // Determine start and end of the month for sync
    const startDate = new Date(year, month - 1, 1);
    const today = new Date();

    // Get last day of the target month
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    // If target month is current month, only sync up to today
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const limit = (month === currentMonth && year === currentYear) ? today.getDate() : lastDayOfMonth;

    console.log(`[Historical Sync] Syncing ${month}/${year} - ${limit} days`);

    const results = [];
    for (let day = 1; day <= limit; day++) {
        const date = new Date(year, month - 1, day);
        if (date > today) break;

        try {
            await SnapshotService.generateDailySnapshot(storeId, date);
            results.push(date.toISOString());
        } catch (e) {
            console.error(`Sync error for ${date.toISOString()}:`, e);
        }
    }

    revalidatePath("/finances");
    return { success: true, count: results.length, month, year };
}

export async function rebuildAccounting(storeId: string) {
    try {
        await SnapshotService.rebuildFullHistory(storeId);
        revalidatePath("/finances");
        return { success: true, message: "Reconstrucción completada. Revisa los logs para detalles." };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


export async function saveThreshold(storeId: string, data: any) {
    // Check current version
    const last = await prisma.thresholdConfig.findFirst({
        where: { storeId, type: "GLOBAL" },
        orderBy: { version: "desc" }
    });

    const nextVersion = (last?.version || 0) + 1;

    // Close previous version
    if (last) {
        await prisma.thresholdConfig.update({
            where: { id: last.id },
            data: { validTo: new Date() }
        });
    }

    const created = await prisma.thresholdConfig.create({
        data: {
            storeId,
            type: "GLOBAL",
            version: nextVersion,
            validFrom: new Date(),
            minProfitPercent: data.minProfitPercent,
            minRoas: data.minRoas,
            minDeliveryRate: data.minDeliveryRate,
            minConfirmRate: data.minConfirmRate,
            maxIncidenceRate: data.maxIncidenceRate,
            maxReturnRate: data.maxReturnRate,
            criticalKpis: JSON.stringify(data.criticalKpis || [])
        }
    });

    revalidatePath("/finances");
    return created;
}

export async function getActiveThreshold(storeId: string) {
    return await ThresholdService.getActiveThreshold(storeId);
}

// --- NEW ACTIONS FOR PRODUCTS FINANCE ---

export async function getProductsWithFinance(storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    const products = await prisma.product.findMany({
        where: resolvedStoreId ? { storeId: resolvedStoreId } : {},
        include: {
            finance: true,
            supplier: true
        },
        orderBy: { title: 'asc' }
    });
    return products;
}

export async function getSuppliers(storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    const suppliers = await prisma.supplier.findMany({
        where: resolvedStoreId ? { storeId: resolvedStoreId } : {},
        orderBy: { name: 'asc' }
    });
    return suppliers;
}

export async function createSupplier(data: { name: string }, storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    if (!resolvedStoreId) {
        throw new Error("No hay tienda disponible para asociar proveedor");
    }

    const supplier = await prisma.supplier.create({
        data: {
            name: data.name,
            storeId: resolvedStoreId
        }
    });
    return supplier;
}

export async function updateProductFinance(productId: string, data: any) {
    const { supplierId, ...financeData } = data;

    // Update supplier if provided
    if (supplierId !== undefined) {
        await prisma.product.update({
            where: { id: productId },
            data: {
                supplierId: supplierId === "none" ? null : supplierId
            }
        });
    }

    // Upsert finance data
    const finance = await (prisma as any).productFinance.upsert({
        where: { productId },
        create: {
            productId,
            unitCost: Number(financeData.unitCost) || 0,
            sellingPrice: Number(financeData.sellingPrice) || 0,
            shippingCost: Number(financeData.shippingCost) || 0,
            returnCost: Number(financeData.returnCost) || 0,
            packagingCost: Number(financeData.packagingCost) || 0,
            codFee: Number(financeData.codFee) || 0,
            insuranceFee: Number(financeData.insuranceFee) || 0,
            isUpsell: Boolean(financeData.isUpsell),
        },
        update: {
            unitCost: Number(financeData.unitCost) || 0,
            sellingPrice: Number(financeData.sellingPrice) || 0,
            shippingCost: Number(financeData.shippingCost) || 0,
            returnCost: Number(financeData.returnCost) || 0,
            packagingCost: Number(financeData.packagingCost) || 0,
            codFee: Number(financeData.codFee) || 0,
            insuranceFee: Number(financeData.insuranceFee) || 0,
            isUpsell: Boolean(financeData.isUpsell),
        }
    });

    revalidatePath("/finances/products");

    // 4. Trigger Recalculation of all associated orders (Hardening fix 6.4)
    // Run asynchronously to not block the UI
    (async () => {
        try {
            const { calculateOrderProfit } = await import("@/lib/logistics-engine");
            const orders = await prisma.order.findMany({
                where: { items: { some: { productId } } },
                select: { id: true }
            });
            console.log(`[Finance Update] Recalculating profit for ${orders.length} orders of product ${productId}`);
            for (const order of orders) {
                await calculateOrderProfit(order.id);
            }
        } catch (e) {
            console.error("[Finance Update] Profit recalculation failed:", e);
        }
    })();

    return finance;
}

export async function getDetailedStats(storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;

    const productStatsData = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
            totalPrice: true,
            quantity: true
        },
        where: {
            productId: { not: null },
            ...(resolvedStoreId ? {
                order: { storeId: resolvedStoreId }
            } : {})
        }
    });

    const productStats = productStatsData.map(p => ({
        productId: p.productId,
        revenue: p._sum.totalPrice || 0,
        unitsSold: p._sum.quantity || 0
    }));

    const supplierStats: any[] = [];

    return {
        productStats,
        supplierStats
    };
}

export async function saveMonthlyGoal(storeId: string, month: number, year: number, data: any) {
    const goal = await prisma.monthlyGoal.upsert({
        where: { storeId_month_year: { storeId, month, year } },
        create: {
            storeId,
            month,
            year,
            adSpendBudget: Number(data.adSpendBudget) || 0,
            targetRoas: Number(data.targetRoas) || 0,
            breakevenRoas: Number(data.breakevenRoas) || 0,
            maxCpa: Number(data.maxCpa) || 0,
            maxCpc: Number(data.maxCpc) || 0,
            expectedConvRate: Number(data.expectedConvRate) || 0,
            expectedAvgTicket: Number(data.expectedAvgTicket) || 0,
        },
        update: {
            adSpendBudget: Number(data.adSpendBudget) || 0,
            targetRoas: Number(data.targetRoas) || 0,
            breakevenRoas: Number(data.breakevenRoas) || 0,
            maxCpa: Number(data.maxCpa) || 0,
            maxCpc: Number(data.maxCpc) || 0,
            expectedConvRate: Number(data.expectedConvRate) || 0,
            expectedAvgTicket: Number(data.expectedAvgTicket) || 0,
        }
    });

    revalidatePath("/finances");
    return goal;
}

// --- HYPOTHESIS ACTIONS ---

export async function saveHypothesis(data: any, storeId?: string) {
    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    if (!resolvedStoreId) throw new Error("No hay tienda disponible");

    const hypothesis = {
        id: `hyp_${Date.now()}`,
        ...data,
        storeId: resolvedStoreId,
        createdAt: new Date().toISOString()
    };

    return hypothesis;
}

export async function getHypotheses() {
    // Return empty array since we don't have persistent storage for hypotheses yet
    // In a real implementation, you'd fetch from a Hypothesis table
    return [];
}

export async function deleteHypothesis(id: string) {
    // Placeholder - would delete from Hypothesis table
    return { success: true, id };
}

export async function loadProductCosts(productId?: string, storeId?: string) {
    if (productId) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { finance: true }
        });
        if (!product) return null;
        return {
            productId: product.id,
            title: product.title,
            unitCost: product.finance?.unitCost || 0,
            shippingCost: product.finance?.shippingCost || 0,
            returnCost: product.finance?.returnCost || 0,
            sellingPrice: product.finance?.sellingPrice || 0
        };
    }

    const resolvedStoreId = storeId || (await prisma.store.findFirst())?.id;
    const products = await prisma.product.findMany({
        where: resolvedStoreId ? { storeId: resolvedStoreId } : {},
        include: {
            finance: true
        }
    });

    return products.map(p => ({
        productId: p.id,
        title: p.title,
        unitCost: p.finance?.unitCost || 0,
        shippingCost: p.finance?.shippingCost || 0,
        returnCost: p.finance?.returnCost || 0
    }));
}
