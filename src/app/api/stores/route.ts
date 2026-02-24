/**
 * Stores API — Lista y crea stores.
 * GET: devuelve stores disponibles (sin auth: todos)
 * POST: crea store nuevo
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true,
                domain: true,
                currency: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ stores });
    } catch (error: any) {
        console.error("[API /stores] Error:", error);
        return NextResponse.json(
            { error: "Error al cargar tiendas" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, domain, currency } = body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json(
                { error: "El nombre de la tienda es obligatorio (mín. 2 caracteres)" },
                { status: 400 }
            );
        }

        const store = await prisma.store.create({
            data: {
                name: name.trim(),
                domain: domain || null,
                currency: currency || "EUR",
            },
            select: {
                id: true,
                name: true,
                domain: true,
                currency: true,
            },
        });

        // Registrar en AuditLog
        await prisma.auditLog.create({
            data: {
                action: "STORE_CREATED",
                entity: "STORE",
                entityId: store.id,
                storeId: store.id,
                actorType: "HUMAN",
                newValue: JSON.stringify({ name: store.name, domain: store.domain }),
            },
        });

        return NextResponse.json({ store }, { status: 201 });
    } catch (error: any) {
        console.error("[API /stores] Error creating store:", error);
        return NextResponse.json(
            { error: "Error al crear tienda" },
            { status: 500 }
        );
    }
}
