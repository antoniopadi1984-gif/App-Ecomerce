/**
 * REPLICATE MODELS REGISTRY — EcomBoom
 * Modelos oficiales (always on, sin hash requerido)
 * + Modelos con hash verificado
 * Marzo 2026
 */

export const REPLICATE_MODELS = {

    // ── IMAGEN ──────────────────────────────────────────────────────────────
    IMAGE: {
        // Flux — generación oficial
        FLUX_SCHNELL:       "black-forest-labs/flux-schnell",           // ✅ oficial, rápido
        FLUX_DEV:           "black-forest-labs/flux-dev",               // ✅ oficial
        FLUX_PRO:           "black-forest-labs/flux-1.1-pro",          // ✅ oficial
        FLUX_KONTEXT:       "black-forest-labs/flux-kontext-pro",      // ✅ oficial, i2i
        FLUX_KONTEXT_PRO:   "black-forest-labs/flux-kontext-pro",      // alias legacy
        FLUX_FILL:          "black-forest-labs/flux-fill-pro",         // ✅ oficial, inpaint

        // Ideogram — texto en imagen
        IDEOGRAM_V3:        "ideogram-ai/ideogram-v3",                 // ✅ oficial
        IDEOGRAM_V3_TURBO:  "ideogram-ai/ideogram-v3-turbo",          // ✅ oficial

        // Recraft
        RECRAFT_V3:         "recraft-ai/recraft-v3",                   // ✅ oficial
        RECRAFT_SVG:        "recraft-ai/recraft-v3-svg",              // ✅ oficial

        // Google
        IMAGEN_3:           "google/imagen-3",                         // ✅ oficial

        // Upscale / restauración
        REAL_ESRGAN:        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee2d0e4b67e1fb967b9b3",
        CODEFORMER:         "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
        IMAGE_INPAINT:      "black-forest-labs/flux-fill-pro",        // alias legacy
    },

    // ── VIDEO GENERATIVO ────────────────────────────────────────────────────
    VIDEO: {
        // Kling — oficial
        KLING_V2:           "kwaivgi/kling-v2-6",                     // ✅ oficial i2v
        KLING_V3:           "kwaivgi/kling-v3-video",                 // ✅ oficial
        KLING_V3_OMNI:      "kwaivgi/kling-v3-omni-video",           // ✅ oficial
        KLING_O1:           "kwaivgi/kling-o1",                       // ✅ oficial
        KLING_LIPSYNC:      "kwaivgi/kling-lip-sync",                 // ✅ oficial lipsync

        // Minimax / Hailuo — oficial
        MINIMAX:            "minimax/video-01",                        // ✅ oficial
        MINIMAX_LIVE:       "minimax/video-01-live",                  // ✅ oficial

        // Wan — oficial
        WAN_I2V:            "wan-ai/wan-2.2-s2v",                    // ✅ oficial i2v+audio

        // Veo — via Vertex AI
        VEO_3:              "vertex:veo-3.0-generate-preview",
        VEO_3_FAST:         "vertex:veo-3.0-fast-generate-preview",

        // Post-producción
        VIDEO_UPSCALE:      "topazlabs/video-upscale",                // ✅ oficial
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
    },

    // ── AVATAR / LIPSYNC ────────────────────────────────────────────────────
    AVATAR: {
        // Lipsync oficial
        LIPSYNC_2_PRO:      "sync/lipsync-2-pro",                    // ✅ VERIFICADO
        LIPSYNC_2:          "sync/lipsync-2",                        // ✅ oficial, más rápido
        KLING_LIPSYNC:      "kwaivgi/kling-lip-sync",               // ✅ oficial
        LATENTSYNC:         "latentlabs/latentsync",                 // ✅ oficial

        // Avatar hablante
        OMNI_HUMAN:         "bytedance/omni-human-1-5",             // ✅ oficial
        PIXVERSE_LIPSYNC:   "pixverse-ai/lipsync",                  // ✅ oficial

        // Animación portrait
        LIVE_PORTRAIT:      "fofr/live-portrait:067dd98cc416e14c34b01f47aa2ab1a8ffe7d4d0f7ebc4e884d3e80a30c3e843",

        // Multi-persona
        MULTITALK:          "zsxkib/multitalk",                      // conversational lipsync
    },

    // ── AUDIO ───────────────────────────────────────────────────────────────
    AUDIO: {
        // Transcripción
        WHISPER:            "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
        WHISPER_FAST:       "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",

        // Música
        MUSICGEN:           "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcbe5d87a576cb6833da7789fb0ad7bc3",

        // TTS alternativo
        MINIMAX_TTS:        "minimax/speech-02-turbo",               // ✅ oficial multilingual
        INWORLD_TTS:        "inworld/tts-1.5-mini",                 // ✅ oficial

        // Separación audio
        DEMUCS:             "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",
    },

    // ── TEXTO ────────────────────────────────────────────────────────────────
    TEXT: {
        CLAUDE_DEFAULT:     "anthropic/claude-sonnet-4-6",           // ✅ oficial
        CLAUDE_OPUS:        "anthropic/claude-opus-4-6",             // ✅ oficial
        CLAUDE_SONNET:      "anthropic/claude-sonnet-4-6",           // ✅ oficial
    },

    // ── CLEANING ─────────────────────────────────────────────────────────────
    CLEANING: {
        AUDIO_SEPARATION:   "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        IMAGE_UPSCALE:      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee2d0e4b67e1fb967b9b3",
        IMAGE_INPAINT:      "black-forest-labs/flux-fill-pro",
    },
};

// ── TIERS POR CASO DE USO ──────────────────────────────────────────────────
export const MODEL_TIERS = {
    IMAGE: {
        fast:     REPLICATE_MODELS.IMAGE.FLUX_SCHNELL,
        balanced: REPLICATE_MODELS.IMAGE.FLUX_DEV,
        premium:  REPLICATE_MODELS.IMAGE.FLUX_PRO,
        kontext:  REPLICATE_MODELS.IMAGE.FLUX_KONTEXT,
    },
    VIDEO: {
        fast:     REPLICATE_MODELS.VIDEO.KLING_V2,
        balanced: REPLICATE_MODELS.VIDEO.KLING_V3,
        premium:  REPLICATE_MODELS.VIDEO.VEO_3,
        omni:     REPLICATE_MODELS.VIDEO.KLING_V3_OMNI,
        lipsync:  REPLICATE_MODELS.VIDEO.KLING_LIPSYNC,
    },
    AVATAR: {
        fast:     REPLICATE_MODELS.AVATAR.LIPSYNC_2,
        balanced: REPLICATE_MODELS.AVATAR.LIPSYNC_2_PRO,
        premium:  REPLICATE_MODELS.AVATAR.OMNI_HUMAN,
        portrait: REPLICATE_MODELS.AVATAR.LIVE_PORTRAIT,
        kling:    REPLICATE_MODELS.AVATAR.KLING_LIPSYNC,
    },
    AUDIO: {
        transcribe: REPLICATE_MODELS.AUDIO.WHISPER_FAST,
        music:      REPLICATE_MODELS.AUDIO.MUSICGEN,
        tts:        REPLICATE_MODELS.AUDIO.MINIMAX_TTS,
        separate:   REPLICATE_MODELS.AUDIO.DEMUCS,
    },
};

export const DEFAULT_MODELS = {
    IMAGE:  MODEL_TIERS.IMAGE.balanced,
    VIDEO:  MODEL_TIERS.VIDEO.balanced,
    AVATAR: MODEL_TIERS.AVATAR.balanced,
};

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR" | "AUDIO";
