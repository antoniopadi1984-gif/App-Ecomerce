/**
 * PATCH /api/pedidos/[id]/gestor
 * Assigns or unassigns a gestor to a pedido.
 *
 * Body: { gestorId: string | null }
 * Returns: { ok: true, pedido: { id, gestorId } }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const { gestorId } = body as { gestorId: string | null };

        if (!id) {
            return NextResponse.json({ error: "pedido id requerido" }, { status: 400 });
        }

        const pedido = await prisma.order.update({
            where: { id },
            data: { assignedAgentId: gestorId ?? null },
            select: { id: true, assignedAgentId: true },
        });

        return NextResponse.json({ ok: true, pedido });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error interno";
        console.error("[API /pedidos/:id/gestor PATCH]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
