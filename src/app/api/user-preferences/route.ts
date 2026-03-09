import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Persiste las preferencias del usuario (orden de columnas, visibilidad, etc.)
 * POST /api/user-preferences
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { module, config, userId } = body;

        if (!module || !config) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        // En un entorno real usaríamos la sesión del usuario
        // Para esta demo/configuración buscamos o creamos por userId si se provee, o uno genérico
        const targetUserId = userId || (await prisma.user.findFirst())?.id;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const preference = await prisma.userPreference.upsert({
            where: {
                userId_module: {
                    userId: targetUserId,
                    module: module
                }
            },
            update: {
                config: typeof config === 'string' ? config : JSON.stringify(config)
            },
            create: {
                userId: targetUserId,
                module: module,
                config: typeof config === 'string' ? config : JSON.stringify(config)
            }
        });

        return NextResponse.json({ success: true, preference });
    } catch (e) {
        console.error("Error saving preferences:", e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * Obtiene las preferencias del usuario
 * GET /api/user-preferences?module=ads
 */
export async function GET(req: NextRequest) {
    try {
        const module = req.nextUrl.searchParams.get('module');
        const userId = req.nextUrl.searchParams.get('userId');

        if (!module) {
            return NextResponse.json({ error: 'Módulo requerido' }, { status: 400 });
        }

        const targetUserId = userId || (await prisma.user.findFirst())?.id;

        if (!targetUserId) {
            return NextResponse.json({ config: null });
        }

        const preference = await prisma.userPreference.findUnique({
            where: {
                userId_module: {
                    userId: targetUserId,
                    module: module
                }
            }
        });

        return NextResponse.json({
            config: preference?.config ? JSON.parse(preference.config) : null
        });
    } catch (e) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
