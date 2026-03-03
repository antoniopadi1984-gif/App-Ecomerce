/**
 * GET /api/equipo/gestores
 * Returns active usuarios with assignable roles (gestor | admin | agente_ia),
 * mapped to the Gestor shape for use in order-assignment dropdowns.
 *
 * Source of truth: User table via UserStoreAccess.
 * Uses new Usuario fields (nombre, apellido, rol, tipo, estado, color)
 * added in migration 20260303_add_usuario_fields.
 *
 * Query params: storeId (required)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Gestor } from "@/types/usuario";

export const dynamic = "force-dynamic";

const ASSIGNABLE_ROLES = ["admin", "gestor", "agente_ia"];
const DEFAULT_COLORS = ["#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#64748b"];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
        }

        // Pull users with access to this store
        const accesos = await prisma.userStoreAccess.findMany({
            where: { storeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        // Extended Usuario fields — available after migration
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ...(true as any), // bypass static type to allow new fields
                    },
                },
            },
        });

        const gestores: Gestor[] = accesos
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map(a => a.user as any)
            .filter(Boolean)
            .filter((u: Record<string, string>) => {
                // If 'rol' field exists, filter by assignable roles
                if (u.rol) return ASSIGNABLE_ROLES.includes(u.rol);
                // If field not yet migrated, include everyone
                return true;
            })
            .filter((u: Record<string, string>) => {
                // If 'estado' exists, only activo; otherwise include all
                if (u.estado) return u.estado === "activo";
                return true;
            })
            .map((u: Record<string, string>, idx: number) => {
                // Build display name — prefer nuevo campo, fallback to name
                const nombre = u.nombre && u.apellido
                    ? `${u.nombre} ${u.apellido.charAt(0)}.`
                    : u.nombre
                        ? u.nombre
                        : (() => {
                            const parts = (u.name || u.email || "Usuario").split(" ");
                            return parts.length >= 2
                                ? `${parts[0]} ${parts[1].charAt(0)}.`
                                : parts[0];
                        })();

                return {
                    id: u.id,
                    nombre,
                    tipo: (u.tipo as "humano" | "bot") ?? "humano",
                    activo: true,
                    avatar: u.avatar ?? undefined,
                    color: u.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                };
            });

        return NextResponse.json({ ok: true, gestores });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error interno";
        console.error("[API /equipo/gestores GET]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
