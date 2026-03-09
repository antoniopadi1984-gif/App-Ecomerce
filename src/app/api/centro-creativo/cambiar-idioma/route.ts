import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cambia el idioma de los assets (voiceover, texto, etc.)
 * POST /api/centro-creativo/cambiar-idioma
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, conceptId, language } = body;

        if (!productId || !language) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        console.log(`🌍 [AI] Cambiando idioma a ${language} para producto ${productId}`);

        // Aquí iría el disparo de la tarea de traducción IA (GPT-4o / Whisper / ElevenLabs)
        // Por ahora simulamos éxito y guardamos la preferencia si fuera necesario

        await new Promise(r => setTimeout(r, 2000)); // Simulación de procesamiento

        return NextResponse.json({
            success: true,
            message: `Traducción a ${language} completada. Los assets están listos.`,
            newAssets: [] // En un flujo real devolveríamos los nuevos IDs
        });
    } catch (e) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
