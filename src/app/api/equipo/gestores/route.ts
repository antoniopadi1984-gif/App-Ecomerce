/**
 * GET /api/equipo/gestores
 * Returns all active users with assignable roles, mapped to the Gestor shape
 * for use in order assignment dropdowns.
 *
 * NOTE: The User model currently only has (id, email, name).
 * The full Usuario schema (nombre, apellido, tipo, estado, color, etc.)
 * requires a Prisma migration — tracked in TODO.
 * Until then this route returns GESTORES_LIST fallback from the request header.
 *
 * Query params: storeId (required)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Gestor } from "@/types/usuario";

export const dynamic = "force-dynamic";

// Default colors for users without a color field yet
const DEFAULT_COLORS = ["#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#64748b"];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
        }

        // Fetch users with access to this store
        const accesos = await prisma.userStoreAccess.findMany({
            where: { storeId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        const gestores: Gestor[] = accesos
            .filter(a => a.user)
            .map((a, idx) => {
                const u = a.user!;
                const parts = (u.name || u.email || "Usuario").split(" ");
                const nombre = parts.length >= 2
                    ? `${parts[0]} ${parts[1].charAt(0)}.`
                    : parts[0];
                return {
                    id: u.id,
                    nombre,
                    tipo: "humano" as const,
                    activo: true,
                    color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                };
            });

        return NextResponse.json({ ok: true, gestores });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error interno";
        console.error("[API /equipo/gestores GET]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
