import Replicate from "replicate";
import { AIProvider, TextOptions, VisionOptions, AIResponse } from "./interfaces";
import { getConnectionSecret } from '@/lib/server/connections';

export class ReplicateProvider implements AIProvider {
    name = "REPLICATE";
    capabilities: ("TEXT" | "VISION" | "IMAGE" | "VIDEO" | "EMBEDDINGS")[] = ["TEXT", "VISION"];

    private async getClient(): Promise<Replicate> {
        const token = await getConnectionSecret('store-main', 'REPLICATE') || process.env.REPLICATE_API_TOKEN;
        if (!token) {
            throw new Error("REPLICATE_API_TOKEN is missing in Database Connections");
        }
        return new Replicate({
            auth: token,
        });
    }

    async getModels(): Promise<string[]> {
        return [
            "anthropic/claude-3.7-sonnet",
            "anthropic/claude-3-sonnet",
            "anthropic/claude-3-opus",
            "meta/llama-2-70b-chat",
            "mistralai/mistral-7b-v0.1"
        ];
    }

    async invokeText(options: TextOptions): Promise<AIResponse> {
        try {
            // Map common model names to Replicate format if necessary
            let model = options.model;
            if (model.includes("claude-3.7")) model = "anthropic/claude-3.7-sonnet";

            console.log(`[ReplicateProvider] Invoking ${model}...`);

            const input: any = {
                prompt: options.prompt,
                max_new_tokens: options.maxTokens || 2048,
                temperature: options.temperature || 0.7,
            };

            if (options.systemPrompt) {
                input.system_prompt = options.systemPrompt;
            }

            const client = await this.getClient();

            // For Claude models on Replicate, they often use a specific schema
            // We use the run method which is standard
            const output: any = await client.run(
                model as `${string}/${string}` | `${string}/${string}:${string}`,
                { input }
            );

            // Replicate output for text models is often an array or a stream of strings
            const text = Array.isArray(output) ? output.join("") : (typeof output === 'string' ? output : JSON.stringify(output));

            return {
                text,
                usage: {
                    inputTokens: 0, // Replicate doesn't always return this in a standard way via SDK
                    outputTokens: 0,
                    costEur: 0 // Will need specific pricing table
                },
                raw: output
            };
        } catch (error: any) {
            console.error("[ReplicateProvider] Error:", error);
            throw error;
        }
    }

    async invokeVision(options: VisionOptions): Promise<AIResponse> {
        // Implementation for vision models on Replicate (e.g. LLaVA or Claude Vision)
        throw new Error("Vision not yet implemented for Replicate provider");
    }
}
