import Replicate from "replicate";
import { AIProvider, TextOptions, VisionOptions, AIResponse } from "./interfaces";
import { getConnectionSecret } from '@/lib/server/connections';

export class ReplicateProvider implements AIProvider {
    name = "REPLICATE";
    capabilities: ("TEXT" | "VISION" | "IMAGE" | "VIDEO" | "EMBEDDINGS")[] = ["TEXT", "VISION", "IMAGE", "VIDEO"];

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
            "black-forest-labs/flux-kontext-pro",
            "ideogram-ai/ideogram-v3",
            "recraft-ai/recraft-v3-svg",
            "kwaivgi/kling-v2-6",
            "bytedance/omni-human",
            "sync/lipsync-2-pro"
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

    async invokeImage(options: any): Promise<AIResponse> {
        try {
            const client = await this.getClient();
            const model = options.model || "black-forest-labs/flux-dev";

            console.log(`[ReplicateProvider] invokeImage: model=${model}`);

            const input: any = {
                prompt: options.prompt,
                aspect_ratio: options.aspectRatio || "1:1",
            };

            // Support for Kontext Pro references
            if (options.images && options.images.length > 0) {
                options.images.forEach((img: string, idx: number) => {
                    const key = idx === 0 ? "input_image" : `input_image_${idx + 1}`;
                    input[key] = img;
                });
            }

            const output: any = await client.run(
                model as `${string}/${string}` | `${string}/${string}:${string}`,
                { input }
            );

            // Output is usually an array of URLs or a single URL
            const url = Array.isArray(output) ? output[0] : output;

            return {
                text: url,
                raw: output
            };
        } catch (error: any) {
            console.error("[ReplicateProvider] invokeImage Error:", error);
            throw error;
        }
    }

    async invokeVideo(options: any): Promise<AIResponse> {
        try {
            const client = await this.getClient();
            const model = options.model || "kwaivgi/kling-v2-6";

            console.log(`[ReplicateProvider] invokeVideo: model=${model}`);

            const input: any = {
                prompt: options.prompt,
                duration: options.duration || "5",
                aspect_ratio: options.aspectRatio || "9:16",
            };

            if (options.image) {
                input.image = options.image;
            }

            // Sync LipSync 2 Pro support
            if (model.includes("lipsync-2-pro")) {
                input.video = options.video || options.image;
                input.audio = options.audio;
            }

            // Omni Human support
            if (model.includes("omni-human")) {
                input.image = options.image;
                input.audio = options.audio;
            }

            const output: any = await client.run(
                model as `${string}/${string}` | `${string}/${string}:${string}`,
                { input }
            );

            const url = Array.isArray(output) ? output[0] : output;

            return {
                text: url,
                raw: output
            };
        } catch (error: any) {
            console.error("[ReplicateProvider] invokeVideo Error:", error);
            throw error;
        }
    }

    async invokeMusic(options: any): Promise<AIResponse> {
        // Implementation for Riffusion or other audio models on Replicate
        throw new Error("Music generation not yet implemented for Replicate provider");
    }
}
