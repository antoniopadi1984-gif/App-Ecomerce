import { agentDispatcher } from './agents/agent-dispatcher';

/**
 * Gemini Service - LEGACY ADAPTER
 * Simple wrapper for Google AI (Gemini) API calls.
 * Ahora deriva al agentDispatcher para enrutamiento inteligente.
 */
export class GeminiAdapter {
    async generateContent(prompt: string, options: { temperature?: number, maxOutputTokens?: number, context?: string } = {}) {
        try {
            console.log('[Legacy GeminiAdapter] Routing to agent dispatcher...');

            const result = await agentDispatcher.dispatchAuto(prompt, prompt, options.context);

            return result.text;
        } catch (error: any) {
            console.error("🛑 [GeminiAdapter] Error:", error.message);
            throw error;
        }
    }
}
