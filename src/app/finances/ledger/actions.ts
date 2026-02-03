"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLedgerEntry(data: {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description: string;
    date?: Date;
}) {
    try {
        const store = await prisma.store.findFirst();
        if (!store) throw new Error("No store found");

        await prisma.ledgerEntry.create({
            data: {
                storeId: store.id,
                date: data.date || new Date(),
                type: data.type,
                category: data.category,
                amount: data.type === 'EXPENSE' ? -Math.abs(data.amount) : Math.abs(data.amount),
                description: data.description
            }
        });

        revalidatePath("/finances/ledger");
        revalidatePath("/finances");
        return { success: true };
    } catch (error) {
        console.error("Ledger create error:", error);
        return { success: false, message: "Error al crear entrada" };
    }
}

export async function getLedgerStats() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const entries = await prisma.ledgerEntry.findMany({
            where: {
                date: { gte: startOfMonth }
            }
        });

        const income = entries.filter((e: any) => e.type === 'INCOME').reduce((acc: number, e: any) => acc + e.amount, 0);
        const expenses = entries.filter((e: any) => e.type === 'EXPENSE').reduce((acc: number, e: any) => acc + e.amount, 0);

        return {
            monthlyIncome: income,
            monthlyExpenses: Math.abs(expenses),
            monthlyBalance: income + expenses
        };
    } catch (error) {
        return { monthlyIncome: 0, monthlyExpenses: 0, monthlyBalance: 0 };
    }
}
