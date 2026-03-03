/**
 * GET /api/equipo/gestores-activos
 *
 * Returns all active users + bots with assignable roles.
 * Consumed by: Pedidos dropdown, Notas tab, any future module that needs assignment.
 *
 * No storeId required — gestores are global across the workspace.
 * Fields available after migration 20260303_add_usuario_fields.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Gestor } from "@/types/usuario";

export const dynamic = "force-dynamic";

const ASSIGNABLE_ROLES = ["admin", "gestor", "agente_ia"];
const DEFAULT_COLORS = ["#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#64748b"];

export async function GET() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usuarios: any[] = await (prisma.user as any).findMany({
            where: {
                OR: [
                    { estado: "activo" },
                    { tipo: "bot" },
                ],
                rol: { in: ASSIGNABLE_ROLES },
            },
            orderBy: [
                { tipo: "asc" },    // bots primero (bot < humano alphabetically)
                { nombre: "asc" },
            ],
            select: {
                id: true,
                nombre: true,
                apellido: true,
                tipo: true,
                rol: true,
                avatar: true,
                color: true,
                estado: true,
            },
        });

        const gestores: Gestor[] = usuarios.map((u, idx) => ({
            id: u.id,
            nombre: u.apellido
                ? `${u.nombre ?? "Usuario"} ${String(u.apellido).charAt(0)}.`
                : (u.nombre ?? `Usuario ${idx + 1}`),
            tipo: (u.tipo as "humano" | "bot") ?? "humano",
            activo: u.estado === "activo" || u.tipo === "bot",
            avatar: u.avatar ?? undefined,
            color: u.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        }));

        return NextResponse.json({ ok: true, gestores });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error interno";
        console.error("[API /equipo/gestores-activos GET]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
