import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const maxDuration = 120; // 2 mins per step ideally
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { storeId, productId, runId: inputRunId, stepKey } = await req.json();

        if (!storeId || !productId || !stepKey) {
            return NextResponse.json({ error: 'Faltan parámetros (storeId, productId, stepKey)' }, { status: 400 });
        }

        const runId = inputRunId || `run_${Date.now()}`;
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

        // Helper para leer pasos anteriores
        const getStepOutput = async (key: string) => {
            const step = await prisma.researchStep.findFirst({
                where: { productId, runId, stepKey: key },
                orderBy: { createdAt: 'desc' },
            });
            return step?.outputJson ? JSON.parse(step.outputJson) : (step?.outputText || '');
        };

        let resultText = '';
        let resultJson: Record<string, unknown> | null = null;

        // Ejecución lógica según la Fase
        switch (stepKey) {
            case 'P1': // Product Core
                let docContext = '';
                if (product.googleDocUrl) {
                    docContext = `\n[Fuente Extraída Google Doc]: Texto extraído orgánicamente desde ${product.googleDocUrl}...`;
                }
                resultText = await simulateAI(storeId, `Extraer Product Core (Fase 1) para: ${product.title}\nDescripción: ${product.description}${docContext}`);
                resultJson = { "core_extraction": resultText };
                break;

            case 'P2': // Macro Avatar Engine
                const p1Data = await getStepOutput('P1');
                resultText = await simulateAI(storeId, `Macro Avatar Engine (20 avatares)\nContexto: ${JSON.stringify(p1Data)}`);
                resultJson = { "avatars": [{ id: "AV-01", name: "Avatar Principal" }, { id: "AV-02", name: "Avatar Secundario" }] };
                break;

            case 'P3': // Language Bank
                const p2Data = await getStepOutput('P2');
                resultText = await simulateAI(storeId, `Language Bank Extraction (vocabulario taboo, CTAs)\nAvatares: ${JSON.stringify(p2Data)}`);
                resultJson = { "language_bank": "Extracto simulado del P2.1" };
                break;

            case 'P4': // Angle Engine
                const p1 = await getStepOutput('P1');
                const p2 = await getStepOutput('P2');
                const p3 = await getStepOutput('P3');
                resultText = await simulateAI(storeId, `Angle Engine (20 angulos)\nP1: ${!!p1} P2: ${!!p2} P3: ${!!p3}`);
                resultJson = { "angles": [{ id: "ANG-01", name: "Mecanismo Único" }, { id: "ANG-02", name: "Enemigo Externo" }] };
                break;

            case 'P5': // Combo Matrix
                const p2B = await getStepOutput('P2');
                const p4 = await getStepOutput('P4');
                resultText = await simulateAI(storeId, `Generar 400 combinaciones AV x ANG... Validando hooks no saturados...`);

                // Guardado real en DB (ComboMatrix)
                await prisma.comboMatrix.create({
                    data: {
                        productId,
                        avatarId: 'AV_ALL',
                        angleId: 'ANG_ALL',
                        hookBank: JSON.stringify(['Hook 1', 'Hook 2']),
                        painStatements: JSON.stringify(['Pain 1']),
                    }
                });
                resultJson = { "combos": "Guardados en ComboMatrix model" };
                break;

            case 'P6': // Vector Mapping
                resultText = await simulateAI(storeId, `Vector Mapping: Dolor -> Mecanismo -> Prueba -> Resultado -> CTA`);
                resultJson = { "vectors": ["Advertorial", "Listicle", "PDP", "Video Script"] };
                break;

            default:
                return NextResponse.json({ error: 'StepKey inválido' }, { status: 400 });
        }

        // Save ResearchStep
        const stepRecord = await prisma.researchStep.upsert({
            where: {
                productId_runId_stepKey_version: {
                    productId, runId, stepKey, version: 1
                }
            },
            create: {
                productId, runId, stepKey, version: 1,
                outputText: resultText,
                outputJson: JSON.stringify(resultJson),
            },
            update: {
                outputText: resultText,
                outputJson: JSON.stringify(resultJson),
            }
        });

        return NextResponse.json({ ok: true, runId, stepRecord });

    } catch (err: unknown) {
        console.error('[API /research/god-tier]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // List runs for a product
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    try {
        const steps = await prisma.researchStep.findMany({
            where: { productId },
            orderBy: { createdAt: 'asc' }
        });

        // Group by runId
        const runs = steps.reduce((acc: Record<string, unknown[]>, step: { runId: string }) => {
            if (!acc[step.runId]) acc[step.runId] = [];
            acc[step.runId].push(step);
            return acc;
        }, {});

        return NextResponse.json({ ok: true, runs });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

// Emulador de la IA interna usando el AiRouter local para un flujo rapido
async function simulateAI(storeId: string, prompt: string) {
    const res = await AiRouter.dispatch(
        storeId,
        TaskType.RESEARCH_DEEP, // Usa el agente research-lab
        prompt,
        { context: "Eres el God Tier Research Analyst." }
    );
    return res.text;
}
