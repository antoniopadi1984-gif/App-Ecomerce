/**
 * Model Registry for Creative Generation
 * Single source of truth for (type, tier) => model mapping.
 */

export type CreativeType = 'STATIC_AD' | 'IMAGE_TO_VIDEO' | 'AVATAR_LIPSYNC' | 'COPYWRITING' | 'LIP_SYNC' | 'VIDEO_TRANSLATION' | 'WATERMARK_REMOVAL' | 'CLONING_FAMOUS' | 'AVATAR_PORTRAIT' | 'MUSIC_GEN' | 'SOUND_EFFECTS' | 'TRANSCRIPTION';
export type CreativeTier = 'cheap' | 'balanced' | 'premium';

export interface ModelRef {
    mode: 'model' | 'deployment';
    ref: string;
    version?: string;
    estimatedCost?: number; // Cost estimate per run in EUR/USD
}

export const MODEL_REGISTRY: Record<CreativeType, Record<CreativeTier, ModelRef>> = {
    STATIC_AD: {
        cheap: { mode: 'model', ref: 'black-forest-labs/flux-schnell', estimatedCost: 0.01 },
        balanced: { mode: 'model', ref: 'google/gemini-3.1-flash-image', estimatedCost: 0.03 },
        premium: { mode: 'model', ref: 'google/gemini-3.1-flash-image', estimatedCost: 0.05 }
    },
    IMAGE_TO_VIDEO: {
        cheap: { mode: 'model', ref: 'kwaivgi/kling-v1.6-standard', estimatedCost: 0.10 },
        balanced: { mode: 'model', ref: 'google/veo-3.1', estimatedCost: 0.30 },
        premium: { mode: 'model', ref: 'google/veo-3.1', estimatedCost: 0.50 }
    },
    AVATAR_LIPSYNC: {
        cheap: { mode: 'model', ref: 'fofr/live-portrait', version: '89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11', estimatedCost: 0.05 },
        balanced: { mode: 'model', ref: 'bytedance/omni-human', estimatedCost: 0.15 },
        premium: { mode: 'model', ref: 'bytedance/omni-human', estimatedCost: 0.30 }
    },
    LIP_SYNC: {
        cheap: { mode: 'model', ref: 'fofr/live-portrait', estimatedCost: 0.05 },
        balanced: { mode: 'model', ref: 'lucataco/wav2lip', estimatedCost: 0.10 },
        premium: { mode: 'model', ref: 'synclabs/lip-sync', estimatedCost: 0.50 }
    },
    VIDEO_TRANSLATION: {
        cheap: { mode: 'model', ref: 'openai/whisper', estimatedCost: 0.01 },
        balanced: { mode: 'model', ref: 'elevenlabs/dubbing', estimatedCost: 0.50 },
        premium: { mode: 'model', ref: 'heygen/translation', estimatedCost: 2.00 }
    },
    WATERMARK_REMOVAL: {
        cheap: { mode: 'model', ref: 'tencentarc/gfpgan', estimatedCost: 0.02 },
        balanced: { mode: 'model', ref: 'brushnet/cleaner', estimatedCost: 0.05 },
        premium: { mode: 'model', ref: 'adobe/firefly-video', estimatedCost: 0.20 }
    },
    CLONING_FAMOUS: {
        cheap: { mode: 'model', ref: 'stability-ai/stable-diffusion-v1-5', estimatedCost: 0.01 },
        balanced: { mode: 'model', ref: 'stability-ai/svd', estimatedCost: 0.10 },
        premium: { mode: 'model', ref: 'black-forest-labs/flux-pro', estimatedCost: 0.50 }
    },
    COPYWRITING: {
        cheap: { mode: 'model', ref: 'google/gemini-3.1-flash-lite-preview', estimatedCost: 0.005 },
        balanced: { mode: 'model', ref: 'google/gemini-3.1-flash-lite-preview', estimatedCost: 0.01 },
        premium: { mode: 'model', ref: 'google/gemini-3.1-pro-preview', estimatedCost: 0.10 }
    },
    AVATAR_PORTRAIT: {
        cheap: { mode: 'model', ref: 'black-forest-labs/flux-schnell', estimatedCost: 0.01 },
        balanced: { mode: 'model', ref: 'google/gemini-3.1-flash-image', estimatedCost: 0.03 },
        premium: { mode: 'model', ref: 'google/gemini-3.1-flash-image', estimatedCost: 0.08 }
    },
    MUSIC_GEN: {
        cheap: { mode: 'model', ref: 'google/lyria-002', estimatedCost: 0.05 },
        balanced: { mode: 'model', ref: 'google/lyria-002', estimatedCost: 0.10 },
        premium: { mode: 'model', ref: 'elevenlabs/music', estimatedCost: 0.30 }
    },
    SOUND_EFFECTS: {
        cheap: { mode: 'model', ref: 'elevenlabs/sound-generation', estimatedCost: 0.05 },
        balanced: { mode: 'model', ref: 'elevenlabs/sound-generation', estimatedCost: 0.05 },
        premium: { mode: 'model', ref: 'elevenlabs/sound-generation', estimatedCost: 0.10 }
    },
    TRANSCRIPTION: {
        cheap: { mode: 'model', ref: 'openai/whisper', estimatedCost: 0.01 },
        balanced: { mode: 'model', ref: 'elevenlabs/scribe-v2', estimatedCost: 0.05 },
        premium: { mode: 'model', ref: 'elevenlabs/scribe-v2', estimatedCost: 0.10 }
    }
};

/**
 * Resolves the appropriate model reference for a given type and tier.
 */
export function resolveModel(type: CreativeType, tier: CreativeTier): ModelRef {
    const category = MODEL_REGISTRY[type];
    if (!category) throw new Error(`Unknown creative type: ${type}`);

    const model = category[tier];
    if (!model) throw new Error(`Model tier '${tier}' not found for type '${type}'. Fallback blocked by strict verification policy.`);

    return model;
}
