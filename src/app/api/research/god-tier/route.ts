import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { GEMINI_PROMPTS_V3 } from '@/lib/research/research-v3-prompts';
import { ReviewScraper } from '@/lib/research/review-scraper';

export const maxDuration = 300;
export const runtime = 'nodejs';

function countryContext(store: any): string {
    const currency = store?.currency || 'EUR';
    if (currency === 'MXN') return 'México (español mexicano, busca en Google.com.mx, Amazon.com.mx, foros mexicanos, precios en MXN)';
    if (currency === 'GBP') return 'Reino Unido (inglés británico, Amazon.co.uk)';
    return 'España (español de España, Google.es, Amazon.es, foros españoles)';
}

async function getStepOutput(productId: string, runId: string, key: string) {
    const step = await (prisma as any).researchStep.findFirst({
        where: { productId, runId, stepKey: key },
        orderBy: { createdAt: 'desc' },
    });
    if (!step) return null;
    if (step.outputJson) { try { return JSON.parse(step.outputJson); } catch {} }
    return step.outputText || null;
}

function parseAiResult(text: string): { resultText: string; resultJson: Record<string, unknown> | null } {
    try {
        const clean = text.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`/g, '').trim();
        const resultJson = JSON.parse(clean);
        return { resultText: JSON.stringify(resultJson), resultJson };
    } catch {
        return { resultText: text, resultJson: { raw: text } };
    }
}

export async function POST(req: NextRequest) {
    try {
        const { storeId, productId, runId: inputRunId, stepKey } = await req.json();
        if (!storeId || !productId || !stepKey)
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

        const runId = inputRunId || \`run_${Date.now()}\`;
        const product = await (prisma as any).product.findUnique({
            where: { id: productId }, include: { store: true },
        });
        if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

        const country = countryContext(product.store);
        let resultText = '';
        let resultJson: Record<string, unknown> | null = null;

        switch (stepKey) {

            case 'P1': {
                let realReviewsContext = '';
                try {
                    const amazonLinks = product.amazonLinks ? JSON.parse(product.amazonLinks) : [];
                    const amazonUrls = Array.isArray(amazonLinks) ? amazonLinks : [amazonLinks].filter(Boolean);
                    const reviews = await ReviewScraper.gatherAllReviews(product.title, amazonUrls,
                        product.store?.currency === 'MXN' ? 'es-MX' : 'es');
                    if (reviews.totalReviews > 0)
                        realReviewsContext = \`\n\nREVIEWS REALES (${reviews.totalReviews} fuentes):\n${reviews.combinedText.slice(0, 4000)}\`;
                } catch {}

                const prompt = GEMINI_PROMPTS_V3.MASS_DESIRE_DISCOVERY
                    .replace('{{productTitle}}', product.title)
                    .replace('{{niche}}', (product as any).niche || product.title)
                    .replace('{{productFamily}}', (product as any).category || 'General')
                    .replace('{{country}}', country)
                    .replace('{{amazonUrls}}', JSON.stringify(product.amazonLinks ? JSON.parse(product.amazonLinks) : []))
                    + \`\n\nPAÍS/MERCADO: ${country}. Avatares, citas y análisis DEBEN ser de este mercado.\`
                    + realReviewsContext;

                const result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P2': {
                const p1Data = await getStepOutput(productId, runId, 'P1');
                if (!p1Data) return NextResponse.json({ error: 'Ejecuta P1 primero' }, { status: 400 });

                const prompt = GEMINI_PROMPTS_V3.MACRO_AVATAR_CREATION
                    .replace('{{productTitle}}', product.title)
                    .replace('{{productDescription}}', product.description || '')
                    .replace('{{niche}}', (product as any).niche || product.title)
                    .replace('{{country}}', country)
                    .replace('{{desiresJson}}', JSON.stringify(p1Data).slice(0, 8000))
                    + \`\n\nPAÍS: ${country}. Los avatares DEBEN ser personas reales de este mercado, con nombres y lenguaje local.\`;

                const result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P21': {
                const p2Data = await getStepOutput(productId, runId, 'P2');
                if (!p2Data) return NextResponse.json({ error: 'Ejecuta P2 primero' }, { status: 400 });

                const prompt = GEMINI_PROMPTS_V3.LANGUAGE_EXTRACTION
                    .replace('{{productTitle}}', product.title)
                    .replace('{{country}}', country)
                    + \`\n\nAVATARES (P2):\n${JSON.stringify(p2Data).slice(0, 8000)}\`
                    + \`\n\nExtrae 13 secciones de lenguaje literal por avatar. Frases EXACTAS, sin parafrasear.\`;

                const result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P3': {
                const p1Data = await getStepOutput(productId, runId, 'P1');
                const p2Data = await getStepOutput(productId, runId, 'P2');
                const p21Data = await getStepOutput(productId, runId, 'P21');
                if (!p1Data || !p2Data) return NextResponse.json({ error: 'Ejecuta P1 y P2 primero' }, { status: 400 });

                const anglePrompt = \`Eres un experto en copywriting de respuesta directa para el mercado de ${country}.

PRODUCTO: ${product.title}
DESCRIPCIÓN: ${product.description || ''}
MERCADO: ${country}

INVESTIGACIÓN DE MERCADO (P1):
${JSON.stringify(p1Data).slice(0, 3500)}

AVATARES MACRO (P2):
${JSON.stringify(p2Data).slice(0, 3500)}

${p21Data ? \`LANGUAGE BANK (P2.1):\n${JSON.stringify(p21Data).slice(0, 2500)}\` : ''}

MISIÓN: Genera ángulos de marketing y ad copy siguiendo el God Tier Framework.

PASO 1 — BLOCKING BELIEFS (3-5): Creencias que bloquean la compra del avatar principal.

PASO 2 — 5-7 ÁNGULOS: Cada ángulo destruye una blocking belief. Plain English. IQ 90.

PASO 3 — AD COPY completo (Story Lead, 800-1200 palabras) para el ángulo más fuerte:
- Hook (patrón fear/loss)
- Identificación inmediata (75-150 palabras, 1ª persona)
- Amplificación (150-250 palabras, soluciones fallidas)
- Descubrimiento del producto (150-250 palabras, vida real)
- UMP Introducción (100-150 palabras, mecanismo del problema)
- UMS Introducción (100-150 palabras, mecanismo de la solución)
- Transformación (125-200 palabras, frases cortas, emocional)
- CTA (150-200 palabras, 2ª persona)

RESPONDE EXACTAMENTE en JSON válido:
{
  "blockingBeliefs": [{"belief": "", "evidence": "", "whyItBlocks": ""}],
  "angles": [{"id": "", "plainEnglish": "", "currentBelief": "", "newInfo": "", "whyTheyBuy": "", "proof": ""}],
  "adCopy": {
    "targetAvatar": "",
    "selectedAngle": "",
    "hook": "",
    "immediateIdentification": "",
    "amplification": "",
    "productDiscovery": "",
    "umpIntroduction": "",
    "umsIntroduction": "",
    "transformation": "",
    "cta": "",
    "fullCopy": ""
  }
}\`;

                const result = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, anglePrompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P4': {
                const p2Data = await getStepOutput(productId, runId, 'P2');
                const p3Data = await getStepOutput(productId, runId, 'P3');
                if (!p2Data) return NextResponse.json({ error: 'Ejecuta P2 primero' }, { status: 400 });

                const prompt = \`Combo Matrix para ${product.title} | ${country}.
Avatares: ${JSON.stringify(p2Data).slice(0, 3000)}
Ángulos: ${JSON.stringify(p3Data || {}).slice(0, 2000)}
Genera 30+ combos. JSON: { "combos": [{ "comboId": "COMBO_AV01_ANG01", "avatar": "", "angle": "", "hook": "", "painStatement": "", "funnelStage": "TOF|MOF|BOF", "creativeType": "video|image|carousel" }] }\`;

                const result = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                try {
                    await (prisma as any).comboMatrix.create({ data: { productId, avatarId: 'ALL', angleId: 'ALL', hookBank: JSON.stringify((resultJson as any)?.combos || []), painStatements: JSON.stringify((resultJson as any)?.combos || []) } });
                } catch {}
                break;
            }

            case 'P5': {
                const p1Data = await getStepOutput(productId, runId, 'P1');
                const p3Data = await getStepOutput(productId, runId, 'P3');
                const prompt = \`Vector Mapping para ${product.title} en ${country}.
Mercado (P1): ${JSON.stringify(p1Data || {}).slice(0, 2000)}
Ángulos (P3): ${JSON.stringify(p3Data || {}).slice(0, 2000)}
JSON: { "vectors": [{ "dolor": "", "mecanismo": "", "prueba": "", "resultado": "", "cta": "", "competidorDebilidad": "", "nuestraVentaja": "" }], "posicionamiento": { "categoriaCreada": "", "enemigoPrincipal": "", "claimUnico": "" } }\`;
                const result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P6': {
                const p3Data = await getStepOutput(productId, runId, 'P3');
                const p4Data = await getStepOutput(productId, runId, 'P4');
                const prompt = \`Creative Briefs para ${product.title} en ${country}.
Copy (P3): ${JSON.stringify(p3Data || {}).slice(0, 2000)}
Combos (P4): ${JSON.stringify(p4Data || {}).slice(0, 2000)}
JSON: { "creativeBriefs": [{ "format": "UGC|STATIC|CAROUSEL", "hook": "", "estructura": "", "duracion": "", "avatarTarget": "", "angleUsed": "", "scriptOutline": "" }] }\`;
                const result = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            case 'P7': {
                const p3Data = await getStepOutput(productId, runId, 'P3');
                const p5Data = await getStepOutput(productId, runId, 'P5');
                const prompt = (GEMINI_PROMPTS_V3.COMPETITOR_ANALYSIS_V3 || \`Landing page óptima para ${product.title} en ${country}.\`)
                    .replace('{{competitorsJson}}', \`Producto: ${product.title} | ${country}\`)
                    + \`\nCopy (P3): ${JSON.stringify(p3Data || {}).slice(0, 1500)}\`
                    + \`\nVectores (P5): ${JSON.stringify(p5Data || {}).slice(0, 1500)}\`;
                const result = await AiRouter.dispatch(storeId, TaskType.RESEARCH_FORENSIC, prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(result.text));
                break;
            }

            default:
                return NextResponse.json({ error: \`StepKey inválido: ${stepKey}\` }, { status: 400 });
        }

        const stepRecord = await (prisma as any).researchStep.upsert({
            where: { productId_runId_stepKey_version: { productId, runId, stepKey, version: 1 } },
            create: { productId, runId, stepKey, version: 1, inputText: '', outputText: resultText, outputJson: resultJson ? JSON.stringify(resultJson) : null },
            update: { outputText: resultText, outputJson: resultJson ? JSON.stringify(resultJson) : null, updatedAt: new Date() },
        });

        return NextResponse.json({ success: true, stepKey, runId, stepId: stepRecord.id, result: resultJson || resultText });

    } catch (e: any) {
        console.error('[God-Tier Error]', e);
        return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
    }
}
