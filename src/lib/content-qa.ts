
import { COMPLIANCE_RULES } from "./copy-hub-protocol";

export interface ValidationResult {
    passed: boolean;
    warnings: string[];
    score: number;
}

/**
 * Validates content against compliance rules.
 */
export function validateContent(text: string, context: 'AD' | 'LANDING'): ValidationResult {
    const warnings: string[] = [];
    let score = 100;

    if (context === 'AD') {
        COMPLIANCE_RULES.SAFE_MODE_ADS.prohibited.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                warnings.push(`Palabra prohibida detectada en Anuncio: "${word}"`);
                score -= 15;
            }
        });
    }

    // Similarity / Originality Check (Simplified for now)
    if (text.length < 50) {
        warnings.push("El contenido es demasiado corto para una conversión óptima.");
        score -= 10;
    }

    // Call to Action Check
    if (!text.includes("CTA") && !text.toLowerCase().includes("comprar") && !text.toLowerCase().includes("click")) {
        warnings.push("No se detectó un Call to Action (CTA) claro.");
        score -= 20;
    }

    return {
        passed: score >= 70,
        warnings,
        score: Math.max(0, score)
    };
}
