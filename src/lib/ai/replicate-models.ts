/**
 * REPLICATE MODELS REGISTRY — EcomBoom
 * Hashes verificados desde replicate.com
 * Última actualización: Marzo 2026
 */

export const REPLICATE_MODELS = {

    // ── IMAGEN ──────────────────────────────────────────────────────────────
    IMAGE: {
        // Flux — generación de imágenes
        FLUX_SCHNELL:       "black-forest-labs/flux-schnell",                    // rápido, económico ✅ VERIFICADO
        FLUX_DEV:           "black-forest-labs/flux-dev",                        // calidad/control
        FLUX_PRO:           "black-forest-labs/flux-1.1-pro",                   // máxima calidad
        FLUX_KONTEXT:       "black-forest-labs/flux-kontext-pro",               // image-to-image
        FLUX_FILL:          "black-forest-labs/flux-fill-pro",                  // inpainting

        // Ideogram — texto en imagen
        IDEOGRAM_V3:        "ideogram-ai/ideogram-v3",
        IDEOGRAM_V3_TURBO:  "ideogram-ai/ideogram-v3-turbo",

        // Recraft — estilo/vectorial
        RECRAFT_V3:         "recraft-ai/recraft-v3",
        RECRAFT_SVG:        "recraft-ai/recraft-v3-svg",

        // Upscale imagen
        REAL_ESRGAN:        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee2d0e4b67e1fb967b9b3",
        CLARITY_UPSCALE:    "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
        CODEFORMER:         "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
    },

    // ── VIDEO GENERATIVO ────────────────────────────────────────────────────
    VIDEO: {
        // Kling — text/image to video
        KLING_V2:           "kwaivgi/kling-v2-6",
        KLING_V3:           "kwaivgi/kling-v3-video",
        KLING_V3_OMNI:      "kwaivgi/kling-v3-omni-video",
        KLING_O1:           "kwaivgi/kling-o1",

        // Alternativas video
        MINIMAX:            "minimax/video-01",
        LTX_VIDEO:          "lightricks/ltx-video-0-9-7",
        WAN_I2V:            "wavespeedai/wan-2-1-i2v",

        // Veo 3 — via Vertex AI (no Replicate)
        VEO_3:              "vertex:veo-3.0-generate-preview",
        VEO_3_FAST:         "vertex:veo-3.0-fast-generate-preview",

        // Post-producción video
        VIDEO_UPSCALE:      "topazlabs/video-upscale",
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
    },

    // ── AVATAR / LIPSYNC ────────────────────────────────────────────────────
    AVATAR: {
        // Lipsync — sincronización labios con audio
        LIPSYNC_2_PRO:      "sync/lipsync-2-pro",                               // ✅ VERIFICADO

        // OmniHuman — avatar hablante con audio
        OMNI_HUMAN:         "bytedance/omni-human-1-5",

        // Live Portrait — animar foto fija
        LIVE_PORTRAIT:      "fofr/live-portrait:067dd98cc"  ,

        // Hedra — avatar hablante premium
        HEDRA:              "hedra-ai/character-2",

        // LatentSync — lipsync alternativo
        LATENTSYNC:         "tmappdev/latentsync",
    },

    // ── AUDIO ───────────────────────────────────────────────────────────────
    AUDIO: {
        // Transcripción
        WHISPER:            "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
        WHISPER_FAST:       "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",

        // Música generativa
        MUSICGEN:           "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcbe5d87a576cb6833da7789fb0ad7bc3",
        MUSICGEN_LARGE:     "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",

        // Separación de audio
        DEMUCS:             "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",

        // Voz alternativa (TTS)
        XTTS_V2:            "lucataco/xtts-v2:daff3f45af9fd58cff7ffd38a68831d2d45c5ec2e73c76cfed1af3f8bb3a8b83",
    },

    // ── TEXTO / LLM ─────────────────────────────────────────────────────────
    TEXT: {
        CLAUDE_DEFAULT:     "anthropic/claude-sonnet-4-6",
        CLAUDE_OPUS:        "anthropic/claude-opus-4-6",
        CLAUDE_SONNET:      "anthropic/claude-sonnet-4-6",
    },

    // ── CLEANING ─────────────────────────────────────────────────────────────
    CLEANING: {
        AUDIO_SEPARATION:   "lucataco/demucs:b76be2735c6c36e33e291b12fd6ee2ae71b0e28e5e7e36702c97e7c5b32e2c61",
        VIDEO_INPAINT:      "lucataco/propainter:5300f80bc41d222272e5111ba0b30ee80287413a216856525166299d63f03a61",
        IMAGE_UPSCALE:      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee2d0e4b67e1fb967b9b3",
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
        minimax:  REPLICATE_MODELS.VIDEO.MINIMAX,
    },
    AVATAR: {
        fast:     REPLICATE_MODELS.AVATAR.LIPSYNC_2_PRO,
        balanced: REPLICATE_MODELS.AVATAR.OMNI_HUMAN,
        premium:  REPLICATE_MODELS.AVATAR.HEDRA,
        portrait: REPLICATE_MODELS.AVATAR.LIVE_PORTRAIT,
    },
    AUDIO: {
        transcribe: REPLICATE_MODELS.AUDIO.WHISPER_FAST,
        music:      REPLICATE_MODELS.AUDIO.MUSICGEN,
        separate:   REPLICATE_MODELS.AUDIO.DEMUCS,
    },
};

// ── DEFAULTS POR MÓDULO ────────────────────────────────────────────────────
export const DEFAULT_MODELS = {
    IMAGE:  MODEL_TIERS.IMAGE.balanced,
    VIDEO:  MODEL_TIERS.VIDEO.balanced,
    AVATAR: MODEL_TIERS.AVATAR.balanced,
};

export type Modality = "TEXT" | "IMAGE" | "VIDEO" | "AVATAR" | "AUDIO";

// ── ALIASES DE COMPATIBILIDAD (no eliminar) ───────────────────────────────
// Mantener referencias legacy que usa el código existente
export const REPLICATE_MODELS_COMPAT = {
    IMAGE: {
        ...REPLICATE_MODELS.IMAGE,
        FLUX_KONTEXT_PRO: REPLICATE_MODELS.IMAGE.FLUX_KONTEXT,  // alias
        IMAGE_INPAINT:    REPLICATE_MODELS.IMAGE.FLUX_FILL,     // alias
    },
    CLEANING: {
        ...REPLICATE_MODELS.CLEANING,
        IMAGE_INPAINT: REPLICATE_MODELS.CLEANING.VIDEO_INPAINT, // alias
    }
};

// Patch REPLICATE_MODELS para compatibilidad total
(REPLICATE_MODELS.IMAGE as any).FLUX_KONTEXT_PRO = REPLICATE_MODELS.IMAGE.FLUX_KONTEXT;
(REPLICATE_MODELS.CLEANING as any).IMAGE_INPAINT = REPLICATE_MODELS.CLEANING.VIDEO_INPAINT;
(REPLICATE_MODELS as any).DEFAULT_MODELS = DEFAULT_MODELS;
