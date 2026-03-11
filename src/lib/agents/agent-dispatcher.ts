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
    jsonSchema?: boolean; // Habilitar modo JSON
    images?: string[];    // URLs o base64 de imágenes para visión
    video?: string;       // Base64
    videoMimeType?: string;
    model?: string;       // Overide model
    locale?: string;      // Código de país (ES, MX, etc.) para localización
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

    /**
     * Despachar a agente apropiado
     */
    async dispatch(request: AgentRequest): Promise<AgentResponse> {
        // Determinar agente
        const role = request.role || selectAgentForTask(request.taskDescription || request.prompt);
        const agentConfig = getAgentConfig(role);
        const provider = getAgentProvider(role);

        // Model override support
        const modelToUse = request.model || agentConfig.model;
        const finalConfig = { ...agentConfig, model: modelToUse };

        console.log(`[AgentDispatcher] Task → Agent: ${role}`);
        console.log(`[AgentDispatcher] Provider: ${provider}`);
        console.log(`[AgentDispatcher] Model: ${modelToUse}`);

        // Despachar según provider
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

    /**
     * Despachar a Claude via Replicate (sin llamada directa a Anthropic)
     */
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
     * Despachar a Gemini (AI Studio primary, Vertex AI fallback)
     */
    private async dispatchToGemini(
        role: AgentRole,
        config: any,
        request: AgentRequest
    ): Promise<AgentResponse> {

        const culturalDirectives = this.getCulturalDirectives(request.locale);
        const fullPrompt = `LOCALIZACIÓN: ${culturalDirectives}\n\n${config.systemPrompt || ''}\n\n${request.context ? `CONTEXTO:\n${request.context}\n\n` : ''}TAREA:\n${request.prompt}`;
        const parts: any[] = [{ text: fullPrompt }];

        // ── Imágenes ────────────────────────────────────────
        if (request.images?.length) {
            for (const imgUrl of request.images) {
                try {
                    if (imgUrl.startsWith('data:')) {
                        parts.push({ inlineData: { mimeType: imgUrl.split(';')[0].split(':')[1], data: imgUrl.split(',')[1] } });
                    } else if (imgUrl.startsWith('http')) {
                        const imgRes = await fetch(imgUrl);
                        const buffer = await imgRes.arrayBuffer();
                        parts.push({ inlineData: { mimeType: imgRes.headers.get('content-type') || 'image/jpeg', data: Buffer.from(buffer).toString('base64') } });
                    }
                } catch (imgErr) { console.error('[Gemini] Image error:', imgErr); }
            }
        }
        if (request.video) {
            parts.push({ inlineData: { mimeType: request.videoMimeType || 'video/mp4', data: request.video.split(',').pop() } });
        }

        const bodyPayload = {
            contents: [{ role: 'user', parts }],
            generationConfig: {
                temperature: request.temperature ?? config.temperature,
                maxOutputTokens: request.maxTokens || config.maxTokens,
                responseMimeType: request.jsonSchema ? 'application/json' : 'text/plain',
            }
        };

        // ── 1. AI Studio (GEMINI_API_KEY) — canal principal para gen-lang-client ──
        const aiStudioKey = process.env.GEMINI_API_KEY || process.env.VERTEX_AI_API_KEY;
        if (aiStudioKey) {
            // AI Studio acepta el nombre tal cual: gemini-3.1-pro-preview, gemini-2.0-flash, etc.
            const modelName = config.model.replace(/^models\//, '');
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${aiStudioKey}`;
            console.log(`[Gemini] AI Studio → ${modelName}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            return this.processGeminiResponse(response, role, config);
        }

        // ── 2. Vertex AI (Service Account) — fallback ──────────────────────────
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            try {
                const client = await this.googleAuth.getClient();
                const token = await client.getAccessToken();
                if (!token.token) throw new Error('Failed to get Vertex token');

                // Vertex AI requiere nombres estables (sin -preview), mapeamos
                const VERTEX_MAP: Record<string, string> = {
                    'gemini-3.1-pro-preview':       'gemini-1.5-pro-002',
                    'gemini-3.1-flash-lite-preview': 'gemini-1.5-flash-002',
                    'gemini-2.0-flash':              'gemini-2.0-flash-001',
                };
                const vertexModel = VERTEX_MAP[config.model] || config.model.replace(/-preview$/, '-002').replace(/^models\//, '');
                const { projectId, location } = API_CONFIG.vertexAI;
                const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${vertexModel}:generateContent`;
                console.log(`[Gemini] Vertex AI → ${vertexModel}`);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                });
                return await this.processGeminiResponse(response, role, config);
            } catch (e: any) {
                console.error('[Gemini] Vertex AI failed:', e.message);
                throw new Error(`Vertex AI error: ${e.message}`);
            }
        }

        throw new Error('No Gemini credentials: add GEMINI_API_KEY to .env.local');
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
        const costPerMillion = isPro ? 1.25 : 0.075; // Approx
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

    /**
     * Shortcuts para despacho directo
     */
    async dispatchTo(role: AgentRole, prompt: string, context?: string): Promise<AgentResponse> {
        return this.dispatch({ role, prompt, context });
    }

    async dispatchAuto(taskDescription: string, prompt: string, context?: string): Promise<AgentResponse> {
        return this.dispatch({ taskDescription, prompt, context });
    }
}

// Singleton
export const agentDispatcher = new AgentDispatcher();
