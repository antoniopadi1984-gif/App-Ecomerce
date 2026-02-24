import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { requireStoreIdNext } from "@/lib/server/store-context";

// GET - List expenses for a month
export async function GET(request: NextRequest) {
    try {
        const storeId = await requireStoreIdNext();
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(startDate);

        const expenses = await prisma.expense.findMany({
            where: {
                storeId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'desc' }
        });

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);

        return NextResponse.json({ expenses, total });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED_STORE_CONTEXT" ? 401 : 500 });
    }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
    try {
        const storeId = await requireStoreIdNext();
        const body = await request.json();
        const { amount, category, description, date } = body;

        if (!amount || !category) {
            return NextResponse.json({ error: "amount and category are required" }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                storeId,
                amount: parseFloat(amount),
                category,
                description: description || null,
                date: date ? new Date(date) : new Date()
            }
        });

        return NextResponse.json({ success: true, expense });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED_STORE_CONTEXT" ? 401 : 500 });
    }
}

// DELETE - Remove expense by ID
export async function DELETE(request: NextRequest) {
    try {
        await requireStoreIdNext(); // Solo validación de contexto
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
        }

        await prisma.expense.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED_STORE_CONTEXT" ? 401 : 500 });
    }
}
