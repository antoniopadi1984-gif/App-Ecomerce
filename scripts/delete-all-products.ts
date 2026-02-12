#!/usr/bin/env tsx

/**
 * COMPLETE PRODUCT DELETION SCRIPT
 * Handles all foreign key dependencies in correct order
 */

import { prisma } from '../src/lib/prisma';

async function deleteAllProducts() {
    console.log('🗑️  COMPREHENSIVE PRODUCT DELETION\n');

    try {
        // Get all products
        const products = await prisma.product.findMany({
            select: { id: true, title: true }
        });

        console.log(`Found ${products.length} products\n`);

        for (const product of products) {
            console.log(`Deleting: ${product.title} (${product.id.substring(0, 8)})`);

            // 1. ResearchProjects chain
            const projects = await (prisma as any).researchProject.findMany({
                where: { productId: product.id }
            });

            for (const project of projects) {
                const versions = await (prisma as any).researchVersion.findMany({
                    where: { projectId: project.id }
                });

                const versionIds = versions.map((v: any) => v.id);

                if (versionIds.length > 0) {
                    // Disconnect CreativeProjects
                    await (prisma as any).creativeProject.updateMany({
                        where: { researchVersionId: { in: versionIds } },
                        data: { researchVersionId: null }
                    });

                    // Delete Outputs
                    await (prisma as any).researchOutput.deleteMany({
                        where: { versionId: { in: versionIds } }
                    });

                    // Delete Versions
                    await (prisma as any).researchVersion.deleteMany({
                        where: { projectId: project.id }
                    });
                }

                // Delete Project
                await (prisma as any).researchProject.delete({
                    where: { id: project.id }
                });
            }

            // 2. Delete all product-related data in correct order

            // CopyContracts (has creativeProjects dependency)
            const contracts = await (prisma as any).copyContract.findMany({
                where: { productId: product.id }
            });
            for (const contract of contracts) {
                // First disconnect CreativeProjects
                await (prisma as any).creativeProject.updateMany({
                    where: { contractId: contract.id },
                    data: { contractId: null }
                });
                // Then delete contract
                await (prisma as any).copyContract.delete({
                    where: { id: contract.id }
                });
            }

            // CreativeProjects (disconnect product first)
            await (prisma as any).creativeProject.updateMany({
                where: { productId: product.id },
                data: { productId: null }
            });

            // VideoJobs
            await (prisma as any).videoJob.deleteMany({
                where: { productId: product.id }
            });

            // VideoClips
            await (prisma as any).videoClip.deleteMany({
                where: { productId: product.id }
            });

            // CopyJobs
            await (prisma as any).copyJob.deleteMany({
                where: { productId: product.id }
            });

            // CopyArtifacts
            await (prisma as any).copyArtifact.deleteMany({
                where: { productId: product.id }
            });

            // CreativeBlueprints
            await (prisma as any).creativeBlueprint.deleteMany({
                where: { productId: product.id }
            });

            // CreativeAssets  
            await (prisma as any).creativeAsset.deleteMany({
                where: { productId: product.id }
            });

            // ContentTemplates
            await (prisma as any).contentTemplate.deleteMany({
                where: { productId: product.id }
            });

            // ContentAssets
            await (prisma as any).contentAsset.deleteMany({
                where: { productId: product.id }
            });

            // PageBlueprints
            await (prisma as any).pageBlueprint.deleteMany({
                where: { productId: product.id }
            });

            // LandingProjects
            await (prisma as any).landingProject.updateMany({
                where: { productId: product.id },
                data: { productId: null }
            });

            // LanguageDictionaries
            await (prisma as any).languageDictionary.deleteMany({
                where: { productId: product.id }
            });

            // KnowledgeNodes
            await (prisma as any).knowledgeNode.deleteMany({
                where: { productId: product.id }
            });

            // DriveAssets
            await (prisma as any).driveAsset.deleteMany({
                where: { productId: product.id }
            });

            // MarketingAngles
            await (prisma as any).marketingAngle.deleteMany({
                where: { productId: product.id }
            });

            // VoiceOfCustomerQuotes
            await (prisma as any).voiceOfCustomerQuote.deleteMany({
                where: { productId: product.id }
            });

            // CompetitorLanding
            await (prisma as any).competitorLanding.deleteMany({
                where: { productId: product.id }
            });

            // AvatarResearch
            await (prisma as any).avatarResearch.deleteMany({
                where: { productId: product.id }
            });

            // ResearchDocuments
            await (prisma as any).researchDocument.deleteMany({
                where: { productId: product.id }
            });

            // EvidenceChunks
            await (prisma as any).evidenceChunk.deleteMany({
                where: { productId: product.id }
            });

            // SearchQueries
            await (prisma as any).searchQuery.deleteMany({
                where: { productId: product.id }
            });

            // ResearchRuns
            await (prisma as any).researchRun.deleteMany({
                where: { productId: product.id }
            });

            // ResearchSources
            await (prisma as any).researchSource.deleteMany({
                where: { productId: product.id }
            });

            // CompetitorLinks
            await prisma.competitorLink.deleteMany({
                where: { productId: product.id }
            });

            // AdCopy (if exists)
            try {
                await (prisma as any).adCopy.deleteMany({
                    where: { productId: product.id }
                });
            } catch (e) {
                // Model may not exist
            }

            // ProductFinance
            await (prisma as any).productFinance.deleteMany({
                where: { productId: product.id }
            });

            // ProductMaturity
            await (prisma as any).productMaturity.deleteMany({
                where: { productId: product.id }
            });

            // Finally, delete the product
            await prisma.product.delete({
                where: { id: product.id }
            });

            console.log(`  ✅ Deleted completely\n`);
        }

        console.log('\n✅ ALL PRODUCTS DELETED SUCCESSFULLY\n');

        // Verify
        const remaining = await prisma.product.count();
        console.log(`Remaining products: ${remaining}`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error('\nStack:', error.stack);
    }
}

deleteAllProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
