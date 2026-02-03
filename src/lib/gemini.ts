
/**
 * Gemini Service
 * Simple wrapper for Google AI (Gemini) API calls.
 */
export class GeminiService {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    constructor() {
        const key = process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not configured in .env");
        this.apiKey = key;
    }

    async generateContent(prompt: string, options: { temperature?: number, maxOutputTokens?: number } = {}) {
        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxOutputTokens || 1024,
                    }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message || "Gemini API Error");

            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error: any) {
            console.error("🛑 [GeminiService] Error:", error.message);
            throw error;
        }
    }
}
