import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET: Listar AgentProfile del storeId con su model, temperature, tone, channels
 * PUT/POST: Actualizar AgentProfile — VALIDAR modelos deprecated.
 */

const DEPRECATED_MODELS = [
  'gemini-1.5-pro', 'gemini-1.5-pro-002', 'gemini-1.5-flash-002',
  'gemini-1.5-flash', 'gemini-3-flash-preview', 'gemini-1.5-pro-latest',
  'eleven_multilingual_v1', 'eleven_multilingual_v2'
];

export async function GET(req: NextRequest) {
    const storeId = req.nextUrl.searchParams.get('storeId');

    if (!storeId) {
        return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    try {
        const profiles = await prisma.agentProfile.findMany({
            where: { storeId },
            orderBy: { role: 'asc' }
        });

        return NextResponse.json(profiles);

    } catch (e: any) {
        console.error("[Settings Agents GET]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, storeId, model, temperature, tone, channels, instructions, name } = body;

        // Validación de modelo
        if (DEPRECATED_MODELS.includes(model)) {
            return NextResponse.json({
                error: "Modelo deprecated. Usar gemini-3.1-pro-preview o gemini-3.1-flash-lite-preview"
            }, { status: 400 });
        }

        if (id) {
            // Actualizar existente
            const updated = await prisma.agentProfile.update({
                where: { id },
                data: {
                    model,
                    temperature: temperature || 0.7,
                    tone: tone || "professional",
                    channels: channels ? JSON.stringify(channels) : undefined,
                    instructions: instructions || "",
                    name: name || undefined,
                    updatedAt: new Date()
                }
            });
            return NextResponse.json(updated);
        } else if (storeId) {
            // Crear nuevo (si id no viene pero storeId si)
            // No suele ser el flujo de settings pero lo soportamos por si acaso
            const created = await prisma.agentProfile.create({
                data: {
                    storeId,
                    role: body.role || "AUTO_CREATED",
                    model,
                    temperature: temperature || 0.7,
                    tone: tone || "professional",
                    instructions: instructions || "",
                    name: name || "Nuevo Agente"
                }
            });
            return NextResponse.json(created);
        } else {
            return NextResponse.json({ error: "id or storeId is required" }, { status: 400 });
        }

    } catch (e: any) {
        console.error("[Settings Agents PUT]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Mantener POST como alias de PUT
export const POST = PUT;
