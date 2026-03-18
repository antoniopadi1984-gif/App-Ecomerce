import { transcribeVideo, stripMetadata } from '@/lib/services/whisper-service';
import { getOrCreateConceptFolder, ConceptKey, Phase } from '@/lib/services/drive-service';
import { getDriveClient } from '@/lib/services/drive-service';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AnalysisResult {
    concept: ConceptKey;
    phase: Phase;
    framework: string;
    hookScore: number;
    consciousnessLevel: number;
    scriptEs: string;
    metaCopy: { headline: string; body: string; cta: string };
    primaryAngle: string;
    secondaryAngle: string;
    primaryDesire: string;
    secondaryDesire: string;
    timestamps: { start: number; end: number; section: string; text: string }[];
    whyItWorks: string;
    improvements: string[];
    variantsRecommended: string[];
}

export async function analyzeCompetitorVideo(params: {
    videoPath: string;
    productId: string;
    storeId: string;
    competitorName?: string;
    adCopy?: string;
    isOwn?: boolean;
}): Promise<{ success: boolean; nomenclature: string; driveUrl: string; analysis: AnalysisResult }> {

    const { videoPath, productId, storeId, competitorName, adCopy, isOwn = false } = params;

    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { title: true, sku: true, driveFolderId: true }
    });

    const sku = (product?.sku || product?.title || 'PROD')
        .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

    // 1. Transcribir
    const transcription = await transcribeVideo(videoPath);

    // 2. Analizar con Gemini
    const analysis = await analyzeWithGemini(transcription.text, transcription.language, adCopy);

    // 3. Versión
    const version = await getNextVersion(productId, analysis.concept, isOwn);

    // 4. Nomenclatura
    const nomenclature = `${sku}_${analysis.concept}_${version}`;
    const ext = path.extname(videoPath) || '.mp4';

    // 5. Limpiar metadata
    const tmpDir = os.tmpdir();
    const cleanPath = path.join(tmpDir, `${nomenclature}${ext}`);
    await stripMetadata(videoPath, cleanPath);

    // 6. Subir a Drive
    const drive = await getDriveClient();
    const section = isOwn ? 'CREATIVOS' : 'COMPETENCIA';
    const phaseFolderId = await getOrCreateConceptFolder(
        product.driveFolderId,
        section,
        analysis.concept,
        analysis.phase
    );

    const videoStream = fs.createReadStream(cleanPath);
    const driveFile = await drive.files.create({
        requestBody: { name: `${nomenclature}${ext}`, parents: [phaseFolderId] },
        media: { mimeType: 'video/mp4', body: videoStream },
        fields: 'id,webViewLink',
        supportsAllDrives: true,
    });
    const driveUrl = driveFile.data.webViewLink || '';

    // 7. Crear DOC análisis
    await createAnalysisDoc(drive, phaseFolderId, nomenclature, analysis, adCopy, competitorName, driveUrl, isOwn);

    // 8. BD
    try {
        await (prisma as any).competitorVideo.upsert({
            where: { nomenclature },
            create: {
                productId, nomenclature, driveUrl,
                concept: analysis.concept, phase: analysis.phase,
                framework: analysis.framework, hookScore: analysis.hookScore,
                consciousnessLevel: analysis.consciousnessLevel,
                scriptEs: analysis.scriptEs, primaryAngle: analysis.primaryAngle,
                status: 'TESTING', isOwn,
            },
            update: { driveUrl },
        });
    } catch { /* tabla puede no existir aún */ }

    try { fs.unlinkSync(cleanPath); } catch {}

    return { success: true, nomenclature, driveUrl, analysis };
}

async function analyzeWithGemini(script: string, language: string, adCopy?: string): Promise<AnalysisResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Eres experto en publicidad de ecommerce y marketing de respuesta directa.
Analiza este script publicitario. Devuelve SOLO JSON válido sin markdown.

SCRIPT (${language}): ${script}
${adCopy ? `COPY META: ${adCopy}` : ''}

JSON:
{
  "concept": "C1|C2|C3|C4|C5|C6|C7|C8|C9",
  "phase": "FRIO|TEMPLADO|CALIENTE|RETARGETING",
  "framework": "UGC|VSL|BROLL|TESTIMONIAL|EDUCATIVO|DEMOSTRACION",
  "hookScore": 0-100,
  "consciousnessLevel": 1-5,
  "scriptEs": "script completo en español",
  "metaCopy": {"headline":"","body":"","cta":""},
  "primaryAngle": "",
  "secondaryAngle": "",
  "primaryDesire": "",
  "secondaryDesire": "",
  "timestamps": [{"start":0,"end":3,"section":"HOOK","text":""}],
  "whyItWorks": "",
  "improvements": ["","",""],
  "variantsRecommended": ["V1a: cambiar hook","V1b: cambiar CTA"]
}
C1=PROBLEMA C2=ANTES_DESPUES C3=MECANISMO C4=PRUEBA_SOCIAL C5=OFERTA C6=OBJECION C7=RESULTADO C8=EDUCACION C9=AUTORIDAD`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(text);
    } catch {
        return {
            concept: 'C1' as ConceptKey, phase: 'FRIO' as Phase,
            framework: 'UGC', hookScore: 50, consciousnessLevel: 2,
            scriptEs: script, metaCopy: { headline: '', body: '', cta: '' },
            primaryAngle: '', secondaryAngle: '', primaryDesire: '', secondaryDesire: '',
            timestamps: [], whyItWorks: '', improvements: [], variantsRecommended: []
        };
    }
}

async function getNextVersion(productId: string, concept: string, isOwn: boolean): Promise<string> {
    try {
        const count = await (prisma as any).competitorVideo.count({
            where: { productId, concept, isOwn }
        });
        return `V${count + 1}`;
    } catch { return 'V1'; }
}

async function createAnalysisDoc(
    drive: any, folderId: string, nomenclature: string,
    analysis: AnalysisResult, adCopy: string | undefined,
    competitorName: string | undefined, driveUrl: string, isOwn: boolean
): Promise<void> {
    const CONCEPTS: Record<string, string> = {
        C1:'PROBLEMA',C2:'ANTES_DESPUES',C3:'MECANISMO',C4:'PRUEBA_SOCIAL',
        C5:'OFERTA',C6:'OBJECION',C7:'RESULTADO',C8:'EDUCACION',C9:'AUTORIDAD'
    };

    const doc = `NOMBRE: ${nomenclature}
ESTADO: TESTING
ORIGEN: ${isOwn ? 'PROPIO' : `COMPETENCIA${competitorName ? ` — ${competitorName}` : ''}`}
LINK: ${driveUrl}

━━━ CLASIFICACIÓN ━━━
CONCEPTO: ${analysis.concept} — ${CONCEPTS[analysis.concept]}
FASE: ${analysis.phase} | FRAMEWORK: ${analysis.framework}
NIVEL CONSCIENCIA: ${analysis.consciousnessLevel}/5 | HOOK SCORE: ${analysis.hookScore}/100

━━━ ÁNGULOS Y DESEOS ━━━
Ángulo principal: ${analysis.primaryAngle}
Ángulo secundario: ${analysis.secondaryAngle}
Deseo primario: ${analysis.primaryDesire}
Deseo secundario: ${analysis.secondaryDesire}

━━━ TIMESTAMPS ━━━
${analysis.timestamps.map(t => `${t.start}s-${t.end}s | ${t.section}: ${t.text}`).join('\n')}

━━━ SCRIPT EN ESPAÑOL ━━━
${analysis.scriptEs}

━━━ COPY META ━━━
Headline: ${analysis.metaCopy.headline}
Body: ${analysis.metaCopy.body}
CTA: ${analysis.metaCopy.cta}
${adCopy ? `\nCopy original: ${adCopy}` : ''}

━━━ ANÁLISIS ━━━
Por qué funciona: ${analysis.whyItWorks}
Mejoras: ${analysis.improvements.map((i,n)=>`${n+1}. ${i}`).join(' | ')}
Variantes: ${analysis.variantsRecommended.join(' | ')}

━━━ MÉTRICAS META ━━━
CTR:— CPM:— ROAS:— Gasto:— Impresiones:—`;

    await drive.files.create({
        requestBody: {
            name: `${nomenclature}_DOC`,
            mimeType: 'application/vnd.google-apps.document',
            parents: [folderId],
        },
        media: { mimeType: 'text/plain', body: doc },
        fields: 'id',
        supportsAllDrives: true,
    });
}
