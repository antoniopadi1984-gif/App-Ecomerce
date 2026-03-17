/**
 * REPLICATE MODELS REGISTRY — EcomBoom
 * Fuente: replicate.com/collections/official + verificación directa
 * Marzo 2026 — Modelos top por categoría con cascade de fallback
 */

export const REPLICATE_MODELS = {

    // ── IMAGEN ──────────────────────────────────────────────────────────────
    IMAGE: {
        // Flux — mejor calidad/velocidad para avatares y producto
        FLUX_PRO_ULTRA:     "black-forest-labs/flux-1.1-pro-ultra",  // máxima calidad
        FLUX_PRO:           "black-forest-labs/flux-1.1-pro",        // ✅ verificado
        FLUX_KONTEXT_MAX:   "black-forest-labs/flux-kontext-max",    // i2i máxima calidad
        FLUX_KONTEXT_PRO:   "black-forest-labs/flux-kontext-pro",    // ✅ i2i verificado
        FLUX_KONTEXT:       "black-forest-labs/flux-kontext-pro",    // alias
        FLUX_DEV:           "black-forest-labs/flux-dev",            // ✅ verificado
        FLUX_SCHNELL:       "black-forest-labs/flux-schnell",        // ✅ rápido/barato
        FLUX_FILL:          "black-forest-labs/flux-fill-pro",       // inpainting
        FLUX_FILL_PRO:      "black-forest-labs/flux-fill-pro",

        // Google
        IMAGEN_4:           "google/imagen-4",                       // último de Google
        IMAGEN_4_FAST:      "google/imagen-4-fast",
        IMAGEN_3:           "google/imagen-3",

        // Ideogram — mejor para texto en imagen
        IDEOGRAM_V3:        "ideogram-ai/ideogram-v3",               // ✅ verificado
        IDEOGRAM_V3_TURBO:  "ideogram-ai/ideogram-v3-turbo",        // ✅ rápido

        // Recraft — estilo y vectorial
        RECRAFT_V3:         "recraft-ai/recraft-v3",                 // ✅ verificado
        RECRAFT_V4:         "recraft-ai/recraft-v4",                 // más nuevo
        RECRAFT_SVG:        "recraft-ai/recraft-v3-svg",

        // Stability
        SD_35_LARGE:        "stability-ai/stable-diffusion-3.5-large", // ✅ verificado

        // Upscale
        TOPAZ_UPSCALE:      "topazlabs/image-upscale",
        REAL_ESRGAN:        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee2d0e4b67e1fb967b9b3",
        CODEFORMER:         "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",

        // Face restoration
        GFPGAN:             "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",

        // Background removal
        BG_REMOVE:          "851-labs/background-remover",

        // Alias legacy
        FLUX_KONTEXT_PRO_ALIAS: "black-forest-labs/flux-kontext-pro",
        IMAGE_INPAINT:      "black-forest-labs/flux-fill-pro",
    },

    // ── VIDEO GENERATIVO ────────────────────────────────────────────────────
    VIDEO: {
        // Runway — #1 en benchmarks 2026
        RUNWAY_GEN4:        "runway/gen4-turbo",
        RUNWAY_GEN3:        "runway/gen3a-turbo",                    // ✅ verificado

        // Kling — mejor i2v para avatares
        KLING_V3:           "kwaivgi/kling-v3",                     // ✅ verificado
        KLING_V3_OMNI:      "kwaivgi/kling-v3-omni-video",
        KLING_V2:           "kwaivgi/kling-v2.6",                   // ✅ verificado
        KLING_V21_PRO:      "kwaivgi/kling-v2.1-pro",
        KLING_MOTION:       "kwaivgi/kling-v2.6-motion-control",
        KLING_LIPSYNC:      "kwaivgi/kling-lip-sync",               // ✅ verificado
        KLING_O1:           "kwaivgi/kling-o1",

        // Minimax / Hailuo — buena calidad mid-tier
        HAILUO_23:          "minimax/hailuo-02",                    // ✅ verificado (hailuo-02)
        HAILUO_23_FAST:     "minimax/hailuo-02",
        MINIMAX_V01:        "minimax/video-01",                     // ✅ verificado

        // Wan — open source top 2026
        WAN_25_I2V:         "wan-video/wan-2.5-i2v",               // newest
        WAN_22_I2V:         "wan-ai/wan-2.2-s2v",                  // ✅ verificado
        WAN_22_I2V_FAST:    "wan-video/wan-2.2-i2v-fast",
        WAN_21_I2V:         "wan-ai/wan-2.1",                      // ✅ verificado
        WAN_T2V:            "wan-video/wan-2.5-t2v-fast",

        // Luma
        LUMA_DREAM:         "luma/dream-machine",                   // ✅ verificado

        // LTX — más rápido
        LTX_VIDEO:          "lightricks/ltx-video",                 // ✅ verificado

        // Veo — via Vertex AI (no Replicate)
        VEO_3:              "google/veo-3",                          // ✅ verificado Replicate
        VEO_3_FAST:         "google/veo-3-fast",                     // ✅ verificado Replicate
        VEO_2:              "google/veo-2",                          // ✅ verificado Replicate

        // Post-producción
        VIDEO_UPSCALE:      "topazlabs/video-upscale",              // ✅ verificado
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        LUMA_REFRAME:       "luma/reframe-video",
    },

    // ── AVATAR / LIPSYNC ────────────────────────────────────────────────────
    AVATAR: {
        // Kling LipSync — ✅ verificado, mejor calidad
        KLING_LIPSYNC:      "kwaivgi/kling-lip-sync",

        // Sync.so — studio grade
        LIPSYNC_2_PRO:      "sync/lipsync-2-pro",                  // ✅ verificado
        LIPSYNC_2:          "sync/lipsync-2",                      // ✅ verificado

        // LatentSync — open source
        LATENTSYNC:         "latentlabs/latentsync",               // ✅ verificado

        // Pixverse
        PIXVERSE_LIPSYNC:   "pixverse-ai/lipsync",                // ✅ verificado

        // Hedra — avatar hablante completo
        HEDRA_2:            "hedra-ai/character-2",               // ✅ verificado

        // OmniHuman — ByteDance
        OMNI_HUMAN:         "bytedance/omni-human-1-5",

        // Live Portrait — animar foto
        LIVE_PORTRAIT:      "fofr/live-portrait:067dd98cc416e14c34b01f47aa2ab1a8ffe7d4d0f7ebc4e884d3e80a30c3e843",

        // Face consistency
        INSTANT_ID:         "zsxkib/instant-id",
        PULID:              "zsxkib/pulid",
        PHOTOMAKER:         "tencentarc/photomaker",

        // Face swap
        FACE_SWAP:          "codeplugtech/face-swap",
        FACE_SWAP_2:        "yan-ops/face-swap",
    },

    // ── AUDIO ───────────────────────────────────────────────────────────────
    AUDIO: {
        // Transcripción
        WHISPER_FAST:       "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
        WHISPER:            "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
        WHISPERX:           "victor-upmeet/whisperx",

        // Música generativa
        MUSICGEN:           "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcbe5d87a576cb6833da7789fb0ad7bc3",
        MUSICGEN_LARGE:     "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
        MINIMAX_MUSIC:      "minimax/music-01",

        // TTS alternativo
        MINIMAX_TTS:        "minimax/speech-02-turbo",             // ✅ verificado, multilingual
        INWORLD_TTS:        "inworld/tts-1.5-mini",

        // Separación audio
        DEMUCS:             "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",
    },

    // ── TEXTO / LLM ──────────────────────────────────────────────────────────
    TEXT: {
        CLAUDE_SONNET:      "anthropic/claude-sonnet-4-6",
        CLAUDE_OPUS:        "anthropic/claude-opus-4-6",
        CLAUDE_DEFAULT:     "anthropic/claude-sonnet-4-6",
    },

    // ── CLEANING / POST ───────────────────────────────────────────────────────
    CLEANING: {
        AUDIO_SEPARATION:   "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        IMAGE_UPSCALE:      "topazlabs/image-upscale",
        IMAGE_INPAINT:      "black-forest-labs/flux-fill-pro",
        FACE_RESTORE:       "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
        BG_REMOVE:          "851-labs/background-remover",
    },
};

// ── CASCADES POR CASO DE USO ──────────────────────────────────────────────
export const VIDEO_CASCADE = {
    // Para generar video desde imagen de avatar (talking head)
    talking_head: [
        REPLICATE_MODELS.VIDEO.KLING_V3,
        REPLICATE_MODELS.VIDEO.KLING_V2,
        REPLICATE_MODELS.VIDEO.HAILUO_23,
        REPLICATE_MODELS.VIDEO.WAN_22_I2V,
        REPLICATE_MODELS.VIDEO.MINIMAX_V01,
        REPLICATE_MODELS.VIDEO.LTX_VIDEO,
    ],
    // Para demos de producto / b-roll cinematográfico
    product_demo: [
        REPLICATE_MODELS.VIDEO.KLING_V3,
        REPLICATE_MODELS.VIDEO.RUNWAY_GEN3,
        REPLICATE_MODELS.VIDEO.HAILUO_23,
        REPLICATE_MODELS.VIDEO.WAN_25_I2V,
        REPLICATE_MODELS.VIDEO.LUMA_DREAM,
    ],
    // Para b-roll genérico rápido
    broll: [
        REPLICATE_MODELS.VIDEO.WAN_22_I2V_FAST,
        REPLICATE_MODELS.VIDEO.LTX_VIDEO,
        REPLICATE_MODELS.VIDEO.KLING_V2,
        REPLICATE_MODELS.VIDEO.MINIMAX_V01,
    ],
    // Máxima calidad (premium)
    premium: [
        REPLICATE_MODELS.VIDEO.KLING_V3,
        REPLICATE_MODELS.VIDEO.RUNWAY_GEN4,
        REPLICATE_MODELS.VIDEO.HAILUO_23,
        REPLICATE_MODELS.VIDEO.WAN_25_I2V,
    ],
};

export const LIPSYNC_CASCADE = [
    REPLICATE_MODELS.AVATAR.KLING_LIPSYNC,   // ✅ mejor calidad verificado
    REPLICATE_MODELS.AVATAR.LIPSYNC_2_PRO,   // ✅ studio grade
    REPLICATE_MODELS.AVATAR.LIPSYNC_2,       // ✅ rápido
    REPLICATE_MODELS.AVATAR.LATENTSYNC,      // ✅ open source
    REPLICATE_MODELS.AVATAR.PIXVERSE_LIPSYNC,
];

export const IMAGE_CASCADE = {
    avatar: [
        REPLICATE_MODELS.IMAGE.FLUX_PRO,
        REPLICATE_MODELS.IMAGE.FLUX_DEV,
        REPLICATE_MODELS.IMAGE.IMAGEN_4,
        REPLICATE_MODELS.IMAGE.IDEOGRAM_V3,
        REPLICATE_MODELS.IMAGE.FLUX_SCHNELL,
    ],
    product: [
        REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_MAX,
        REPLICATE_MODELS.IMAGE.FLUX_KONTEXT_PRO,
        REPLICATE_MODELS.IMAGE.FLUX_PRO,
        REPLICATE_MODELS.IMAGE.IMAGEN_4,
    ],
    creative: [
        REPLICATE_MODELS.IMAGE.IDEOGRAM_V3,
        REPLICATE_MODELS.IMAGE.RECRAFT_V4,
        REPLICATE_MODELS.IMAGE.FLUX_PRO,
    ],
};

// ── TIERS POR BUDGET ──────────────────────────────────────────────────────
export const MODEL_TIERS = {
    IMAGE: {
        fast:     REPLICATE_MODELS.IMAGE.FLUX_SCHNELL,
        balanced: REPLICATE_MODELS.IMAGE.FLUX_DEV,
        premium:  REPLICATE_MODELS.IMAGE.FLUX_PRO,
        ultra:    REPLICATE_MODELS.IMAGE.FLUX_PRO_ULTRA,
    },
    VIDEO: {
        fast:     REPLICATE_MODELS.VIDEO.LTX_VIDEO,
        balanced: REPLICATE_MODELS.VIDEO.KLING_V2,
        premium:  REPLICATE_MODELS.VIDEO.KLING_V3,
        ultra:    REPLICATE_MODELS.VIDEO.RUNWAY_GEN4,
    },
    AVATAR: {
        fast:     REPLICATE_MODELS.AVATAR.LIPSYNC_2,
        balanced: REPLICATE_MODELS.AVATAR.KLING_LIPSYNC,
        premium:  REPLICATE_MODELS.AVATAR.LIPSYNC_2_PRO,
        ultra:    REPLICATE_MODELS.AVATAR.HEDRA_2,
    },
};

export const DEFAULT_MODELS = {
    IMAGE:  MODEL_TIERS.IMAGE.balanced,
    VIDEO:  MODEL_TIERS.VIDEO.balanced,
    AVATAR: MODEL_TIERS.AVATAR.balanced,
};

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR" | "AUDIO";
