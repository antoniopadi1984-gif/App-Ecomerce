import { getUserConnectionSecret } from "@/lib/server/user-connections";

export type TaskType = 'RESEARCH' | 'COPYWRITING' | 'CREATIVE_IMAGE' | 'CREATIVE_VIDEO' | 'VOICE';

export async function routeModelTask(userId: string, taskType: TaskType, payload: any) {
    // Determine which provider to use based on task type and user credentials
    switch (taskType) {
        case 'CREATIVE_IMAGE':
        case 'CREATIVE_VIDEO':
        case 'VOICE':
            const replicateKey = await getUserConnectionSecret(userId, "REPLICATE");
            if (!replicateKey) throw new Error("No Replicate key configured. Please configure in Settings.");

            // In a full implementation, we would call the Replicate API here passing the payload
            return { provider: "REPLICATE", status: "queued", payload };

        case 'RESEARCH':
        case 'COPYWRITING':
            // Prefer Claude
            const claudeKey = await getUserConnectionSecret(userId, "CLAUDE");
            if (claudeKey) {
                return { provider: "CLAUDE", status: "success", result: "Generated text via Claude..." };
            }

            // Fallback to Gemini
            const geminiKey = await getUserConnectionSecret(userId, "GEMINI");
            if (geminiKey) {
                return { provider: "GEMINI", status: "success", result: "Generated text via Gemini..." };
            }

            // Fallback to Vertex (Google Cloud)
            const vertexKey = await getUserConnectionSecret(userId, "GOOGLE_CLOUD");
            if (vertexKey) {
                return { provider: "VERTEX", status: "success", result: "Generated text via Vertex..." };
            }

            throw new Error("No LLM keys configured (Claude/Gemini/Vertex). Please configure in Settings.");

        default:
            throw new Error(`Unsupported task type: ${taskType}`);
    }
}
