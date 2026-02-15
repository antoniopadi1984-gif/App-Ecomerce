/**
 * Mapa centralizado de modelos Replicate.
 * Todos los modelos de IA que usa la app están aquí.
 * Regla de oro: NINGÚN código llama a Anthropic directo.
 */

export const REPLICATE_MODELS = {
    // ============================================
    // TEXT (Claude via Replicate)
    // ============================================
    TEXT: {
        /** Claude 3.7 Sonnet — copywriting premium, CRO, scripts */
        CLAUDE_DEFAULT: "anthropic/claude-3.7-sonnet",
        CLAUDE_SONNET: "anthropic/claude-3-sonnet",
        CLAUDE_OPUS: "anthropic/claude-3-opus",
    },

    // ============================================
    // IMAGE (Flux via Replicate)
    // ============================================
    IMAGE: {
        FLUX_DEV: "black-forest-labs/flux-dev",
        FLUX_SCHNELL: "black-forest-labs/flux-schnell",
        FLUX_PRO: "black-forest-labs/flux-pro",
        FLUX_PRO_11: "black-forest-labs/flux-1.1-pro",
    },

    // ============================================
    // VIDEO (Luma, MiniMax via Replicate)
    // ============================================
    VIDEO: {
        LUMA_RAY: "luma/ray-v2",
        MINIMAX: "minimax/video-01",
    },

    // ============================================
    // AVATAR / LIPSYNC (via Replicate)
    // ============================================
    AVATAR: {
        LIVE_PORTRAIT: "fofr/live-portrait:89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11",
        SAD_TALKER: "cjwbw/sadtalker:3aa3dac9353cc4d6bd62a35e0f571bf7ce2b05b8e0b8b9de0e4e472f8de50f26",
    },
} as const;

/**
 * Modelo por defecto para cada modalidad.
 */
export const DEFAULT_MODELS = {
    TEXT: REPLICATE_MODELS.TEXT.CLAUDE_DEFAULT,
    IMAGE: REPLICATE_MODELS.IMAGE.FLUX_DEV,
    VIDEO: REPLICATE_MODELS.VIDEO.LUMA_RAY,
    AVATAR: REPLICATE_MODELS.AVATAR.LIVE_PORTRAIT,
} as const;

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR";
