/**
 * ─── EcomBom Translation System ─────────────────────────────────────────────
 * Central utility for multilingual support.
 *
 * Philosophy:
 *  - All AI generation uses marketLanguage (the language of the target market)
 *  - The user always sees content in Spanish (ES)
 *  - Translations are generated on-demand with Gemini and CACHED in DB
 *  - Next time the user views the same content → DB hit, no API call
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Language metadata ────────────────────────────────────────────────────────
export const MARKET_LANGUAGES: Record<string, { label: string; locale: string; flag: string }> = {
    ES: { label: 'Español', locale: 'es-ES', flag: '🇪🇸' },
    EN: { label: 'English', locale: 'en-GB', flag: '🇬🇧' },
    US: { label: 'English', locale: 'en-US', flag: '🇺🇸' },
    FR: { label: 'Français', locale: 'fr-FR', flag: '🇫🇷' },
    DE: { label: 'Deutsch', locale: 'de-DE', flag: '🇩🇪' },
    IT: { label: 'Italiano', locale: 'it-IT', flag: '🇮🇹' },
    MX: { label: 'Español', locale: 'es-MX', flag: '🇲🇽' },
    CO: { label: 'Español', locale: 'es-CO', flag: '🇨🇴' },
    AR: { label: 'Español', locale: 'es-AR', flag: '🇦🇷' },
    BR: { label: 'Português', locale: 'pt-BR', flag: '🇧🇷' },
    PT: { label: 'Português', locale: 'pt-PT', flag: '🇵🇹' },
    NL: { label: 'Nederlands', locale: 'nl-NL', flag: '🇳🇱' },
};

/** Map a country code to its market language code */
export function countryToLang(country: string): string {
    const map: Record<string, string> = {
        ES: 'ES', MX: 'ES', CO: 'ES', AR: 'ES', PE: 'ES',
        UK: 'EN', US: 'EN',
        FR: 'FR', DE: 'DE', IT: 'IT',
        BR: 'BR', PT: 'PT', NL: 'NL',
    };
    return map[country] ?? 'ES';
}

/** Returns true if a market language needs translation for the ES interface */
export function needsTranslation(marketLang: string): boolean {
    return !['ES', 'MX', 'CO', 'AR', 'PE'].includes(marketLang);
}

/** Get the full name of a language code for prompts */
export function langName(code: string): string {
    const names: Record<string, string> = {
        ES: 'español', EN: 'inglés', FR: 'francés', DE: 'alemán',
        IT: 'italiano', BR: 'portugués brasileño', PT: 'portugués',
        NL: 'neerlandés', US: 'inglés americano',
    };
    return names[code] ?? code.toLowerCase();
}

// ── Core translation function ────────────────────────────────────────────────
/**
 * Translate marketing text from marketLang to ES using Gemini.
 * Keeps tonal/emotional nuance — NOT a literal translation.
 */
export async function translateToEs(
    text: string,
    marketLang: string,
    context?: string // e.g. 'research hook', 'video script', 'ad copy'
): Promise<string> {
    if (!needsTranslation(marketLang) || !text.trim()) return text;

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY || process.env.VERTEX_AI_API_KEY || ''
        );
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL_FAST || 'gemini-2.0-flash',
        });

        const contextHint = context ? ` Este es contenido de tipo: ${context}.` : '';
        const prompt = `Traduce el siguiente texto de marketing del ${langName(marketLang)} al español.${contextHint}

Reglas importantes:
- NO traduzcas literalmente: adapta culturalmente manteniendo el impacto emocional
- Mantén el tono persuasivo y la intensidad emocional del original
- Conserva los términos técnicos del nicho (no los domestiques)
- Mantén el lenguaje del avatar (formal/informal, joven/adulto)
- Si hay nombres propios o marcas → mantenlos igual
- Responde SOLO con la traducción, sin explicaciones ni notas

Texto a traducir:
${text}`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error('[Translation] Gemini error:', err);
        return text; // Fallback: return original
    }
}

/**
 * Translate content in the target language for generation prompts.
 * Used to instruct the AI to generate in the market language.
 */
export function langInstruction(marketLang: string): string {
    if (marketLang === 'ES') return '';
    return `\n\n⚠️ IMPORTANT: Generate ALL content in ${langName(marketLang).toUpperCase()} (${MARKET_LANGUAGES[marketLang]?.label ?? marketLang}). Do NOT switch to Spanish.`;
}

// ── DB Cache helpers ─────────────────────────────────────────────────────────
// These are called from API routes (server-side only) to persist translations

/**
 * Get or create ES translation for a ResearchStep.
 * Checks DB cache first, generates if missing.
 */
export async function getResearchStepTranslation(
    stepId: string,
    originalText: string,
    marketLang: string
): Promise<string> {
    const { prisma } = await import('@/lib/prisma');

    const step = await (prisma as any).researchStep.findUnique({
        where: { id: stepId },
        select: { translationEs: true }
    });

    if (step?.translationEs) return step.translationEs;

    // Generate & cache
    const translated = await translateToEs(originalText, marketLang, 'research output');
    await (prisma as any).researchStep.update({
        where: { id: stepId },
        data: { translationEs: translated }
    });
    return translated;
}

/**
 * Get or create ES translation for a CreativeAsset script.
 */
export async function getCreativeAssetTranslation(
    assetId: string,
    originalScript: string,
    marketLang: string
): Promise<string> {
    const { prisma } = await import('@/lib/prisma');

    const asset = await (prisma as any).creativeAsset.findUnique({
        where: { id: assetId },
        select: { scriptEs: true }
    });

    if (asset?.scriptEs) return asset.scriptEs;

    const translated = await translateToEs(originalScript, marketLang, 'video script');
    await (prisma as any).creativeAsset.update({
        where: { id: assetId },
        data: { scriptEs: translated }
    });
    return translated;
}

/**
 * Get or create ES translation for a ComboMatrix hookBank.
 */
export async function getComboMatrixTranslation(
    matrixId: string,
    hookBank: string,
    marketLang: string
): Promise<string> {
    const { prisma } = await import('@/lib/prisma');

    const matrix = await (prisma as any).comboMatrix.findUnique({
        where: { id: matrixId },
        select: { hookBankEs: true }
    });

    if (matrix?.hookBankEs) return matrix.hookBankEs;

    const translated = await translateToEs(hookBank, marketLang, 'ad hook bank');
    await (prisma as any).comboMatrix.update({
        where: { id: matrixId },
        data: { hookBankEs: translated }
    });
    return translated;
}
