
import { GeminiProvider } from "./providers/gemini";
import { ReplicateProvider } from "./providers/replicate";
import { AIProvider, TaskType } from "./providers/interfaces";

export type BudgetMode = "ECONOMY" | "BALANCED" | "BEST";

const gemini = new GeminiProvider();
const replicate = new ReplicateProvider();

// Mock registry state. In real app, this syncs with DB or periodic checks.
class ModelRegistry {
    private providers: AIProvider[] = [gemini, replicate];

    // Maps specific tasks/modes to specific model IDs
    // This could be dynamic from DB
    private routingTable: Record<string, Record<BudgetMode, string>> = {
        [TaskType.RESEARCH_DEEP]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-pro",
            BEST: "gemini-2.0-pro"
        },
        [TaskType.RESEARCH_FORENSIC]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "anthropic/claude-3.7-sonnet",
            BEST: "anthropic/claude-3.7-sonnet"
        },
        [TaskType.RESEARCH_FAST]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-flash",
            BEST: "gemini-2.0-flash"
        },
        [TaskType.VISION_PRODUCT]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-pro",
            BEST: "gemini-2.0-pro"
        },
        [TaskType.COPY_LONGFORM]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-pro",
            BEST: "gemini-2.0-pro"
        },
        [TaskType.COPYWRITING_DEEP]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "anthropic/claude-3.7-sonnet",
            BEST: "anthropic/claude-3.7-sonnet"
        },
        [TaskType.COPYWRITING_PAGES]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "anthropic/claude-3.7-sonnet",
            BEST: "anthropic/claude-3.7-sonnet"
        },
        [TaskType.SCRIPTS_ADVANCED]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "anthropic/claude-3.7-sonnet",
            BEST: "anthropic/claude-3.7-sonnet"
        },
        [TaskType.CRO_AUDIT]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "anthropic/claude-3.7-sonnet",
            BEST: "anthropic/claude-3.7-sonnet"
        },
        [TaskType.COPY_SHORT]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-flash",
            BEST: "gemini-2.0-pro"
        },
        [TaskType.SCRIPT_VIDEO]: {
            ECONOMY: "gemini-2.0-flash",
            BALANCED: "gemini-2.0-pro",
            BEST: "gemini-2.0-pro"
        },
        [TaskType.IMAGE_ASSETS]: {
            ECONOMY: "black-forest-labs/flux-schnell",
            BALANCED: "black-forest-labs/flux-pro",
            BEST: "black-forest-labs/flux-1.1-pro"
        },
        [TaskType.VIDEO_GENERATION]: {
            ECONOMY: "minimax/video-01",
            BALANCED: "luma/ray-v2",
            BEST: "luma/ray-v2"
        },
        [TaskType.EMBEDDINGS_MEMORY]: {
            ECONOMY: "text-embedding-004",
            BALANCED: "text-embedding-004",
            BEST: "text-embedding-004"
        }
    };

    async selectModel(task: TaskType, mode: BudgetMode): Promise<{ provider: AIProvider, modelId: string }> {
        const modelId = this.routingTable[task]?.[mode] || "gemini-2.0-flash";

        // Logic to select provider based on modelId prefix or specific known models
        if (modelId.includes("/") || modelId.includes("claude") || modelId.includes("flux") || modelId.includes("luma")) {
            return { provider: replicate, modelId };
        }

        return { provider: gemini, modelId };
    }
}

export const modelRegistry = new ModelRegistry();
