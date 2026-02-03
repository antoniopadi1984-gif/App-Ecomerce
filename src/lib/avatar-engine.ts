export const AVATAR_MODELS = {
    LIVE_PORTRAIT: "lucataco/live-portrait:563a3d6a", // Fast & realistic
    SAD_TALKER: "vinthony/sad-talker:3aa3adc9", // Classic lip-sync
    WAV2LIP: "devxpy/wav2lip:9aab57d0", // Legacy but robust
    SVD: "stability-ai/stable-video-diffusion:3f04631c", // Motion for recreations
    ANIMATE_DIFF: "guoyww/animatediff:ed085b30" // Physics-based motion
};

export type SimulationMode = "COLLAGEN" | "HAIR_GROWTH" | "WRINKLE_REDUCTION" | "BLOODSTREAM" | "PRODUCT_USAGE";

export class AvatarEngine {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Triggers a lip-sync task using an external model provider (Replicate/Modal)
     */
    async generateMotion(imageUrl: string, audioUrl: string, model: keyof typeof AVATAR_MODELS = "LIVE_PORTRAIT") {
        console.log(`[AvatarEngine] Triggering ${model} for image: ${imageUrl}`);
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: AVATAR_MODELS[model],
                input: {
                    source_image: imageUrl,
                    driving_audio: audioUrl,
                    lip_zero: true,
                    eye_retargeting: true
                }
            })
        });

        const prediction = await response.json();
        return { success: true, predictionId: prediction.id, status: prediction.status };
    }

    /**
     * Scientific Simulation Engine
     */
    async generateScientificRecreation(mode: SimulationMode, targetImageUrl: string) {
        console.log(`[AvatarEngine] Triggering Scientific Simulation: ${mode}`);

        const prompts: Record<SimulationMode, string> = {
            COLLAGEN: "Zoom into skin texture showing collagen fibers thickening and glowing from blue to bright pink, hyper-realistic macro medical visualization",
            HAIR_GROWTH: "Timelaps of hair follicles growing rapidly from scalp, macro 8k realistic cinematic lighting",
            WRINKLE_REDUCTION: "Skin smoothing effect on face under professional light, wrinkles disappearing, high precision dermatology scan look",
            BLOODSTREAM: "Camera travel inside a human artery with red blood cells and nutrient molecules, glowing medicine effect, 3d render",
            PRODUCT_USAGE: "Close up of hands holding a product and applying it with glowing aura of effectiveness"
        };

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: AVATAR_MODELS.SVD,
                input: {
                    input_image: targetImageUrl,
                    video_length: "25_frames_with_svd_xt",
                    motion_bucket_id: 127,
                    fps: 24,
                    prompt: prompts[mode]
                }
            })
        });

        return await response.json();
    }

    async getStatus(predictionId: string) {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${this.apiKey}`,
            }
        });
        return response.json();
    }
}
