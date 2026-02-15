import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const entity = searchParams.get("entity");
        const search = searchParams.get("search");

        const where: any = {};
        if (entity && entity !== "ALL") {
            where.entity = entity;
        }
        if (search) {
            where.OR = [
                { action: { contains: search } },
                { entity: { contains: search } },
                { entityId: { contains: search } },
            ];
        }

        const entries = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return NextResponse.json(entries);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, entity, entityId, storeId } = body;

        if (!action || !entity || !entityId) {
            return NextResponse.json(
                { error: "action, entity y entityId son obligatorios" },
                { status: 400 }
            );
        }

        const resolvedStoreId = storeId || entityId || "unknown";

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                storeId: resolvedStoreId,
                actorType: "HUMAN",
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[AuditLog POST] Error:", error.message);
        return NextResponse.json(
            { error: "Error al registrar evento" },
            { status: 500 }
        );
    }
}
