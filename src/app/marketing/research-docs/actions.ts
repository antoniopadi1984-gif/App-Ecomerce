"use server";

import { generateAllResearchDocs } from "@/lib/google-docs";
import { prisma } from "@/lib/prisma";

/**
 * Manual action to generate Google Docs for existing research
 */
export async function generateResearchDocsAction(productId: string) {
    try {
        // Get product with Drive structure
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                title: true,
                driveRootPath: true
            }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        if (!product.driveRootPath) {
            return { success: false, error: 'Product has no Drive structure. Create it first.' };
        }

        const driveStructure = JSON.parse(product.driveRootPath);
        const researchFolderId = driveStructure.research?.root;

        if (!researchFolderId) {
            return { success: false, error: 'Research folder not found in Drive structure' };
        }

        // Get latest research data
        const latestResearch = await prisma.researchRun.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            select: { results: true }
        });

        if (!latestResearch || !latestResearch.results) {
            return { success: false, error: 'No research data found for this product' };
        }

        const raw = latestResearch.results;
        const researchData = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // Prepare data structure
        const formattedData = {
            productTitle: product.title,
            summary: researchData.dna_forense?.summary || '',
            core: researchData.dna_forense?.core || {},
            market: researchData.dna_forense?.market || {},
            avatars: researchData.v3_avatars || [],
            evidence: researchData.truth_layer?.evidence || [],
            voc: {
                painPoints: researchData.v3_language_bank?.pain_points || [],
                desires: researchData.v3_language_bank?.desires || [],
                objections: researchData.v3_language_bank?.objections || [],
                phrases: researchData.v3_language_bank?.phrases || []
            },
            angles: researchData.marketing_angles?.angles || []
        };

        // Generate docs
        const docIds = await generateAllResearchDocs(formattedData, researchFolderId);

        return {
            success: true,
            message: 'Google Docs generated successfully',
            docIds
        };

    } catch (error: any) {
        console.error('[generateResearchDocsAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get Google Docs URLs for a product
 */
export async function getResearchDocsUrlsAction(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveRootPath: true }
        });

        if (!product?.driveRootPath) {
            return { success: false, error: 'No Drive structure found' };
        }

        const structure = JSON.parse(product.driveRootPath);
        const researchFolderId = structure.research?.root;

        if (!researchFolderId) {
            return { success: false, error: 'Research folder not found' };
        }

        // Get docs from research folder
        const { google } = await import('googleapis');
        const { getAuthClient } = await import('@/lib/google-drive');

        const auth = await getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.list({
            q: `'${researchFolderId}' in parents and mimeType='application/vnd.google-apps.document'`,
            fields: 'files(id, name, webViewLink)',
            orderBy: 'createdTime desc'
        });

        const docs = response.data.files || [];

        return {
            success: true,
            docs: docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                url: doc.webViewLink
            }))
        };

    } catch (error: any) {
        console.error('[getResearchDocsUrlsAction] Error:', error);
        return { success: false, error: error.message };
    }
}
