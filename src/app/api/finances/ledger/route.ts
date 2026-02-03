import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const entries = await prisma.ledgerEntry.findMany({
            orderBy: { date: 'desc' },
            take: 100
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}
