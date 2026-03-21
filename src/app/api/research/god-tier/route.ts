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
    if (currency === 'MXN') return 'México (español mexicano, Google.com.mx, Amazon.com.mx, foros mexicanos)';
    if (currency === 'GBP') return 'Reino Unido (inglés británico, Amazon.co.uk)';
    return 'España (español de España, Google.es, Amazon.es)';
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
        const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        const resultJson = JSON.parse(clean);
        return { resultText: JSON.stringify(resultJson), resultJson };
    } catch {
        return { resultText: text, resultJson: { raw: text } };
    }
}

async function saveStep(productId: string, runId: string, stepKey: string, resultText: string, resultJson: any) {
    return (prisma as any).researchStep.upsert({
        where: { productId_runId_stepKey_version: { productId, runId, stepKey, version: 1 } },
        create: { productId, runId, stepKey, version: 1, inputRefs: null, outputText: resultText, outputJson: resultJson ? JSON.stringify(resultJson) : null },
        update: { outputText: resultText, outputJson: resultJson ? JSON.stringify(resultJson) : null, updatedAt: new Date() },
    });
}

export async function POST(req: NextRequest) {
    try {
        const { storeId, productId, runId: inputRunId, stepKey } = await req.json();
        if (!storeId || !productId || !stepKey)
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

        const runId = inputRunId || ('run_' + Date.now());
        const product = await (prisma as any).product.findUnique({
            where: { id: productId }, include: { store: true },
        });
        if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

        const country = countryContext(product.store);
        let resultText = '';
        let resultJson: Record<string, unknown> | null = null;

        switch (stepKey) {

            // ── P1: MASS DESIRE DISCOVERY — Gemini Deep Research ──────────────
            case 'P1': {
                let reviewsCtx = '';
                try {
                    const links = product.amazonLinks ? JSON.parse(product.amazonLinks) : [];
                    const urls = Array.isArray(links) ? links : [links].filter(Boolean);
                    const reviews = await ReviewScraper.gatherAllReviews(product.title, urls,
                        product.store?.currency === 'MXN' ? 'es-MX' : 'es');
                    if (reviews.totalReviews > 0)
                        reviewsCtx = '\n\nREVIEWS REALES (' + reviews.totalReviews + ' fuentes):\n' + reviews.combinedText.slice(0, 4000);
                } catch {}

                const p1Prompt = GEMINI_PROMPTS_V3.MASS_DESIRE_DISCOVERY
                    .replace('{{productTitle}}', product.title)
                    .replace('{{niche}}', (product as any).niche || product.title)
                    .replace('{{productFamily}}', (product as any).category || 'General')
                    .replace('{{country}}', country)
                    .replace('{{amazonUrls}}', JSON.stringify(product.amazonLinks ? JSON.parse(product.amazonLinks) : []))
                    + '\n\nPAIS/MERCADO: ' + country + '. Avatares, citas y analisis DEBEN ser de este mercado. Busca en foros, Reddit, Amazon y redes sociales del pais indicado.'
                    + reviewsCtx;

                const r = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, p1Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P2: MACRO AVATAR CREATION — Gemini Deep Research ──────────────
            case 'P2': {
                const p1 = await getStepOutput(productId, runId, 'P1');
                if (!p1) return NextResponse.json({ error: 'Ejecuta P1 primero' }, { status: 400 });

                const p2Prompt = GEMINI_PROMPTS_V3.MACRO_AVATAR_CREATION
                    .replace('{{productTitle}}', product.title)
                    .replace('{{productDescription}}', product.description || '')
                    .replace('{{niche}}', (product as any).niche || product.title)
                    .replace('{{country}}', country)
                    .replace('{{desiresJson}}', JSON.stringify(p1).slice(0, 8000))
                    + '\n\nPAIS: ' + country + '. Los avatares DEBEN ser personas reales de este mercado con nombres, situaciones y lenguaje local.';

                const r = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, p2Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P21: LANGUAGE BANK — Gemini Deep Research ─────────────────────
            case 'P21': {
                const p2 = await getStepOutput(productId, runId, 'P2');
                if (!p2) return NextResponse.json({ error: 'Ejecuta P2 primero' }, { status: 400 });

                const p21Prompt = GEMINI_PROMPTS_V3.LANGUAGE_EXTRACTION
                    .replace('{{productTitle}}', product.title)
                    .replace('{{country}}', country)
                    + '\n\nAVATARES (P2):\n' + JSON.stringify(p2).slice(0, 8000)
                    + '\n\nExtrae 13 secciones de lenguaje LITERAL por avatar. Frases EXACTAS del cliente, sin parafrasear. Incluye palabras tabu que NUNCA usan.';

                const r = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, p21Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P3: ANGLES + AD COPY — Claude via Replicate ───────────────────
            case 'P3': {
                const p1 = await getStepOutput(productId, runId, 'P1');
                const p2 = await getStepOutput(productId, runId, 'P2');
                const p21 = await getStepOutput(productId, runId, 'P21');
                if (!p1 || !p2) return NextResponse.json({ error: 'Ejecuta P1 y P2 primero' }, { status: 400 });

                const p3Prompt = 'Eres un experto en copywriting de respuesta directa para el mercado de ' + country + '.\n\n'
                    + 'PRODUCTO: ' + product.title + '\n'
                    + 'DESCRIPCION: ' + (product.description || '') + '\n'
                    + 'MERCADO: ' + country + '\n\n'
                    + 'INVESTIGACION DE MERCADO (P1):\n' + JSON.stringify(p1).slice(0, 3000) + '\n\n'
                    + 'AVATARES MACRO (P2):\n' + JSON.stringify(p2).slice(0, 3000) + '\n\n'
                    + (p21 ? ('LANGUAGE BANK (P21):\n' + JSON.stringify(p21).slice(0, 2500) + '\n\n') : '')
                    + 'MISION: God Tier Framework.\n\n'
                    + 'PASO 1 — BLOCKING BELIEFS (3-5): Creencias del avatar principal que bloquean la compra.\n\n'
                    + 'PASO 2 — 5-7 ANGULOS: Cada angulo destruye una blocking belief. Plain English. IQ 90. Sin guiones largos.\n\n'
                    + 'PASO 3 — AD COPY Story Lead completo (800-1200 palabras) para el angulo mas fuerte:\n'
                    + '1. Hook (patron fear/loss)\n'
                    + '2. Identificacion inmediata (75-150 palabras, 1a persona)\n'
                    + '3. Amplificacion (150-250 palabras, soluciones fallidas)\n'
                    + '4. Descubrimiento del producto (150-250 palabras, vida real no investigacion)\n'
                    + '5. UMP Introduccion (100-150 palabras, mecanismo del problema)\n'
                    + '6. UMS Introduccion (100-150 palabras, mecanismo de la solucion)\n'
                    + '7. Transformacion (125-200 palabras, frases cortas, foco emocional)\n'
                    + '8. CTA (150-200 palabras, 2a persona)\n\n'
                    + 'RESPONDE EXACTAMENTE en JSON valido:\n'
                    + '{\n'
                    + '  "blockingBeliefs": [{"belief": "", "evidence": "", "whyItBlocks": ""}],\n'
                    + '  "angles": [{"id": "", "plainEnglish": "", "currentBelief": "", "newInfo": "", "whyTheyBuy": "", "proof": ""}],\n'
                    + '  "adCopy": {\n'
                    + '    "targetAvatar": "", "selectedAngle": "", "hook": "",\n'
                    + '    "immediateIdentification": "", "amplification": "",\n'
                    + '    "productDiscovery": "", "umpIntroduction": "", "umsIntroduction": "",\n'
                    + '    "transformation": "", "cta": "", "fullCopy": ""\n'
                    + '  }\n'
                    + '}';

                const r = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, p3Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P4: COMBO MATRIX ───────────────────────────────────────────────
            case 'P4': {
                const p2 = await getStepOutput(productId, runId, 'P2');
                const p3 = await getStepOutput(productId, runId, 'P3');
                if (!p2) return NextResponse.json({ error: 'Ejecuta P2 primero' }, { status: 400 });

                const p4Prompt = 'Combo Matrix para ' + product.title + ' | ' + country + '.\n'
                    + 'Avatares: ' + JSON.stringify(p2).slice(0, 3000) + '\n'
                    + 'Angulos: ' + JSON.stringify(p3 || {}).slice(0, 2000) + '\n'
                    + 'Genera 30+ combos en JSON: { "combos": [{ "comboId": "COMBO_AV01_ANG01", "avatar": "", "angle": "", "hook": "", "painStatement": "", "funnelStage": "TOF|MOF|BOF", "creativeType": "video|image|carousel" }] }';

                const r = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, p4Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                try {
                    await (prisma as any).comboMatrix.create({ data: { productId, avatarId: 'ALL', angleId: 'ALL', hookBank: JSON.stringify((resultJson as any)?.combos || []), painStatements: JSON.stringify((resultJson as any)?.combos || []) } });
                } catch {}
                break;
            }

            // ── P5: VECTOR MAPPING ─────────────────────────────────────────────
            case 'P5': {
                const p1 = await getStepOutput(productId, runId, 'P1');
                const p3 = await getStepOutput(productId, runId, 'P3');
                const p5Prompt = 'Vector Mapping para ' + product.title + ' en ' + country + '.\n'
                    + 'Mercado (P1): ' + JSON.stringify(p1 || {}).slice(0, 2000) + '\n'
                    + 'Angulos (P3): ' + JSON.stringify(p3 || {}).slice(0, 2000) + '\n'
                    + 'JSON: { "vectors": [{ "dolor": "", "mecanismo": "", "prueba": "", "resultado": "", "cta": "", "competidorDebilidad": "", "nuestraVentaja": "" }], "posicionamiento": { "categoriaCreada": "", "enemigoPrincipal": "", "claimUnico": "" } }';
                const r = await AiRouter.dispatch(storeId, TaskType.RESEARCH_DEEP, p5Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P6: CREATIVE BRIEFS ────────────────────────────────────────────
            case 'P6': {
                const p3 = await getStepOutput(productId, runId, 'P3');
                const p4 = await getStepOutput(productId, runId, 'P4');
                const p6Prompt = 'Creative Briefs para ' + product.title + ' en ' + country + '.\n'
                    + 'Copy (P3): ' + JSON.stringify(p3 || {}).slice(0, 2000) + '\n'
                    + 'Combos (P4): ' + JSON.stringify(p4 || {}).slice(0, 2000) + '\n'
                    + 'JSON: { "creativeBriefs": [{ "format": "UGC|STATIC|CAROUSEL", "hook": "", "estructura": "", "duracion": "", "avatarTarget": "", "angleUsed": "", "scriptOutline": "" }] }';
                const r = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, p6Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            // ── P7: LANDING ANALYZER ───────────────────────────────────────────
            case 'P7': {
                const p3 = await getStepOutput(productId, runId, 'P3');
                const p5 = await getStepOutput(productId, runId, 'P5');
                const basePrompt = GEMINI_PROMPTS_V3.COMPETITOR_ANALYSIS_V3 || '';
                const p7Prompt = (basePrompt || 'Analiza landing pages optimas para el producto.')
                    .replace('{{competitorsJson}}', 'Producto: ' + product.title + ' | ' + country)
                    + '\nCopy (P3): ' + JSON.stringify(p3 || {}).slice(0, 1500)
                    + '\nVectores (P5): ' + JSON.stringify(p5 || {}).slice(0, 1500);
                const r = await AiRouter.dispatch(storeId, TaskType.RESEARCH_FORENSIC, p7Prompt, { jsonSchema: true });
                ({ resultText, resultJson } = parseAiResult(r.text));
                break;
            }

            default:
                return NextResponse.json({ error: 'StepKey invalido: ' + stepKey }, { status: 400 });
        }

        const stepRecord = await saveStep(productId, runId, stepKey, resultText, resultJson);

        // Subir automáticamente a Drive en la carpeta correcta de 1_INVESTIGACION
        const STEP_DRIVE_MAP: Record<string, string> = {
            'P1': 'P1_PRODUCTO',
            'P2': 'P2_AVATARES',
            'P21': 'P2_AVATARES',
            'P3': 'P3_COMPETENCIA',
            'P4': 'P4_ANGULOS',
            'P5': 'P5_HOOKS',
            'P6': 'P6_OBJECIONES',
            'P7': 'P7_OFERTA',
        };
        const driveSubfolder = STEP_DRIVE_MAP[stepKey];
        if (driveSubfolder && product.driveFolderId) {
            try {
                const { saveResearchDoc } = await import('@/lib/services/drive-service');
                const sku = product.sku || product.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
                const docName = `${sku}_${stepKey}_${driveSubfolder}`;
                await saveResearchDoc(
                    product.driveFolderId,
                    `1_INVESTIGACION/${driveSubfolder}`,
                    docName,
                    resultText,
                    { supportsAllDrives: true }
                );
                console.log(`[God-Tier] ✅ ${stepKey} subido a Drive: 1_INVESTIGACION/${driveSubfolder}/${docName}`);
            } catch (driveErr: any) {
                console.warn(`[God-Tier] ⚠️ Drive upload falló para ${stepKey} (no crítico):`, driveErr.message);
            }
        }

        return NextResponse.json({ success: true, stepKey, runId, stepId: stepRecord.id, result: resultJson || resultText });

    } catch (e: any) {
        console.error('[God-Tier Error]', e);
        return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
    }
}
