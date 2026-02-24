import { prisma } from '../prisma';
import { AiRouter } from '../ai/router';
import { TaskType, AIResponse } from '../ai/providers/interfaces';
import { CLAUDE_PROMPTS_V3 } from './copy-v3-prompts';
import { CopywriterAgent } from '../ai/agents/specialist-agents';

export interface CopyGenerationParams {
    productId: string;
    researchVersionId: string;
    avatarId: string;
    type: 'SALES_LETTER' | 'STORY_LEAD' | 'SHORT_FRAMEWORK';
    angleId?: string;
    framework?: string;
}

export class CopyOrchestrator {
    private productId: string;
    private storeId: string | null = null;

    constructor(productId: string) {
        this.productId = productId;
    }

    private async init() {
        const product = await prisma.product.findUnique({
            where: { id: this.productId }
        });
        if (!product) throw new Error("Producto no encontrado");
        this.storeId = product.storeId;
    }

    /**
     * Step 1: Generate Angles for a specific Avatar
     */
    async generateAngles(researchVersionId: string, avatarId: string) {
        await this.init();

        const output = await prisma.researchOutput.findUnique({
            where: { versionId: researchVersionId }
        });

        if (!output) throw new Error("No research output found for version " + researchVersionId);

        const avatars = JSON.parse(output.macroAvatarSheet || '[]');
        const avatar = avatars.find((a: any) => a.id === avatarId);
        const language = JSON.parse(output.languageBank || '[]').find((l: any) => l.avatar_id === avatarId);

        if (!avatar) throw new Error("Avatar not found");

        const prompt = CLAUDE_PROMPTS_V3.ANGLE_GENERATION
            .replace('{{avatarJson}}', JSON.stringify(avatar))
            .replace('{{languageJson}}', JSON.stringify(language));

        const result = await AiRouter.dispatch(
            this.storeId!,
            TaskType.COPYWRITING_DEEP, // Map to Claude
            prompt,
            { jsonSchema: true }
        );

        return JSON.parse(result.text.replace(/```json/g, '').replace(/```/g, ''));
    }

    /**
     * Step 2: Generate specific Copy (Sales Letter, Framework, etc.)
     */
    async generateCopy(params: CopyGenerationParams) {
        await this.init();

        const { researchVersionId, avatarId, type, angleId, framework } = params;

        const output = await prisma.researchOutput.findUnique({
            where: { versionId: researchVersionId }
        });

        if (!output) throw new Error("No research output found");

        const avatars = JSON.parse(output.macroAvatarSheet || '[]');
        const avatar = avatars.find((a: any) => a.id === avatarId);
        const language = JSON.parse(output.languageBank || '[]').find((l: any) => l.avatar_id === avatarId);

        let result: AIResponse;

        if (type === 'SALES_LETTER') {
            const context = JSON.stringify(output); // Passing full research context
            result = await CopywriterAgent.generateSalesLetter(this.storeId!, context, avatar);
        } else {
            // Fallback for other types
            let systemPrompt = "Actúa como un Copywriter de Respuesta Directa nivel Dios.";
            let userPrompt = "";

            if (type === 'SHORT_FRAMEWORK') {
                const frameworkDesc = (CLAUDE_PROMPTS_V3.FRAMEWORKS as any)[framework || ''] || "Framework General";
                userPrompt = `Genera un copy basado en el siguiente framework: ${frameworkDesc}\nAVATAR: ${JSON.stringify(avatar)}\nLENGUAJE: ${JSON.stringify(language)}`;
            }

            result = await AiRouter.dispatch(
                this.storeId!,
                TaskType.COPYWRITING_DEEP,
                userPrompt,
                { systemPrompt: systemPrompt }
            );
        }

        // Save to DB
        const adCopy = await (prisma as any).adCopy.create({
            data: {
                productId: this.productId,
                researchVersionId,
                avatarId,
                angle: angleId,
                framework,
                type,
                content: result.text,
                status: 'DRAFT'
            }
        });

        return adCopy;
    }
}
