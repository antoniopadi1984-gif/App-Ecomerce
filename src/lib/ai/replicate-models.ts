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
        CLAUDE_DEFAULT: "anthropic/claude-3.7-sonnet",
        CLAUDE_SONNET: "anthropic/claude-3-sonnet",
        CLAUDE_OPUS: "anthropic/claude-3-opus",
    },

    // ============================================
    // IMAGE (Flux, Ideogram, Recraft via Replicate)
    // ============================================
    IMAGE: {
        FLUX_DEV: "black-forest-labs/flux-dev",
        FLUX_SCHNELL: "black-forest-labs/flux-schnell",
        FLUX_PRO: "black-forest-labs/flux-pro",
        FLUX_KONTEXT_PRO: "black-forest-labs/flux-kontext-pro",
        IDEOGRAM_V3: "ideogram-ai/ideogram-v3",
        IDEOGRAM_V3_TURBO: "ideogram-ai/ideogram-v3-turbo",
        RECRAFT_SVG: "recraft-ai/recraft-v3-svg",
        FLUX_FILL_PRO: "black-forest-labs/flux-fill-pro",
        CODEFORMER: "sczhou/codeformer",
    },

    // ============================================
    // VIDEO (Kling, Luma, MiniMax via Replicate)
    // ============================================
    VIDEO: {
        KLING_V2: "kwaivgi/kling-v2-6",
        LUMA_RAY: "luma/ray-v2",
        MINIMAX: "minimax/video-01",
        VIDEO_UPSCALE: "topazlabs/video-upscale",
    },

    // ============================================
    // AVATAR / LIPSYNC (via Replicate)
    // ============================================
    AVATAR: {
        OMNI_HUMAN: "bytedance/omni-human",
        LIPSYNC_2_PRO: "sync/lipsync-2-pro",
        LIVE_PORTRAIT: "fofr/live-portrait:89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11",
    },

    // ============================================
    // EDITING & CLEANING (Inpainting via Replicate)
    // ============================================
    CLEANING: {
        IMAGE_INPAINT: "black-forest-labs/flux-fill-pro",
        VIDEO_INPAINT: "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        AUDIO_SEPARATION: "lucataco/demucs:cd886ca495f24f5a63901b09b0b462f83134934bd4804369a47b198889bc7084",
        METADATA_STRIPPER: "metadata-stripper" // Placeholder if internal
    }

} as const;

/**
 * Modelo por defecto para cada modalidad.
 */
export const DEFAULT_MODELS = {
    TEXT: REPLICATE_MODELS.TEXT.CLAUDE_DEFAULT,
    IMAGE: REPLICATE_MODELS.IMAGE.FLUX_DEV,
    VIDEO: REPLICATE_MODELS.VIDEO.KLING_V2,
    AVATAR: REPLICATE_MODELS.AVATAR.OMNI_HUMAN,
} as const;

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR";
