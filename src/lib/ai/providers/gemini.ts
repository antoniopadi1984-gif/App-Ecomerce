import { GoogleAuth } from 'google-auth-library';
import { AIProvider, AIResponse, TextOptions, VisionOptions } from "./interfaces";
import { getConnectionSecret, getConnectionMeta } from '@/lib/server/connections';

export class GeminiProvider implements AIProvider {
    name = "gemini";
    capabilities = ["TEXT" as const, "VISION" as const, "IMAGE" as const, "VIDEO" as const];

    private async getAccessToken(): Promise<string> {
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!saKey) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY for Gemini GCP");

        try {
            const key = JSON.parse(saKey);
            const auth = new GoogleAuth({
                credentials: key,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
            const client = await auth.getClient();
            const token = await client.getAccessToken();
            return token.token || "";
        } catch (e) {
            console.error("[GeminiProvider] Auth failed", e);
            throw e;
        }
    }

    async getModels(): Promise<string[]> {
        return [
            // ✅ GA en europe-west1
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.0-flash-001",
            "gemini-2.0-flash-lite-001",
            // 🌐 Solo endpoint global (fuera de EU)
            "gemini-3.1-pro-preview",
            "gemini-2.5-flash-preview-09-2025",
        ];
    }

    async invokeText(options: TextOptions): Promise<AIResponse> {
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const apiKey = await getConnectionSecret('store-main', 'GEMINI') || process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY;

        const saKeyStatus = saKey ? "PRESENT" : "MISSING";
        const apiKeyStatus = apiKey ? "PRESENT" : "MISSING";

        console.log(`[GeminiProvider] invokeText: model=${options.model}, SA_KEY=${saKeyStatus}, API_KEY=${apiKeyStatus}`);

        // 1. Try Vertex AI (Preferred for Production)
        if (saKey) {
            console.log(`[GeminiProvider] -> Routing to Vertex AI (Service Account)`);
            return this.invokeVertex(options);
        }

        // 2. Try AI Studio (Fallback for API Key Users)
        if (apiKey) {
            console.log(`[GeminiProvider] -> Routing to AI Studio (API Key)`);
            return this.invokeAIStudio(options);
        }

        throw new Error("No valid credentials found for Gemini in DB or ENV (GCP Service Account or GEMINI API_KEY)");
    }

    private async invokeVertex(options: TextOptions): Promise<AIResponse> {
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!saKey) throw new Error("Vertex requiere GOOGLE_SERVICE_ACCOUNT_KEY en Base de Datos");

        let key;
        try {
            key = JSON.parse(saKey);
        } catch (e) {
            throw new Error("Error al parsear GOOGLE_SERVICE_ACCOUNT_KEY: Formato JSON inválido. Quizás pegaste el ID de proyecto en el campo de JSON.");
        }

        const project = key.project_id;
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";
        const model = options.model;

        const token = await this.getAccessToken();
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

        const body: any = {
            contents: [{
                role: "user",
                parts: [{ text: options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 8192,
                topP: 0.95,
                topK: 40,
                candidateCount: 1,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        if (options.jsonSchema) {
            body.generationConfig.responseMimeType = "application/json";
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        return this.processResponse(res, options.model, true);
    }

    private async invokeAIStudio(options: TextOptions): Promise<AIResponse> {
        const apiKey = await getConnectionSecret('store-main', 'GEMINI') || process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("AI Studio requires GEMINI API KEY in Database");

        // AI Studio uses 'generativelanguage.googleapis.com'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`;

        const body: any = {
            contents: [{
                role: "user",
                parts: [{ text: options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 8192,
                topP: 0.95,
                topK: 40,
                candidateCount: 1,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        if (options.jsonSchema) {
            body.generationConfig.responseMimeType = "application/json";
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        return this.processResponse(res, options.model, false);
    }

    async invokeImage(options: any): Promise<AIResponse> {
        const token = await this.getAccessToken();
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const key = JSON.parse(saKey!);
        const project = key.project_id;
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";
        const model = options.model || "imagegeneration@006";

        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

        const body = {
            instances: [{ prompt: options.prompt }],
            parameters: {
                sampleCount: options.numImages || 1,
                aspectRatio: options.aspectRatio === "9:16" ? "9:16" : options.aspectRatio === "16:9" ? "16:9" : "1:1",
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        const base64 = data.predictions?.[0]?.bytesBase64Encoded;

        return {
            text: base64 ? `data:image/png;base64,${base64}` : "",
            raw: data
        };
    }

    async invokeVideo(options: any): Promise<AIResponse> {
        const token = await this.getAccessToken();
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const key = JSON.parse(saKey!);
        const project = key.project_id;
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";
        const model = options.model || "veo-3.1";

        // VEO 3.1 Long Running Operation Pattern
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

        const body = {
            instances: [{
                prompt: options.prompt
            }],
            parameters: {
                duration: options.duration || "10s",
                aspectRatio: options.aspectRatio || "9:16"
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const lro = await res.json();
        return {
            text: lro.name, // The operation name for polling
            raw: lro
        };
    }

    /**
     * Helper de alto nivel que invoca Video y espera el resultado (polling).
     * Usado por replicate-client para abstraer la complejidad de Vertex LROs.
     */
    async generateVideo(params: {
        prompt: string;
        model: string;
        aspectRatio: string;
        durationSeconds: number;
    }): Promise<string> {
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!saKey) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY for Gemini GCP");
        const key = JSON.parse(saKey);
        const projectId = key.project_id;
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";

        const token = await this.getAccessToken();
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${params.model}:predictLongRunning`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{
                    prompt: params.prompt,
                }],
                parameters: {
                    aspectRatio: params.aspectRatio,
                    durationSeconds: params.durationSeconds,
                    sampleCount: 1,
                }
            })
        });

        const op = await res.json();
        if (op.error) throw new Error(`Veo 3 error: ${op.error.message}`);

        // Poll operation hasta completar
        const opName = op.name;
        console.log(`[GeminiProvider] ⏳ Polling LRO: ${opName}...`);

        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 10000)); // 10s entre polls
            const pollRes = await fetch(
                `https://${location}-aiplatform.googleapis.com/v1/${opName}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const pollData = await pollRes.json();
            if (pollData.done) {
                if (pollData.error) throw new Error(`Veo 3 error: ${pollData.error.message}`);
                
                const videoUri = pollData.response?.videos?.[0]?.uri
                    || pollData.response?.predictions?.[0]?.videoUrl
                    || pollData.response?.video?.uri;
                
                if (!videoUri) {
                    console.error("[GeminiProvider] No video URI in response:", JSON.stringify(pollData, null, 2));
                    throw new Error('Veo 3: no video URI in response');
                }
                return videoUri;
            }
        }
        throw new Error('Veo 3: timeout esperando vídeo');
    }

    async invokeMusic(options: any): Promise<AIResponse> {
        const token = await this.getAccessToken();
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const key = JSON.parse(saKey!);
        const project = key.project_id;
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";
        const model = options.model || "lyria-002";

        // LYRIA 2 pattern
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

        const body = {
            instances: [{ prompt: options.prompt }],
            parameters: { durationSeconds: options.duration || 30 }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return {
            text: data.predictions?.[0]?.audioUri || "",
            raw: data
        };
    }

    private async processResponse(res: Response, model: string, isVertex: boolean): Promise<AIResponse> {
        if (!res.ok) {
            const errText = await res.text();
            let errorMessage = `Error en ${isVertex ? 'Vertex AI' : 'AI Studio'} (${res.status})`;
            try {
                const errJson = JSON.parse(errText);
                errorMessage = errJson.error?.message || errorMessage;
            } catch (e) { }
            throw new Error(errorMessage);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const usage = data.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

        // Pricing estimation
        let pricePerInput = model.includes("flash") ? 0.10 / 1_000_000 : 3.50 / 1_000_000;
        let pricePerOutput = model.includes("flash") ? 0.40 / 1_000_000 : 10.50 / 1_000_000;
        const cost = (usage.promptTokenCount * pricePerInput) + (usage.candidatesTokenCount * pricePerOutput);

        return {
            text,
            usage: {
                inputTokens: usage.promptTokenCount,
                outputTokens: usage.candidatesTokenCount,
                costEur: cost * 0.92
            }
        };
    }

    async invokeVision(options: VisionOptions): Promise<AIResponse> {
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const apiKey = await getConnectionSecret('store-main', 'GEMINI') || process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (saKey) return this.invokeVertexVision(options);
        if (apiKey) return this.invokeAIStudioVision(options);

        throw new Error("No credentials for Gemini Vision");
    }

    private async invokeVertexVision(options: VisionOptions): Promise<AIResponse> {
        const token = await this.getAccessToken();
        const gcpMeta = await getConnectionMeta('store-main', 'VERTEX');
        const location = gcpMeta?.VERTEX_LOCATION || process.env.GOOGLE_LOCATION || "europe-west1";
        const saKey = await getConnectionSecret('store-main', 'GCP') || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const key = JSON.parse(saKey!);
        const project = key.project_id;

        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${options.model}:generateContent`;

        const parts: any[] = [{ text: options.prompt }];

        if (options.images) {
            for (const img of options.images) {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: img.split(',').pop()
                    }
                });
            }
        }

        if (options.video) {
            parts.push({
                inlineData: {
                    mimeType: options.videoMimeType || "video/mp4",
                    data: options.video.split(',').pop()
                }
            });
        }

        const body = {
            contents: [{ role: "user", parts }],
            generationConfig: {
                temperature: options.temperature || 0.4,
                maxOutputTokens: 8192,
                topP: 0.95,
                topK: 40,
                candidateCount: 1,
                responseMimeType: "application/json"
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return this.processResponse(res, options.model, true);
    }

    private async invokeAIStudioVision(options: VisionOptions): Promise<AIResponse> {
        const apiKey = await getConnectionSecret('store-main', 'GEMINI') || process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`;

        const parts: any[] = [{ text: options.prompt }];

        if (options.images) {
            for (const img of options.images) {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: img.split(',').pop()
                    }
                });
            }
        }

        if (options.video) {
            parts.push({
                inlineData: {
                    mimeType: options.videoMimeType || "video/mp4",
                    data: options.video.split(',').pop()
                }
            });
        }

        const body = {
            contents: [{ role: "user", parts }],
            generationConfig: {
                temperature: options.temperature || 0.4,
                maxOutputTokens: 8192,
                topP: 0.95,
                topK: 40,
                candidateCount: 1,
                responseMimeType: "application/json"
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return this.processResponse(res, options.model, false);
    }
}
