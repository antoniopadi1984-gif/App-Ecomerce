import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { GEMINI_PROMPTS_V3 } from '@/lib/research/research-v3-prompts';

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
            case 'P1': { // Product Core Forensic
                const promptTemplate = GEMINI_PROMPTS_V3.PRODUCT_CORE_FORENSIC;
                const prompt = promptTemplate
                    .replace('{{productTitle}}', product.title)
                    .replace('{{niche}}', (product as any).niche || product.title)
                    .replace('{{productFamily}}', (product as any).category || 'General')
                    .replace('{{country}}', 'España')
                    .replace('{{competitorsJson}}', '[]');

                const p1Result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, prompt, { jsonSchema: true });
                try {
                    const clean = p1Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p1Result.text;
                    resultJson = { raw: p1Result.text };
                }
                break;
            }

            case 'P2': // Macro Avatar Engine
                const p1Data = await getStepOutput('P1');
                const p2Result = await AiRouter.dispatch(
                    storeId,
                    TaskType.RESEARCH_DEEP,
                    `${GEMINI_PROMPTS_V3.MACRO_AVATAR_CREATION}
                    \n\nCONTEXTO REAL:
                    Producto: ${product.title}
                    Descripción: ${product.description || 'No disponible'}
                    Esencia del Producto (P1): ${JSON.stringify(p1Data)}`,
                    { jsonSchema: true }
                );
                try {
                    const clean = p2Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p2Result.text;
                    resultJson = { raw: p2Result.text };
                }
                break;

            case 'P3': // Language Bank
                const p2Data = await getStepOutput('P2');
                const p3Result = await AiRouter.dispatch(
                    storeId,
                    TaskType.RESEARCH_DEEP,
                    `${GEMINI_PROMPTS_V3.LANGUAGE_EXTRACTION}
                    \n\nCONTEXTO REAL:
                    Avatares Generados: ${JSON.stringify(p2Data)}`,
                    { jsonSchema: true }
                );
                try {
                    const clean = p3Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p3Result.text;
                    resultJson = { raw: p3Result.text };
                }
                break;

            case 'P4': // Angle Engine
                const _p1Data = await getStepOutput('P1');
                const _p2Data = await getStepOutput('P2');
                const _p3Data = await getStepOutput('P3');
                const p4Result = await AiRouter.dispatch(
                    storeId,
                    TaskType.RESEARCH_DEEP,
                    `${GEMINI_PROMPTS_V3.ANGLE_ENGINEERING_V3}
                    \n\nCONTEXTO REAL:
                    Producto: ${product.title}
                    Evidencia (P1): ${JSON.stringify(_p1Data)}
                    Avatar y Contexto (P2): ${JSON.stringify(_p2Data)}
                    Banco de Lenguaje (P3): ${JSON.stringify(_p3Data)}
                    Nivel Consciencia: Problem Aware
                    Sofisticación: 3`,
                    { jsonSchema: true }
                );
                try {
                    const clean = p4Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p4Result.text;
                    resultJson = { raw: p4Result.text };
                }
                break;

            case 'P5': { // Combo Matrix — Avatar x Ángulo con datos reales
                const _p2DataForP5 = await getStepOutput('P2');
                const _p4DataForP5 = await getStepOutput('P4');
                const p5Result = await AiRouter.dispatch(
                    storeId,
                    TaskType.RESEARCH_DEEP,
                    `Eres un experto en media buying y copywriting de respuesta directa.
                    Genera 50 combinaciones Avatar x Ángulo con hooks específicos basados EN LOS DATOS REALES proporcionados.
                    
                    Producto: ${product.title}
                    Avatares (P2): ${JSON.stringify(_p2DataForP5).slice(0, 3000)}
                    Ángulos de Ataque (P4): ${JSON.stringify(_p4DataForP5).slice(0, 3000)}
                    
                    Responde EXACTAMENTE en JSON:
                    { "combos": [{ "avatar": "nombre del avatar", "angle": "nombre del ángulo", "hook": "hook específico de 8-12 palabras", "painStatement": "frase de dolor visceral de 10-15 palabras", "funnelStage": "TOF|MOF|BOF" }] }`,
                    { jsonSchema: true }
                );
                try {
                    const clean = p5Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p5Result.text;
                    resultJson = { raw: p5Result.text };
                }

                // Guardado real en DB (ComboMatrix)
                await prisma.comboMatrix.create({
                    data: {
                        productId,
                        avatarId: 'AV_ALL',
                        angleId: 'ANG_ALL',
                        hookBank: JSON.stringify((resultJson as any)?.combos || []),
                        painStatements: JSON.stringify((resultJson as any)?.combos || []),
                    }
                });
                break;
            }

            case 'P6': // Vector Mapping
                const p6Result = await AiRouter.dispatch(
                    storeId,
                    TaskType.RESEARCH_DEEP,
                    `Vector Mapping: Dolor -> Mecanismo -> Prueba -> Resultado -> CTA.
                    Responde EXACTAMENTE en JSON con la estructura { "vectors": [{"dolor": "...", "mecanismo": "...", "prueba": "...", "resultado": "...", "cta": "..."}] }`,
                    { jsonSchema: true }
                );
                try {
                    const clean = p6Result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    resultText = JSON.stringify(resultJson);
                } catch {
                    resultText = p6Result.text;
                    resultJson = { raw: p6Result.text };
                }
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

