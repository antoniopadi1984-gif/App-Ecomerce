import { prisma } from '@/lib/prisma';

export class NomenclatureService {
    /**
     * Extracts a unique SKU for a product based on its name.
     * Logic: First letters of meaningful words, max 4 chars, uppercase.
     */
    static async generateProductSku(params: {
        title: string;
        storeId: string;
    }): Promise<string> {
        // 1. Clean and get parts
        const words = params.title
            .replace(/[^a-zA-Z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2); // Filter out short words (de, la, the)

        // 2. Extract first letters
        let baseSku = words
            .map(w => w[0]?.toUpperCase())
            .join('')
            .slice(0, 4);

        // 3. Fallback if empty or too short
        if (baseSku.length < 2) {
            baseSku = params.title.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
        }

        // 4. Ensure uniqueness in the store
        let uniqueSku = baseSku;
        let counter = 2;

        while (true) {
            const existing = await (prisma as any).product.findFirst({
                where: { storeId: params.storeId, sku: uniqueSku },
                select: { id: true }
            });

            if (!existing) break;

            // If exists, try adding/rotating number
            // MAX 4 chars: if NADR exists -> NAD2? No, user said "NADR2" if long.
            // Let's allow slightly more than 4 if we add a number, or trim one char.
            const suffix = String(counter);
            uniqueSku = baseSku.slice(0, 4 - suffix.length) + suffix;
            counter++;
        }

        return uniqueSku;
    }

    /**
     * Legacy/Static SKU extractor (truncated version)
     */
    static extractSku(title: string, sku?: string | null): string {
        if (sku) return sku.slice(0, 5).toUpperCase();
        return title.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PROD';
    }

    /**
     * Generates the automatic nomenclature for a new creative artifact
     * FORMAT: [SKU]_C[N]_V[N][suffix]
     */
    static async generate(params: {
        productId: string;
        conceptId: string;
        isVariant?: boolean;
        parentArtifactId?: string;
    }): Promise<{
        creativeCode: string;
        version: number;
        variantSuffix: string | null;
        sku: string;
        conceptNumber: number;
    }> {
        const product = await (prisma as any).product.findUnique({
            where: { id: params.productId },
            select: { title: true, sku: true, vendor: true }
        });

        const concept = await (prisma as any).concept.findUnique({
            where: { id: params.conceptId },
            select: { number: true, name: true }
        });

        if (!product || !concept) {
            throw new Error('Product or Concept not found for nomenclature generation');
        }

        const conceptNum = concept.number || 1;
        const conceptName = concept.name.toUpperCase().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const conceptCode = `CONC${String(conceptNum).padStart(2, '0')}`;

        let version = 1;
        let variantSuffix: string | null = null;

        if (params.isVariant && params.parentArtifactId) {
            const parent = await (prisma as any).creativeArtifact.findUnique({
                where: { id: params.parentArtifactId },
                select: { version: true, variantSuffix: true }
            });

            if (parent) {
                version = parent.version;
                const existingVariants = await (prisma as any).creativeArtifact.findMany({
                    where: {
                        productId: params.productId,
                        conceptId: params.conceptId,
                        version: version
                    },
                    select: { variantSuffix: true },
                    orderBy: { variantSuffix: 'desc' }
                });

                const lastSuffix = existingVariants[0]?.variantSuffix;
                if (!lastSuffix) {
                    variantSuffix = 'a';
                } else {
                    const charCode = lastSuffix.charCodeAt(0);
                    variantSuffix = String.fromCharCode(charCode + 1);
                }
            }
        } else {
            const lastArtifact = await (prisma as any).creativeArtifact.findFirst({
                where: {
                    productId: params.productId,
                    conceptId: params.conceptId
                },
                orderBy: { version: 'desc' },
                select: { version: true }
            });

            version = (lastArtifact?.version || 0) + 1;
        }

        const brandStr = (product.vendor || product.sku || product.title.slice(0, 4))
            .toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '').slice(0, 6);
        const sku = brandStr; // Using brandStr as the base SKU for nomenclature

        const vStr = `V${String(version).padStart(2, '0')}${variantSuffix || ''}`;

        // Rule: [BRAND]_[CONCEPTO]_[ANGULO]_[VERSION]
        // Using SKU as BRAND if brand not explicit
        const creativeCode = `${sku}_${conceptCode}_${conceptName}_${vStr}`;

        return {
            creativeCode,
            version,
            variantSuffix,
            sku,
            conceptNumber: conceptNum
        };
    }

    /**
     * Builds the Drive path for a given artifact
     * /[STORE]/[SKU]/C[N]_[NAME]/V[N][suffix]/
     */
    static async getDrivePath(artifactId: string): Promise<string> {
        const artifact = await (prisma as any).creativeArtifact.findUnique({
            where: { id: artifactId },
            include: { product: { include: { store: true } }, concept: true }
        });

        if (!artifact) return '';

        const storeName = artifact.product.store.name.replace(/\s+/g, '_').toUpperCase();
        const sku = this.extractSku(artifact.product.title, artifact.product.sku);
        const cNum = artifact.concept.number || 1;
        const cName = artifact.concept.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const vFolder = `V${String(artifact.version).padStart(2, '0')}${artifact.variantSuffix || ''}`;

        // Fixed path: STORE/PRODUCT/CENTRO_CREATIVO/02_BIBLIOTECA_LISTOS_PARA_ADS/02_CONCEPTOS/CONC_N_NAME/V_N/
        return `${storeName}/${sku}/CENTRO_CREATIVO/02_BIBLIOTECA_LISTOS_PARA_ADS/02_CONCEPTOS/CONC_${String(cNum).padStart(2, '0')}_${cName}/${vFolder}`;
    }
}
