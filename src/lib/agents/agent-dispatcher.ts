import { getAgentConfig, AgentRole, selectAgentForTask, getAgentProvider } from './agent-registry';
import { API_CONFIG } from '../config/api-config';
import { GoogleAuth } from 'google-auth-library';
import { ReplicateProvider } from '../ai/providers/replicate';

export interface AgentRequest {
    role?: AgentRole;
    taskDescription?: string;
    prompt: string;
    context?: string;
    temperature?: number;
    maxTokens?: number;
    jsonSchema?: boolean;
    images?: string[];
    video?: string;
    videoMimeType?: string;
    model?: string;
    locale?: string;
    storeId?: string;
}

export interface AgentResponse {
    role: AgentRole;
    provider: string;
    model: string;
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost?: number;
}

export class AgentDispatcher {
    private googleAuth: GoogleAuth;
    private replicateProvider: ReplicateProvider;

    constructor() {
        try {
            const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            if (credentialsStr) {
                const credentials = JSON.parse(credentialsStr);
                this.googleAuth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
                    credentials
                });
            } else {
                this.googleAuth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
            }
        } catch (e: any) {
            console.error("[AgentDispatcher] GoogleAuth Init Error:", e.message);
            this.googleAuth = new GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
        }

        this.replicateProvider = new ReplicateProvider();
    }

    private getCulturalDirectives(locale?: string): string {
        const country = (locale || 'ES').toUpperCase();

        const directives: Record<string, string> = {
            'ES': "IDOMA: Español de ESPAÑA (ES-ES). Directrices: Usa 'vosotros', tuteo profesional, léxico peninsular (ej. 'ordenador', 'móvil', 'zapatillas'). Tono: Directo y experto.",
            'MX': "IDIOMA: Español de MÉXICO (ES-MX). Directrices: Usa 'ustedes', léxico mexicano (ej. 'computadora', 'celular', 'tenis'). Tono: Cálido y atento.",
            'CO': "IDIOMA: Español de COLOMBIA (ES-CO). Directrices: Usa 'ustedes', léxico colombiano. Tono: Muy formal y educado.",
            'AR': "IDIOMA: Español de ARGENTINA (ES-AR). Directrices: Usa 'ustedes' (aunque puedes usar vos si es B2C), léxico rioplatense (ej. 'computadora', 'celu'). Tono: Apasionado y directo.",
            'US': "LANGUAGE: American English (en-US). Tone: Direct, punchy, benefit-driven.",
            'UK': "LANGUAGE: British English (en-GB). Tone: Professional, slightly formal, reliable."
        };

        return directives[country] || directives['ES'];
    }

    async dispatch(request: AgentRequest): Promise<AgentResponse> {
        const role = request.role || selectAgentForTask(request.taskDescription || request.prompt);
        const agentConfig = getAgentConfig(role);
        const provider = getAgentProvider(role);

        const modelToUse = request.model || agentConfig.model;
        const finalConfig = { ...agentConfig, model: modelToUse };

        console.log(`[AgentDispatcher] Task → Agent: ${role}`);
        console.log(`[AgentDispatcher] Provider: ${provider}`);
        console.log(`[AgentDispatcher] Model: ${modelToUse}`);

        switch (provider) {
            case 'replicate-claude':
                return this.dispatchToReplicate(role, finalConfig, request);

            case 'gemini-pro':
            case 'gemini-flash':
                return this.dispatchToGemini(role, finalConfig, request);

            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    private async dispatchToReplicate(
        role: AgentRole,
        config: any,
        request: AgentRequest
    ): Promise<AgentResponse> {

        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error('REPLICATE_API_TOKEN not configured');
        }

        const culturalDirectives = this.getCulturalDirectives(request.locale);
        const prompt = request.context
            ? `LOCALIZACIÓN: ${culturalDirectives}\n\nCONTEXTO:\n${request.context}\n\nTAREA:\n${request.prompt}${request.jsonSchema ? '\n\nIMPORTANTE: Responde ÚNICAMENTE en formato JSON válido según el esquema solicitado.' : ''}`
            : `LOCALIZACIÓN: ${culturalDirectives}\n\nTAREA:\n${request.prompt}`;

        const result = await this.replicateProvider.invokeText({
            model: config.model,
            prompt,
            systemPrompt: config.systemPrompt,
            temperature: request.temperature ?? config.temperature,
            maxTokens: request.maxTokens || config.maxTokens,
        });

        return {
            role,
            provider: 'replicate-claude',
            model: config.model,
            text: result.text,
            usage: {
                promptTokens: result.usage?.inputTokens || 0,
                completionTokens: result.usage?.outputTokens || 0,
                totalTokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0)
            },
            cost: result.usage?.costEur || 0
        };
    }

    /**
     * Despachar a Gemini
     * Canal 1: Vertex AI via Service Account (v1beta1 — soporta todos los modelos 2026)
     * Canal 2: Gemini AI Studio via API Key (fallback automático)
     */
    private async dispatchToGemini(
        role: AgentRole,
        config: any,
        request: AgentRequest
    ): Promise<AgentResponse> {

        // Preparar prompt y partes reutilizables para ambos canales
        const culturalDirectives = this.getCulturalDirectives(request.locale);
        const fullPrompt = `LOCALIZACIÓN: ${culturalDirectives}\n\n${config.systemPrompt || ''}\n\n${request.context ? `CONTEXTO:\n${request.context}\n\n` : ''}TAREA:\n${request.prompt}`;

        const parts: any[] = [{ text: fullPrompt }];

        if (request.images && request.images.length > 0) {
            for (const imgUrl of request.images) {
                try {
                    if (imgUrl.startsWith('data:')) {
                        parts.push({ inlineData: { mimeType: imgUrl.split(';')[0].split(':')[1], data: imgUrl.split(',')[1] } });
                    } else if (imgUrl.startsWith('http')) {
                        const imgRes = await fetch(imgUrl);
                        const buffer = await imgRes.arrayBuffer();
                        parts.push({ inlineData: { mimeType: imgRes.headers.get('content-type') || 'image/jpeg', data: Buffer.from(buffer).toString('base64') } });
                    }
                } catch (imgError) {
                    console.error("[AgentDispatcher] Failed to process image:", imgUrl, imgError);
                }
            }
        }

        if (request.video) {
            parts.push({ inlineData: { mimeType: request.videoMimeType || "video/mp4", data: request.video.split(',').pop() } });
        }

        const bodyPayload = {
            contents: [{ role: 'user', parts }],
            generationConfig: {
                temperature: request.temperature ?? config.temperature,
                maxOutputTokens: request.maxTokens || config.maxTokens,
                responseMimeType: request.jsonSchema ? "application/json" : "text/plain"
            }
        };

        const modelName = config.model.replace(/^models\//, '');

        // ── Canal 1: Vertex AI (Service Account) ─────────────────────────────
        // Usa v1beta1 que soporta los modelos Gemini 2026 (gemini-3.1-pro-preview, etc.)
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            try {
                const client = await this.googleAuth.getClient();
                const token = await client.getAccessToken();
                if (!token.token) throw new Error("Failed to get access token");

                const { projectId, location } = API_CONFIG.vertexAI;
                // v1beta1 es necesario para modelos preview y modelos 2026
                const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;
                console.log(`[Gemini] Vertex AI (v1beta1) → ${modelName} @ ${location}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minuto timeout

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bodyPayload),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    // Si el modelo no está en esta región, caemos a AI Studio
                    if (response.status === 404) {
                        const errBody = await response.text();
                        console.warn(`[Gemini] Vertex 404 para ${modelName} en ${location}, usando AI Studio. ${errBody.slice(0, 200)}`);
                        // fallthrough a Canal 2
                    } else {
                        return await this.processGeminiResponse(response, role, config);
                    }
                } catch (e: any) {
                    clearTimeout(timeoutId);
                    if (e.name === 'AbortError') throw new Error("Gemini Vertex AI timeout (60s)");
                    throw e;
                }

            } catch (e: any) {
                console.warn("[AgentDispatcher] Vertex AI error, usando AI Studio como fallback:", e.message);
                // fallthrough a Canal 2
            }
        }

        // ── Canal 2: AI Studio / Gemini API (API Key) ─────────────────────────
        const apiKey = process.env.GEMINI_API_KEY
            || (process.env.VERTEX_AI_API_KEY?.startsWith('AIza') ? process.env.VERTEX_AI_API_KEY : undefined);

        if (apiKey) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            console.log(`[Gemini] AI Studio (v1beta) → ${modelName}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); 

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                return this.processGeminiResponse(response, role, config);
            } catch (e: any) {
                clearTimeout(timeoutId);
                if (e.name === 'AbortError') throw new Error("Gemini AI Studio timeout (60s)");
                throw e;
            }
        }

        throw new Error("No Gemini credentials. Añade GEMINI_API_KEY en .env.local (obtén una en aistudio.google.com/apikey)");
    }

    private async processGeminiResponse(response: Response, role: AgentRole, config: any): Promise<AgentResponse> {
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[AgentDispatcher] Gemini API Error (${response.status}):`, errorBody);

            try {
                const jsonError = JSON.parse(errorBody);
                const message = jsonError.error?.message || jsonError[0]?.error?.message || errorBody;
                throw new Error(`Gemini API error (${response.status}): ${message}`);
            } catch (e) {
                throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
            }
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const usage = data.usageMetadata || {};
        const isPro = config.model.includes('pro');
        const costPerMillion = isPro ? 1.25 : 0.075;
        const cost = (usage.promptTokenCount || 0) / 1000000 * costPerMillion;

        return {
            role,
            provider: config.provider,
            model: config.model,
            text,
            usage: {
                promptTokens: usage.promptTokenCount || 0,
                completionTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0
            },
            cost
        };
    }

    async dispatchTo(role: AgentRole, prompt: string, context?: string): Promise<AgentResponse> {
        return this.dispatch({ role, prompt, context });
    }

    async dispatchAuto(taskDescription: string, prompt: string, context?: string): Promise<AgentResponse> {
        return this.dispatch({ taskDescription, prompt, context });
    }
}

// Singleton
export const agentDispatcher = new AgentDispatcher();
