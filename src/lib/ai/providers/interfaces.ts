
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
    RESEARCH_FORENSIC = "RESEARCH_FORENSIC",
    VIDEO_DISSECTION = "VIDEO_DISSECTION"
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
    images: string[]; // Base64 or URLs
    temperature?: number;
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
    // invokeImage/invokeVideo can be added as needed or throws 501
}
