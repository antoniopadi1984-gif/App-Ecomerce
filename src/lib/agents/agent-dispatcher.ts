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

    /**
     * Despachar a agente apropiado
     */
    async dispatch(request: AgentRequest): Promise<AgentResponse> {
        // Determinar agente
        const role = request.role || selectAgentForTask(request.taskDescription || request.prompt);
        const agentConfig = getAgentConfig(role);
        const provider = getAgentProvider(role);

        console.log(`[AgentDispatcher] Task → Agent: ${role}`);
        console.log(`[AgentDispatcher] Provider: ${provider}`);
        console.log(`[AgentDispatcher] Model: ${agentConfig.model}`);

        // Despachar según provider
        switch (provider) {
            case 'replicate-claude':
                return this.dispatchToReplicate(role, agentConfig, request);

            case 'gemini-2.0-pro':
            case 'gemini-2.0-flash':
                return this.dispatchToGemini(role, agentConfig, request);

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

        const prompt = request.context
            ? `CONTEXTO:\n${request.context}\n\nTAREA:\n${request.prompt}${request.jsonSchema ? '\n\nIMPORTANTE: Responde ÚNICAMENTE en formato JSON válido según el esquema solicitado.' : ''}`
            : request.prompt;

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
     * Despachar a Gemini (Vertex AI)
     */
    private async dispatchToGemini(
        role: AgentRole,
        config: any,
        request: AgentRequest
    ): Promise<AgentResponse> {

        // 1. Try Vertex AI (Preferred)
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            try {
                const client = await this.googleAuth.getClient();
                const token = await client.getAccessToken();
                if (!token.token) throw new Error("Failed to get access token");

                const fullPrompt = `${config.systemPrompt}\n\n${request.context ? `CONTEXTO:\n${request.context}\n\n` : ''}TAREA:\n${request.prompt}`;

                // Normalizar nombre del modelo para Vertex AI
                let vertexModel = config.model;
                if (vertexModel === 'gemini-1.5-flash' || vertexModel === 'gemini-1.5-pro') {
                    vertexModel = `${vertexModel}-001`; // Vertex prefiere sufijos
                }

                const endpoint = `https://${API_CONFIG.vertexAI.location}-aiplatform.googleapis.com/v1/projects/${API_CONFIG.vertexAI.projectId}/locations/${API_CONFIG.vertexAI.location}/publishers/google/models/${vertexModel}:generateContent`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: fullPrompt }]
                        }],
                        generationConfig: {
                            temperature: request.temperature ?? config.temperature,
                            maxOutputTokens: request.maxTokens || config.maxTokens,
                            responseMimeType: request.jsonSchema ? "application/json" : "text/plain"
                        }
                    })
                });

                return await this.processGeminiResponse(response, role, config);

            } catch (e: any) {
                console.error("[AgentDispatcher] Vertex AI failed:", e.message);
                if (e.response) {
                    const errDetail = await (e.response as any).text().catch(() => '');
                    console.error("[AgentDispatcher] Vertex AI Error Detail:", errDetail);
                }
                console.log("[AgentDispatcher] trying fallback to Gemini Studio...");
            }
        }

        // 2. Fallback to AI Studio (API Key)
        // Prefer GEMINI_API_KEY if VERTEX_AI_API_KEY doesn't look like a standard Google key
        const apiKey = (process.env.VERTEX_AI_API_KEY?.startsWith('AIza') ? process.env.VERTEX_AI_API_KEY : process.env.GEMINI_API_KEY)
            || process.env.VERTEX_AI_API_KEY;

        if (apiKey) {
            // Limpiar el nombre del modelo
            let modelName = config.model.replace(/^models\//, '');
            // Para AI Studio (v1beta), mantenemos los nombres estándar de 2.0
            if (modelName.includes('gemini-2.0')) {
                // Aseguramos que no tenga sufijos excesivos para Studio si no es necesario
                modelName = modelName.replace(/-(001|002|003)$/, '');
            }

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const fullPrompt = `${config.systemPrompt}\n\n${request.context ? `CONTEXTO:\n${request.context}\n\n` : ''}TAREA:\n${request.prompt}`;

            console.log(`[AgentDispatcher] Calling Gemini Studio API: ${endpoint.split('?')[0]}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: fullPrompt }]
                    }],
                    generationConfig: {
                        temperature: request.temperature ?? config.temperature,
                        maxOutputTokens: request.maxTokens || config.maxTokens,
                        responseMimeType: request.jsonSchema ? "application/json" : "text/plain"
                    }
                })
            });

            return this.processGeminiResponse(response, role, config);
        }

        throw new Error("No valid credentials for Gemini (Service Account or API Key missing)");
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
