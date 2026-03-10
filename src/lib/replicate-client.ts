/**
 * Replicate client — EcomBoom
 * Token: REPLICATE_API_TOKEN
 *
 * REGLA DE USO POR MÓDULO:
 * - Copywriting / Scripts / Landing / Avatar voice → Claude (anthropic/claude-opus-4-6)
 * - Vídeo ads generativo → kwaivgi/kling-v3-video o kling-v3-omni-video
 * - Avatar parlante → heygen/avatar-iv + sync/lipsync-2-pro
 * - Imágenes statics → black-forest-labs/flux-2-pro
 * - Edición imagen con referencia → black-forest-labs/flux-kontext-pro
 * - SVG / vectoriales → recraft-ai/recraft-v4-pro-svg
 * - Upscale imagen → recraft-ai/recraft-crisp-upscale
 * - Upscale vídeo → topazlabs/video-upscale
 * - Subtítulos → fictions-ai/autocaption
 * - Transcripción → vaibhavs10/incredibly-fast-whisper
 * - Remove background → lucataco/remove-bg
 * - UGC sintético → bytedance/omni-human-1-5
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!;
const BASE_URL = 'https://api.replicate.com/v1';

// ─── Core ──────────────────────────────────────────────────────────────────────

export async function replicateRequest(path: string, body?: any, method = 'POST') {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait', // Espera hasta 60s antes de retornar — evita polling en tasks cortas
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Replicate ${res.status}: ${err}`);
    }
    return res.json();
}

/**
 * Polling para predicciones largas (vídeo, avatar)
 */
export async function pollPrediction(predictionId: string, maxWaitMs = 300_000): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        const pred = await replicateRequest(`/predictions/${predictionId}`, undefined, 'GET');
        if (pred.status === 'succeeded') return pred.output;
        if (pred.status === 'failed') throw new Error(`Prediction failed: ${pred.error}`);
        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('Prediction timeout');
}

// ─── COPYWRITING — Claude via Replicate ───────────────────────────────────────

export async function generateCopy(params: {
    task: 'landing' | 'script_avatar' | 'script_ugc' | 'hook' | 'headline' | 'email' | 'whatsapp';
    productTitle: string;
    productDescription: string;
    targetAudience?: string;
    angle?: string;
    tone?: 'agresivo' | 'emocional' | 'educativo' | 'urgencia' | 'social_proof';
    language?: 'es' | 'en' | 'mx';
    extraContext?: string;
}): Promise<string> {

    const systemPrompts: Record<string, string> = {
        landing: `Eres un experto en copywriting de respuesta directa para ecommerce. 
Sigues los frameworks de Hormozi, Schwartz y Spencer Pawling. 
Escribes copy que convierte. Cada sección tiene un trabajo específico: atraer, convencer, eliminar objeciones, cerrar.
Devuelve el copy completo estructurado en secciones: HERO, PROBLEMA, MECANISMO, PRUEBA, OFERTA, GARANTIA, FAQ, CTA.`,

        script_avatar: `Eres un director creativo experto en UGC y scripts de avatar para anuncios de Facebook e Instagram.
Escribes scripts que detienen el scroll en los primeros 3 segundos. 
Cada línea es natural, conversacional, como si lo dijera una persona real.
Estructura: HOOK (0-3s) | PROBLEMA (3-10s) | SOLUCIÓN (10-25s) | PRUEBA (25-35s) | CTA (35-45s).`,

        script_ugc: `Eres un experto en contenido UGC auténtico para ecommerce. 
Escribes como habla la gente real, no como un anuncio. Sin tecnicismos. 
Con emociones reales, dudas reales, resultados reales.`,

        hook: `Eres un especialista en hooks para anuncios de social media. 
Generas hooks que paran el scroll en 0-3 segundos. 
Devuelve 10 hooks variados: pregunta, shock, beneficio, curiosidad, problema, número, comparación, historia, controversia, promesa.`,

        headline: `Eres un copywriter de titulares de alta conversión. Usas fórmulas probadas: 
Número + Beneficio, Cómo + Resultado, El secreto de, Por qué, Sin + Objeción.
Devuelve 10 titulares.`,

        email: `Eres un experto en email marketing de ecommerce. Escribes emails que abren y convierten.
Estructura: Asunto + Preview text + Cuerpo + CTA. Tono personal y directo.`,

        whatsapp: `Eres un experto en mensajes de WhatsApp para ecommerce. 
Mensajes cortos, conversacionales, con emojis estratégicos. Máximo 3 párrafos.`,
    };

    const userPrompt = `Producto: ${params.productTitle}
Descripción: ${params.productDescription}
${params.targetAudience ? `Audiencia: ${params.targetAudience}` : ''}
${params.angle ? `Ángulo: ${params.angle}` : ''}
${params.tone ? `Tono: ${params.tone}` : ''}
${params.language === 'mx' ? 'Idioma: Español México (expresiones locales)' : params.language === 'en' ? 'Language: English' : 'Idioma: Español neutro'}
${params.extraContext || ''}

Genera el ${params.task === 'landing' ? 'copy completo de landing page' :
           params.task === 'script_avatar' ? 'script para avatar de 45 segundos' :
           params.task === 'script_ugc' ? 'script UGC auténtico de 30-60 segundos' :
           params.task === 'hook' ? '10 hooks para anuncios' :
           params.task === 'headline' ? '10 titulares de alta conversión' :
           params.task === 'email' ? 'email de venta completo' : 'mensaje de WhatsApp'}.`;

    const pred = await replicateRequest('/models/anthropic/claude-opus-4-6/predictions', {
        input: {
            system: systemPrompts[params.task],
            prompt: userPrompt,
            max_tokens: params.task === 'landing' ? 4000 : 2000,
            temperature: 0.7,
        }
    });

    if (pred.status === 'succeeded') {
        return Array.isArray(pred.output) ? pred.output.join('') : pred.output;
    }

    const output = await pollPrediction(pred.id);
    return Array.isArray(output) ? output.join('') : output;
}

// ─── VÍDEO ────────────────────────────────────────────────────────────────────

export async function generateVideo(params: {
    prompt: string;
    mode: 'text2video' | 'image2video' | 'omni'; // omni = con audio nativo
    imageUrl?: string; // para image2video
    duration?: 5 | 10;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    quality?: 'standard' | 'pro';
}): Promise<string> { // retorna URL del vídeo

    const model = params.mode === 'omni' ? 'kwaivgi/kling-v3-omni-video' :
                  params.mode === 'image2video' ? 'kwaivgi/kling-o1' :
                  params.quality === 'pro' ? 'kwaivgi/kling-v3-video' : 'kwaivgi/kling-v3-video';

    const input: any = {
        prompt: params.prompt,
        duration: params.duration || 5,
        aspect_ratio: params.aspectRatio || '9:16',
    };

    if (params.imageUrl) input.image = params.imageUrl;

    const pred = await replicateRequest(`/models/${model}/predictions`, { input });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 300_000);
    return typeof output === 'string' ? output : output?.[0] || output?.video;
}

// ─── IMAGEN ───────────────────────────────────────────────────────────────────

export async function generateImage(params: {
    prompt: string;
    mode: 'generate' | 'edit' | 'svg';
    referenceImageUrl?: string; // para edit (flux-kontext)
    aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
}): Promise<string> {

    const model = params.mode === 'svg' ? 'recraft-ai/recraft-v4-pro-svg' :
                  params.mode === 'edit' && params.referenceImageUrl ? 'black-forest-labs/flux-kontext-pro' :
                  'black-forest-labs/flux-2-pro';

    const input: any = { prompt: params.prompt };
    if (params.aspectRatio) input.aspect_ratio = params.aspectRatio;
    if (params.referenceImageUrl) input.input_image = params.referenceImageUrl;

    const pred = await replicateRequest(`/models/${model}/predictions`, { input });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 120_000);
    return typeof output === 'string' ? output : output?.[0];
}

// ─── AVATAR + LIPSYNC ─────────────────────────────────────────────────────────

export async function generateAvatarVideo(params: {
    avatarImageUrl: string;
    audioUrl: string; // ElevenLabs output
    script?: string;
}): Promise<string> {

    // Lipsync: sync avatar image con audio
    const pred = await replicateRequest('/models/sync/lipsync-2-pro/predictions', {
        input: {
            video: params.avatarImageUrl, // puede ser imagen o vídeo corto
            audio: params.audioUrl,
            sync_mode: 'bounce',
            output_format: 'mp4',
        }
    });

    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 180_000);
    return typeof output === 'string' ? output : output?.video;
}

// ─── TRANSCRIPCIÓN ────────────────────────────────────────────────────────────

export async function transcribeAudio(audioUrl: string, language = 'es'): Promise<{
    text: string;
    segments: { start: number; end: number; text: string }[];
}> {
    const pred = await replicateRequest('/models/vaibhavs10/incredibly-fast-whisper/predictions', {
        input: {
            audio: audioUrl,
            language,
            task: 'transcribe',
            timestamp: 'word',
            batch_size: 64,
        }
    });

    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 120_000);
    return {
        text: output?.text || '',
        segments: output?.chunks || [],
    };
}

// ─── SUBTÍTULOS ───────────────────────────────────────────────────────────────

export async function addSubtitles(videoUrl: string, params?: {
    font?: string;
    fontSize?: number;
    color?: string;
    position?: 'bottom' | 'center' | 'top';
}): Promise<string> {
    const pred = await replicateRequest('/models/fictions-ai/autocaption/predictions', {
        input: {
            video_file_input: videoUrl,
            font: params?.font || 'Montserrat',
            font_size: params?.fontSize || 7,
            color: params?.color || 'white',
            stroke_color: 'black',
            stroke_width: 2.5,
            position: params?.position || 'bottom',
            MaxChars: 20,
            output_video: true,
        }
    });

    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 180_000);
    return typeof output === 'string' ? output : output?.video_file;
}

// ─── REMOVE BACKGROUND ────────────────────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<string> {
    const pred = await replicateRequest('/models/lucataco/remove-bg/predictions', {
        input: { image: imageUrl }
    });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 60_000);
    return typeof output === 'string' ? output : output?.[0];
}

// ─── UPSCALE ──────────────────────────────────────────────────────────────────

export async function upscaleImage(imageUrl: string, scale: 2 | 4 = 4): Promise<string> {
    const pred = await replicateRequest('/models/recraft-ai/recraft-crisp-upscale/predictions', {
        input: { image: imageUrl, scale }
    });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 120_000);
    return typeof output === 'string' ? output : output?.[0];
}

export async function upscaleVideo(videoUrl: string): Promise<string> {
    const pred = await replicateRequest('/models/topazlabs/video-upscale/predictions', {
        input: {
            video: videoUrl,
            output_quality: 'high',
        }
    });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 300_000);
    return typeof output === 'string' ? output : output?.video;
}

// ─── UGC SINTÉTICO ────────────────────────────────────────────────────────────

export async function generateUGCHuman(params: {
    referenceImageUrl: string;
    prompt: string;
    audioUrl?: string;
}): Promise<string> {
    const pred = await replicateRequest('/models/bytedance/omni-human-1-5/predictions', {
        input: {
            ref_image: params.referenceImageUrl,
            prompt: params.prompt,
            ...(params.audioUrl ? { audio: params.audioUrl } : {}),
        }
    });
    const output = pred.status === 'succeeded' ? pred.output : await pollPrediction(pred.id, 300_000);
    return typeof output === 'string' ? output : output?.video;
}
