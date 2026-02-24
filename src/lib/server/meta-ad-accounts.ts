import { prisma } from "@/lib/prisma";

export async function getStoreAdAccounts(storeId: string) {
    return (prisma as any).metaAdAccount.findMany({ where: { storeId } });
}

export async function getActiveAdAccount(storeId: string) {
    return (prisma as any).metaAdAccount.findFirst({ where: { storeId, isActive: true } });
}

export async function setActiveAdAccount(storeId: string, accountId: string) {
    await (prisma as any).metaAdAccount.updateMany({
        where: { storeId },
        data: { isActive: false }
    });
    return (prisma as any).metaAdAccount.update({
        where: { storeId_accountId: { storeId, accountId } },
        data: { isActive: true }
    });
}
