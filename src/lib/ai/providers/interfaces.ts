
export enum TaskType {
    RESEARCH_DEEP = "RESEARCH_DEEP",
    RESEARCH_FAST = "RESEARCH_FAST",
    VISION_PRODUCT = "VISION_PRODUCT",
    COPY_LONGFORM = "COPY_LONGFORM",
    COPY_SHORT = "COPY_SHORT",
    SCRIPT_VIDEO = "SCRIPT_VIDEO",
    IMAGE_ASSETS = "IMAGE_ASSETS",
    VIDEO_GENERATION = "VIDEO_GENERATION",
    EMBEDDINGS_MEMORY = "EMBEDDINGS_MEMORY",
    COPYWRITING_DEEP = "COPYWRITING_DEEP",
    COPYWRITING_PAGES = "COPYWRITING_PAGES",
    COPYWRITING_ADS = "COPYWRITING_ADS",
    SCRIPTS_ADVANCED = "SCRIPTS_ADVANCED",
    CRO_AUDIT = "CRO_AUDIT",
    CREATIVE_FORENSIC = "CREATIVE_FORENSIC",
    RESEARCH_FORENSIC = "RESEARCH_FORENSIC",
    VIDEO_DISSECTION = "VIDEO_DISSECTION",
    DIRECTOR_STRATEGY = "DIRECTOR_STRATEGY",
    CREATIVE_CONCEPTS = "CREATIVE_CONCEPTS",
    ASSETS_CURATOR = "ASSETS_CURATOR",
    COMPETITOR_SPY = "COMPETITOR_SPY",
    PERFORMANCE_ADS = "PERFORMANCE_ADS",
    MEDIA_CLEANING = "MEDIA_CLEANING"
}

export interface TextOptions {
    model: string;
    prompt: string;
    systemPrompt?: string;
    jsonSchema?: any;
    temperature?: number;
    maxTokens?: number;
}

export interface VisionOptions {
    model: string;
    prompt: string;
    images?: string[]; // Base64 or URLs
    video?: string;   // Base64
    videoMimeType?: string;
    temperature?: number;
}

export interface ImageOptions {
    model: string;
    prompt: string;
    aspectRatio?: "16:9" | "9:16" | "1:1";
    negativePrompt?: string;
    numImages?: number;
}

export interface VideoOptions {
    model: string;
    prompt: string;
    duration?: string; // e.g. "10s"
    aspectRatio?: "16:9" | "9:16" | "1:1";
    fps?: number;
}

export interface MusicOptions {
    model: string;
    prompt: string;
    duration?: number; // seconds
}

export interface AIResponse {
    text: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        costEur: number;
    };
    raw?: any;
}

export interface AIProvider {
    name: string;
    capabilities: ("TEXT" | "VISION" | "IMAGE" | "VIDEO" | "EMBEDDINGS")[];

    getModels(): Promise<string[]>;
    invokeText(options: TextOptions): Promise<AIResponse>;
    invokeVision(options: VisionOptions): Promise<AIResponse>;
    invokeImage(options: ImageOptions): Promise<AIResponse>;
    invokeVideo(options: VideoOptions): Promise<AIResponse>;
    invokeMusic(options: MusicOptions): Promise<AIResponse>;
}
