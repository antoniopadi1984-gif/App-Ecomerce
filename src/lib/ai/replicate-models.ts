export const REPLICATE_MODELS = {
    TEXT: {
        CLAUDE_SONNET: "anthropic/claude-sonnet-4-6",
        CLAUDE_OPUS: "anthropic/claude-opus-4-6",
    },
    IMAGE: {
        // Flux — Replicate
        FLUX_SCHNELL: "black-forest-labs/flux-schnell",           // rápido, barato
        FLUX_DEV: "black-forest-labs/flux-dev",                   // equilibrado
        FLUX_PRO: "black-forest-labs/flux-2-pro",                 // calidad alta
        FLUX_KONTEXT_PRO: "black-forest-labs/flux-kontext-pro",   // edición con referencia
        FLUX_FILL_PRO: "black-forest-labs/flux-fill-pro",         // inpainting
        // Ideogram — Replicate (JSON prompt nativo, mejor para texto en imagen)
        IDEOGRAM_V3: "ideogram-ai/ideogram-v3",
        IDEOGRAM_V3_TURBO: "ideogram-ai/ideogram-v3-turbo",
        // Recraft — Replicate
        RECRAFT_SVG: "recraft-ai/recraft-v3-svg",
        RECRAFT_UPSCALE: "recraft-ai/recraft-crisp-upscale",
        // Google — Vertex AI (requiere ImageGenerator class)
        IMAGEN_3: "vertex:imagen-3.0-generate-001",               // Nano Banana = Imagen 3
        IMAGEN_3_FAST: "vertex:imagen-3.0-fast-generate-001",     // Nano Banana 2 (fast)
        GEMINI_FLASH_IMAGE: "vertex:gemini-3.1-flash-image",      // Gemini imagen nativo
    },
    VIDEO: {
        // Kling — Replicate
        KLING_V3: "kwaivgi/kling-v3-video",
        KLING_V3_OMNI: "kwaivgi/kling-v3-omni-video",
        KLING_O1: "kwaivgi/kling-o1",
        KLING_V2: "kwaivgi/kling-v2-6",
        // Google — Vertex AI
        VEO_3: "vertex:veo-3.0-generate-preview",                 // Veo 3
        VEO_3_FAST: "vertex:veo-3.0-fast-generate-preview",       // Veo 3 Fast
        // Luma — Replicate
        LUMA_RAY: "luma/ray-v2",
        // MiniMax — Replicate
        MINIMAX: "minimax/video-01",
        // Upscale
        VIDEO_UPSCALE: "topazlabs/video-upscale",
    },
    AVATAR: {
        OMNI_HUMAN: "bytedance/omni-human-1-5",
        LIPSYNC_2_PRO: "sync/lipsync-2-pro",
        LIVE_PORTRAIT: "fofr/live-portrait:89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11",
    },
    CLEANING: {
        IMAGE_INPAINT: "black-forest-labs/flux-fill-pro",
        VIDEO_INPAINT: "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        AUDIO_SEPARATION: "lucataco/demucs:cd886ca495f24f5a63901b09b0b462f83134934bd4804369a47b198889bc7084",
        REMOVE_BG: "lucataco/remove-bg",
        CODEFORMER: "sczhou/codeformer",
    }
} as const;

// Tier mapping — qué modelo usar por calidad y tipo
export const MODEL_TIERS = {
    IMAGE: {
        fast:    REPLICATE_MODELS.IMAGE.FLUX_SCHNELL,
        balanced: REPLICATE_MODELS.IMAGE.FLUX_DEV,
        quality: REPLICATE_MODELS.IMAGE.FLUX_PRO,
        premium: REPLICATE_MODELS.IMAGE.IMAGEN_3,        // Nano Banana
        edit:    REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO,
        text:    REPLICATE_MODELS.IMAGE.IDEOGRAM_V3,     // mejor para texto en imagen
        svg:     REPLICATE_MODELS.IMAGE.RECRAFT_SVG,
    },
    VIDEO: {
        fast:    REPLICATE_MODELS.VIDEO.KLING_V2,
        balanced: REPLICATE_MODELS.VIDEO.KLING_V3,
        premium: REPLICATE_MODELS.VIDEO.VEO_3,           // Veo 3
        omni:    REPLICATE_MODELS.VIDEO.KLING_V3_OMNI,
    }
} as const;

/**
 * DEFAULT_MODELS y Modality se mantienen por compatibilidad con el resto de la app (ej. AI Gateway).
 * Se mapean a los nuevos modelos de MODEL_TIERS.
 */
export const DEFAULT_MODELS = {
    TEXT: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
    IMAGE: MODEL_TIERS.IMAGE.balanced,
    VIDEO: MODEL_TIERS.VIDEO.balanced,
    AVATAR: REPLICATE_MODELS.AVATAR.OMNI_HUMAN,
} as const;

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR";
