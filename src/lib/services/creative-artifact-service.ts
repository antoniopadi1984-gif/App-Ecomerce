import { prisma } from '@/lib/prisma';
import { NomenclatureService } from './nomenclature-service';
import { CreativeType, FunnelStage, MetaAdStatus } from '@prisma/client';

export class CreativeArtifactService {
    /**
     * Creates a new creative artifact with automatic nomenclature
     */
    static async create(data: {
        storeId: string;
        productId: string;
        conceptId: string;
        type: CreativeType;
        format: string;
        funnelStage: FunnelStage;
        framework: string;
        hookType: string;
        emotion: string;
        driveUrl: string;
        driveFileId: string;
        thumbnailUrl: string;
        generationCost: number;
        modelsUsed?: string;
        promptsUsed?: string;
        isVariant?: boolean;
        parentArtifactId?: string;
    }) {
        // Generate automatic nomenclature
        const nomenclature = await NomenclatureService.generate({
            productId: data.productId,
            conceptId: data.conceptId,
            isVariant: data.isVariant,
            parentArtifactId: data.parentArtifactId
        });

        // Create in DB
        const artifact = await (prisma as any).creativeArtifact.create({
            data: {
                storeId: data.storeId,
                productId: data.productId,
                conceptId: data.conceptId,
                creativeCode: nomenclature.creativeCode,
                version: nomenclature.version,
                variantSuffix: nomenclature.variantSuffix,
                type: data.type,
                format: data.format,
                funnelStage: data.funnelStage,
                framework: data.framework,
                hookType: data.hookType,
                emotion: data.emotion,
                driveUrl: data.driveUrl,
                driveFileId: data.driveFileId,
                thumbnailUrl: data.thumbnailUrl,
                generationCost: data.generationCost,
                metaStatus: 'DRAFT',
                modelsUsed: data.modelsUsed,
                promptsUsed: data.promptsUsed,
            }
        });

        return artifact;
    }

    /**
     * Creates a variant of an existing artifact
     */
    static async createVariant(parentArtifactId: string, overrides: Partial<any> = {}) {
        const parent = await (prisma as any).creativeArtifact.findUnique({
            where: { id: parentArtifactId }
        });

        if (!parent) throw new Error('Parent artifact not found');

        return this.create({
            ...parent,
            ...overrides,
            isVariant: true,
            parentArtifactId: parentArtifactId
        });
    }
}
