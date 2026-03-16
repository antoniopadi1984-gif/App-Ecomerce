import { NextRequest, NextResponse } from "next/server";
import { AiRouter } from "@/lib/ai/router";
import { TaskType } from "@/lib/ai/providers/interfaces";
import { ElevenLabsService } from "@/lib/services/elevenlabs-service";
import { prisma } from "@/lib/prisma";
import { uploadToProduct } from "@/lib/services/drive-service";

export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * POST /api/content/generate
 * Genera contenido digital completo: audiolibro, mini curso, ebook, email sequence, video curso
 * Body: {
 *   productId, storeId,
 *   type: "audiobook" | "audio_course" | "ebook" | "email_sequence" | "video_course",
 *   topic, targetAudience, tone, language,
 *   chapters?, voiceId?, includeMusic?
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const storeId = req.headers.get("X-Store-Id") || "store-main";
        const {
            productId, type = "audiobook",
            topic, targetAudience = "compradores del producto",
            tone = "inspirador y práctico",
            language = "es",
            chapters = 5,
            voiceId,
            includeMusic = true,
        } = await req.json();

        if (!productId || !topic) {
            return NextResponse.json({ error: "productId y topic requeridos" }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { title: true, description: true, price: true }
        });
        if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

        const router = new AiRouter();

        // ── PASO 1: Generar estructura y contenido con Gemini 2.5 Pro ──────
        const structurePrompt = buildStructurePrompt(type, topic, product.title, targetAudience, tone, language, chapters);

        const structureResult = await router.route({
            taskType: TaskType.COPY_LONGFORM,
            prompt: structurePrompt,
            model: process.env.GEMINI_MODEL_PRODUCTION || "gemini-2.5-pro",
        });

        let structure: any;
        try {
            const clean = structureResult.text.replace(/```json|```/g, "").trim();
            structure = JSON.parse(clean);
        } catch {
            return NextResponse.json({ error: "Error generando estructura", raw: structureResult.text.slice(0, 500) }, { status: 500 });
        }

        // ── PASO 2: Generar audio con ElevenLabs eleven_v3 ─────────────────
        const audioResults: any[] = [];

        if (type === "audiobook" || type === "audio_course") {
            const voice = voiceId || process.env.ELEVENLABS_VOICE_FEMALE || "EXAVITQu4vr4xnSDxMaL";
            const items = structure.chapters || structure.lessons || [];

            for (let i = 0; i < Math.min(items.length, chapters); i++) {
                const item = items[i];
                const textToSpeak = `${item.title}.

${item.content}`;

                try {
                    // ElevenLabs eleven_v3 con emotion tags
                    const audioBuffer = await ElevenLabsService.textToSpeech(
                        textToSpeak.slice(0, 5000), // max 5000 chars por chunk
                        voice,
                        { stability: 0.5, similarity_boost: 0.75, model_id: "eleven_v3" }
                    );

                    // Subir a Drive
                    const fileName = `${type}_${i + 1}_${item.title?.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.mp3`;
                    const driveResult = await uploadToProduct(
                        audioBuffer,
                        fileName,
                        "audio/mpeg",
                        productId,
                        storeId,
                        { subfolderName: `07_BIBLIOTECA/${type.toUpperCase()}`, fileType: "AUDIO" }
                    );

                    audioResults.push({
                        index: i + 1,
                        title: item.title,
                        duration_estimate: Math.round(textToSpeak.length / 15) + "s",
                        driveUrl: driveResult.driveUrl,
                        driveFileId: driveResult.driveFileId,
                        fileName,
                    });
                } catch (audioErr: any) {
                    audioResults.push({ index: i + 1, title: item.title, error: audioErr.message });
                }
            }
        }

        // ── PASO 3: Música de fondo opcional ──────────────────────────────
        let musicUrl: string | null = null;
        if (includeMusic && (type === "audiobook" || type === "audio_course")) {
            try {
                const musicBuffer = await ElevenLabsService.generateMusic(
                    `${tone} background music for ${type}, no lyrics, calm and inspiring, suitable for learning`,
                    60
                );
                const musicDrive = await uploadToProduct(
                    Buffer.from(musicBuffer),
                    `music_background_${Date.now()}.mp3`,
                    "audio/mpeg",
                    productId,
                    storeId,
                    { subfolderName: `07_BIBLIOTECA/${type.toUpperCase()}/MUSIC`, fileType: "AUDIO" }
                );
                musicUrl = musicDrive.driveUrl;
            } catch {}
        }

        // ── PASO 4: Guardar en BD como ContentAsset ────────────────────────
        const savedAsset = await (prisma as any).contentAsset.create({
            data: {
                storeId,
                productId,
                name: structure.title || topic,
                type: type.toUpperCase(),
                fileUrl: audioResults[0]?.driveUrl || "",
                metadataJson: JSON.stringify({
                    type, topic, language, chapters: audioResults.length,
                    structure, audioResults, musicUrl,
                    generatedAt: new Date().toISOString(),
                })
            }
        });

        return NextResponse.json({
            success: true,
            assetId: savedAsset.id,
            type,
            title: structure.title,
            language,
            chapters_generated: audioResults.length,
            audio_files: audioResults,
            music_url: musicUrl,
            structure: {
                title: structure.title,
                description: structure.description,
                items: (structure.chapters || structure.lessons || structure.emails || []).map((item: any) => ({
                    title: item.title,
                    summary: item.summary || item.content?.slice(0, 150) + "...",
                }))
            },
            message: `${type} generado: ${audioResults.filter(a => !a.error).length} archivos de audio en Drive`,
        });

    } catch (e: any) {
        console.error("[content/generate]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── PROMPTS POR TIPO ──────────────────────────────────────────────────────

function buildStructurePrompt(type: string, topic: string, productName: string, audience: string, tone: string, language: string, chapters: number): string {
    const lang = language === "es" ? "español" : language;

    const base = `Eres un autor bestseller y experto en marketing de contenidos.
Producto: "${productName}"
Tema: "${topic}"
Audiencia: "${audience}"
Tono: "${tone}"
Idioma: ${lang}
Número de ${type === "email_sequence" ? "emails" : "capítulos/lecciones"}: ${chapters}

Devuelve SOLO JSON válido sin markdown.`;

    if (type === "audiobook") return base + `
{
  "title": "Título del audiolibro",
  "subtitle": "Subtítulo",
  "description": "Descripción de 2-3 frases",
  "target_duration_minutes": ${chapters * 8},
  "chapters": [
    {
      "number": 1,
      "title": "Título del capítulo",
      "summary": "Resumen en 1 frase",
      "content": "Contenido completo del capítulo para narrar. Mínimo 600 palabras. Incluye [excited], [whispers], [confident] como emotion tags de ElevenLabs donde corresponda. Escribe como si lo estuvieras narrando en voz alta.",
      "key_takeaway": "La lección principal",
      "transition": "Frase de transición al siguiente capítulo"
    }
  ],
  "outro": "Cierre final del audiolibro con llamada a la acción hacia el producto"
}`;

    if (type === "audio_course") return base + `
{
  "title": "Nombre del mini curso",
  "tagline": "Promesa principal en 1 línea",
  "description": "Descripción del curso",
  "lessons": [
    {
      "number": 1,
      "title": "Lección 1: Título",
      "duration_estimate": "5-7 min",
      "summary": "Qué aprende en esta lección",
      "content": "Guión completo de la lección para narrar con ElevenLabs. Incluye emotion tags: [excited], [confident], [whispers]. Mínimo 400 palabras. Estilo conversacional y directo.",
      "exercise": "Ejercicio práctico para el alumno",
      "key_point": "El punto más importante"
    }
  ],
  "bonus": "Contenido bonus que se entrega con el curso"
}`;

    if (type === "email_sequence") return base + `
{
  "title": "Nombre de la secuencia",
  "goal": "Objetivo de la secuencia (vender, fidelizar, upsell)",
  "emails": [
    {
      "number": 1,
      "day": 0,
      "subject": "Asunto del email",
      "preview_text": "Texto de preview (50 chars)",
      "content_es": "Contenido completo del email en español. Usa storytelling. Incluye CTA claro.",
      "content_en": "Full email content in English",
      "cta": "Llamada a la acción específica",
      "objective": "Qué debe conseguir este email"
    }
  ]
}`;

    if (type === "video_course") return base + `
{
  "title": "Nombre del video curso",
  "description": "Descripción",
  "lessons": [
    {
      "number": 1,
      "title": "Lección 1",
      "duration_estimate": "3-5 min",
      "slide_texts": ["Slide 1 texto", "Slide 2 texto", "Slide 3 texto"],
      "narration": "Guión completo para narrar mientras se ven las slides. Mínimo 300 palabras.",
      "visual_prompt": "English prompt for Flux to generate background image for this lesson",
      "key_point": "Punto clave"
    }
  ]
}`;

    // ebook default
    return base + `
{
  "title": "Título del ebook",
  "subtitle": "Subtítulo",
  "description": "Descripción",
  "chapters": [
    {
      "number": 1,
      "title": "Capítulo 1",
      "content": "Contenido completo del capítulo. Mínimo 500 palabras. Incluye ejemplos prácticos, bullet points y datos concretos.",
      "key_points": ["Punto 1", "Punto 2", "Punto 3"],
      "call_to_action": "Acción que debe tomar el lector al final del capítulo"
    }
  ],
  "conclusion": "Conclusión y próximos pasos",
  "bonus_resource": "Recurso extra que se incluye"
}`;
}
