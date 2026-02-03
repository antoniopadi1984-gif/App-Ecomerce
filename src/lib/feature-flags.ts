export const FEATURE_FLAGS = {
    SYSTEM: {
        FFMPEG_ENABLED: false, // Will be auto-detected via capabilities
        GPU_ENABLED: false,    // Will be auto-detected via capabilities
        JOBS_ENABLED: true,    // Phase 2 target
        HEALTH_DASHBOARD: true,
    },
    AD_SPY: {
        ENABLED: true,
        CASCADE_CAPTURE: true,
        STREAM_ASSEMBLY: false,
        SCREEN_RECORDING: false,
    },
    AVATARS_LAB: {
        ENABLED: true,
        LOCAL_ENGINE: true,
        ELEVEN_LABS: true,
        GEMINI_VISION: true,
        SYNTHESIS_REAL: false, // Flag for level 1 synthesis
    },
    MARKETING_AI: {
        ENABLED: true,
        MASTER_AUDIT: true,
    },
    CONNECTIONS: {
        SHOPIFY_ENABLED: true,
        META_ENABLED: false, // Phase 5 target
        TIKTOK_ENABLED: false, // Phase 5 target
        BEEPING_ENABLED: true,
        DROPEA_ENABLED: true,
        WHATSAPP_ENABLED: false, // Phase 8 target
        ZADARMA_ENABLED: false,  // Phase 8 target
        DRIVE_ORG_ENABLED: false, // Phase 11 target
    }
};

export type FeatureFlagPath = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(module: keyof typeof FEATURE_FLAGS, feature?: string): boolean {
    const mod = FEATURE_FLAGS[module];
    if (!mod) return false;
    if (!feature) return (mod as any).ENABLED ?? true;
    return (mod as any)[feature] ?? false;
}
