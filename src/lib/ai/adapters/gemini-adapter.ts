import { agentDispatcher } from '../../agents/agent-dispatcher';

/**
 * Gemini Service/Adapter - LEGACY ADAPTERS
 * Simple wrapper for Google AI (Gemini) API calls.
 * Now routes to agentDispatcher for intelligent routing.
 */

export class GeminiService {
    async generateContent(prompt: string, options: { temperature?: number, maxOutputTokens?: number, context?: string } = {}) {
        try {
            console.log('[Legacy GeminiService] Routing to agent dispatcher...');
            const result = await agentDispatcher.dispatchAuto(prompt, prompt, options.context);
            return result.text;
        } catch (error: any) {
            console.error("🛑 [GeminiService] Error:", error.message);
            throw error;
        }
    }
}

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
