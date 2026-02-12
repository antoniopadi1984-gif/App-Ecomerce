
/**
 * Safe JSON Parser for UI
 * Prevents crashes when parsing potentially corrupt or null JSON strings.
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): any {
    if (!jsonString) return fallback;
    try {
        const parsed = JSON.parse(jsonString);
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (e) {
        console.warn("safeJsonParse failed for string:", jsonString?.substring(0, 50) + "...", e);
        return fallback;
    }
}

/**
 * Normalizes ResearchOutput (from Prisma or API) into the strict shape requested by the UI Modales.
 * Handles "Healing Hydration" logic merging ActiveRun and Version Output.
 */
export function normalizeResearchOutputForUI(
    activeRun: any,
    versionOutput: any
) {
    // 1. Base: Start with empty structure
    let normalized: any = {
        summary: "",
        dna_forense: {},
        voc: {},
        avatar_scoring: {},
        breakthrough_advertising: {},
        angles: {},
        economics: {},
        creative_briefs: {},
        validation_report: null, // Critical for "Validacion Mercado" modal
        market_validation: null
    };

    // 2. Layer 1: Version Output (Historical / Complete)
    if (versionOutput) {
        // Parse individual columns
        const exp = safeJsonParse(versionOutput.exportsJson, {});

        normalized.summary = exp.summary || "";
        normalized.dna_forense = safeJsonParse(versionOutput.productIntelligence, exp.dna_forense || {});
        normalized.voc = safeJsonParse(versionOutput.languageBank, exp.voc || {});
        normalized.avatar_scoring = safeJsonParse(versionOutput.macroAvatarSheet, exp.avatar_scoring || {});

        // Validation Report is tricky: it might be in exportsJson or not.
        // Prisma schema does NOT have validationReport column, so we rely on exportsJson
        normalized.validation_report = exp.validation_report || null;
        normalized.market_validation = exp.market_validation || null;

        normalized.breakthrough_advertising = safeJsonParse(versionOutput.competitorBreakdown, exp.breakthrough_advertising || {});
        normalized.creative_briefs = safeJsonParse(versionOutput.creativeInsights, exp.creative_briefs || {});
        normalized.economics = safeJsonParse(versionOutput.economicsJson, exp.economics || {});
        normalized.angles = safeJsonParse(versionOutput.hookAngleDb, exp.angles || {});

        // Fallback for angles if not in hookAngleDb (removed column)
        if (!normalized.angles || Object.keys(normalized.angles).length === 0) {
            normalized.angles = exp.angles || {};
        }
    }

    // 3. Layer 2: Active Run (Live / Fresher)
    // "Healing Hydration": If activeRun exists, it might have newer data than version (especially during generation)
    if (activeRun?.results) {
        const live = safeJsonParse(activeRun.results, {});

        // Merge strategy: Overwrite empty fields or update existing?
        // We assume Active Run is "Live Context" and takes precedence if it has content.

        if (live.summary) normalized.summary = live.summary;
        if (live.dna_forense?.vehiculo) normalized.dna_forense = live.dna_forense;
        if (live.voc?.pain_stack?.length > 0) normalized.voc = live.voc;
        if (live.avatar_scoring?.avatars?.length > 0) normalized.avatar_scoring = live.avatar_scoring;
        if (live.validation_report) normalized.validation_report = live.validation_report;
        if (live.breakthrough_advertising?.awareness_levels) normalized.breakthrough_advertising = live.breakthrough_advertising;
        if (live.angles?.angle_tree) normalized.angles = live.angles;
        if (live.economics?.offer_simulations) normalized.economics = live.economics;
        if (live.creative_briefs) normalized.creative_briefs = live.creative_briefs;
    }

    // 4. Final Consistency Checks (Defaults)
    if (!normalized.truth_layer) normalized.truth_layer = { claims: [], evidence: [] }; // Fallback

    return normalized;
}
