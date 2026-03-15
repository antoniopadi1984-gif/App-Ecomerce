import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ResearchOrchestrator } from '@/lib/research/research-orchestrator';
import { uploadTextToDrive } from '@/lib/services/drive-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

const FORMAT_INSTRUCTIONS: Record<string, string> = {
    ADVERTORIAL:  'Genera un advertorial de 800-1200 palabras. Estructura: Headline impactante → Historia del avatar → Problema → Descubrimiento del mecanismo → Prueba social → CTA urgente.',
    LISTICLE:     'Genera un listicle de 600-900 palabras. Estructura: Headline de lista → Intro → 5-7 puntos con mecanismo integrado → CTA.',
    VIDEO_SCRIPT: 'Genera un script de vídeo de 60-90 segundos. Estructura: Hook 0-3s → Problema 3-10s → Mecanismo 10-40s → Prueba 40-60s → CTA 60-90s. Incluye indicaciones de escena.',
    PDP:          'Genera copy de página de producto. Incluye: Headline, Subheadline, 3 bullets de beneficio, descripción del mecanismo, garantía, y CTA.',
    EMAIL:        'Genera email de venta. Asunto + Preencabezado + Cuerpo 400-600 palabras + CTA + PS.',
    SMS:          'Genera SMS de máximo 160 caracteres. Urgencia + beneficio + link.',
    WHATSAPP:     'Genera mensaje WhatsApp conversacional de 100-200 palabras. Tono cercano, emojis estratégicos, CTA claro.'
};

export async function POST(req: NextRequest) {
    const { productId, storeId, avatarIdx = 0, angleIdx = 0, format = 'ADVERTORIAL', versionId } = await req.json();

    if (!productId || !storeId) {
        return NextResponse.json({ error: 'productId y storeId requeridos' }, { status: 400 });
    }

    // 1. Verificar research listo
    const steps = await (prisma as any).researchStep?.findMany({
        where: { productId },
        select: { stepKey: true }
    }) || [];

    const completedSteps = steps.map((s: any) => s.stepKey);
    const required = ['P1', 'P2', 'P4', 'P3'];
    const missingSteps = required.filter((s: string) => !completedSteps.includes(s));

    if (missingSteps.length > 0) {
        return NextResponse.json({
            error: `Research incompleto. Faltan pasos: ${missingSteps.join(', ')}. Ejecuta el pipeline primero.`
        }, { status: 400 });
    }

    // 2. Generar copy con ResearchOrchestrator
    const orchestrator = new ResearchOrchestrator(productId);
    const result = await orchestrator.generateGodTierCopy(avatarIdx, angleIdx);

    // 3. Añadir instrucción de formato al copy base
    const formatInstruction = FORMAT_INSTRUCTIONS[format] || FORMAT_INSTRUCTIONS.ADVERTORIAL;
    const finalCopy = result.copy
        ? `${result.copy}\n\n---\nFORMATO APLICADO: ${format}\n${formatInstruction}`
        : result.raw || '';

    const wordCount = finalCopy.split(/\s+/).length;

    // 4. Guardar en BD
    const variant = await (prisma as any).copyVariant.create({
        data: {
            productId,
            storeId,
            versionId: versionId || null,
            avatarId: result.metadata?.avatar?.name || `avatar_${avatarIdx}`,
            angleId: result.metadata?.angle?.code || `angle_${angleIdx}`,
            format,
            content: finalCopy,
            wordCount
        }
    });

    // 5. Auto-save a Drive (no bloquea si falla)
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `COPY_${format}_${timestamp}.txt`;
        const driveResult = await uploadTextToDrive(
            productId,
            storeId,
            fileName,
            finalCopy,
            { subfolderName: '03_CONCEPTOS/COPY' }
        );
        await (prisma as any).copyVariant.update({
            where: { id: variant.id },
            data: { driveFileId: driveResult.driveFileId, driveUrl: driveResult.driveUrl }
        });
    } catch (e: any) {
        console.warn('[Copywriting] Drive upload failed (no crítico):', e.message);
    }

    return NextResponse.json({
        ok: true,
        copy: finalCopy,
        format,
        variantId: variant.id,
        wordCount,
        metadata: result.metadata
    });
}
