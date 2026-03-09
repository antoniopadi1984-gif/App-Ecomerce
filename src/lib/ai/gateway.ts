/**
 * AI Gateway — Punto de entrada único para todas las operaciones de IA.
 *
 * Regla de oro: ningún código llama a Anthropic directo.
 * Todo pasa por REPLICATE_API_TOKEN → ReplicateProvider.
 *
 * Uso:
 *   import { aiGateway } from '@/lib/ai/gateway';
 *   const result = await aiGateway.runText({ taskType: 'COPY', prompt: '...' });
 */

import { ReplicateProvider } from "./providers/replicate";
import { GeminiProvider } from "./providers/gemini";
import { REPLICATE_MODELS, DEFAULT_MODELS, Modality } from "./replicate-models";
import { TaskType, AIResponse } from "./providers/interfaces";

// ─── Types ───────────────────────────────────────────────────

export interface RunTextOptions {
    taskType?: string;
    prompt: string;
    systemPrompt?: string;
    locale?: string;
    modelHint?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface RunImageOptions {
    taskType?: string;
    prompt: string;
    modelHint?: string;
    width?: number;
    height?: number;
}

export interface RunVideoOptions {
    taskType?: string;
    prompt: string;
    assets?: string[];
    modelHint?: string;
}

export interface ClassifyResult {
    modality: Modality;
    modelHint: string;
    safety: "safe" | "review" | "block";
}

export interface GatewayResponse {
    text: string;
    provider: "REPLICATE" | "GEMINI";
    model: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        costEur: number;
    };
    raw?: any;
}

// ─── Keywords para clasificación ─────────────────────────────

const TEXT_KEYWORDS = [
    "copy", "cro", "guion", "guión", "anuncio", "advertorial", "listicle",
    "hooks", "headline", "script", "landing", "email", "sms", "whatsapp",
    "oferta", "producto", "descripción", "analiza", "resume", "traduce",
    "responde", "investiga", "explica",
];

const IMAGE_KEYWORDS = [
    "imagen", "banner", "estático", "foto", "visual", "diseño",
    "crear imagen", "generar imagen", "static", "creative",
];

const VIDEO_KEYWORDS = [
    "vídeo", "video", "clip", "edición", "lipsync", "talking head",
    "animación", "motion",
];

// ─── Gateway Class ───────────────────────────────────────────

class AIGateway {
    private replicate: ReplicateProvider;
    private gemini: GeminiProvider;

    constructor() {
        this.replicate = new ReplicateProvider();
        this.gemini = new GeminiProvider();
    }

    /**
     * Clasifica la intención del usuario para seleccionar modalidad y modelo.
     */
    classifyTask(input: string): ClassifyResult {
        const lower = input.toLowerCase();

        // Video check first (more specific)
        if (VIDEO_KEYWORDS.some((kw) => lower.includes(kw))) {
            return { modality: "VIDEO", modelHint: DEFAULT_MODELS.VIDEO, safety: "safe" };
        }

        // Image check
        if (IMAGE_KEYWORDS.some((kw) => lower.includes(kw))) {
            return { modality: "IMAGE", modelHint: DEFAULT_MODELS.IMAGE, safety: "safe" };
        }

        // Default: text
        return { modality: "TEXT", modelHint: DEFAULT_MODELS.TEXT, safety: "safe" };
    }

    /**
     * Ejecutar tarea de texto (copywriting, análisis, scripts, etc.)
     * Usa Claude via Replicate por defecto.
     */
    async runText(options: RunTextOptions): Promise<GatewayResponse> {
        const model = options.modelHint || DEFAULT_MODELS.TEXT;
        const isGeminiModel = model.startsWith("gemini") || model.startsWith("imagegeneration") || model.startsWith("veo") || model.startsWith("lyria");

        console.log(`[AIGateway] runText → ${model} (${isGeminiModel ? 'GEMINI' : 'REPLICATE'})`);

        if (isGeminiModel) {
            const result = await this.gemini.invokeText({
                model,
                prompt: options.prompt,
                systemPrompt: options.systemPrompt,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
            });

            return {
                text: result.text,
                provider: "GEMINI",
                model,
                usage: result.usage,
                raw: result.raw,
            };
        }

        const result = await this.replicate.invokeText({
            model,
            prompt: options.prompt,
            systemPrompt: options.systemPrompt,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
        });

        return {
            text: result.text,
            provider: "REPLICATE",
            model,
            usage: result.usage,
            raw: result.raw,
        };
    }

    /**
     * Ejecutar tarea de generación de imagen.
     * Usa Flux via Replicate por defecto.
     */
    async runImage(options: RunImageOptions): Promise<GatewayResponse> {
        const model = options.modelHint || DEFAULT_MODELS.IMAGE;

        console.log(`[AIGateway] runImage → ${model}`);

        // Replicate image models use a different input schema
        // We delegate to the provider but wrap the response
        const result = await this.replicate.invokeText({
            model,
            prompt: options.prompt,
            maxTokens: 1,
        });

        return {
            text: result.text, // Usually a URL to the generated image
            provider: "REPLICATE",
            model,
            usage: result.usage,
            raw: result.raw,
        };
    }

    /**
     * Ejecutar tarea de generación de vídeo.
     * Usa Luma/MiniMax via Replicate, o Engine Python según pipeline.
     */
    async runVideo(options: RunVideoOptions): Promise<GatewayResponse> {
        const model = options.modelHint || DEFAULT_MODELS.VIDEO;

        console.log(`[AIGateway] runVideo → ${model}`);

        const result = await this.replicate.invokeText({
            model,
            prompt: options.prompt,
            maxTokens: 1,
        });

        return {
            text: result.text,
            provider: "REPLICATE",
            model,
            usage: result.usage,
            raw: result.raw,
        };
    }

    /**
     * Despacho automático: clasifica y ejecuta.
     */
    async auto(prompt: string, systemPrompt?: string): Promise<GatewayResponse> {
        const classification = this.classifyTask(prompt);

        switch (classification.modality) {
            case "IMAGE":
                return this.runImage({ prompt, modelHint: classification.modelHint });
            case "VIDEO":
                return this.runVideo({ prompt, modelHint: classification.modelHint });
            case "TEXT":
            default:
                return this.runText({ prompt, systemPrompt, modelHint: classification.modelHint });
        }
    }
}

// Singleton
export const aiGateway = new AIGateway();
