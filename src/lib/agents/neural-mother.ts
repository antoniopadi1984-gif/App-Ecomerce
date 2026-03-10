import { prisma } from '../prisma';
import { ResearchOrchestrator } from '../research/research-orchestrator';
import { CopyOrchestrator } from '../copy/copy-orchestrator';
import { generateEbookPDF } from '../ebook-engine';
import { ResearchLabIntegration } from '../research/research-lab-integration';

/**
 * 👑 NEURAL MOTHER SERVICE
 * The conductor of the entire AI ecosystem. Orchestrates research, copy, and asset generation.
 * Designed for "One-Click" efficiency.
 */
export class NeuralMotherService {
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
     * THE UNIVERSAL WIZARD
     * Runs the full chain: Research -> Avatar -> Copy -> eBook -> Sync
     */
    async runFullAutomationWizard() {
        await this.init();
        const logs: string[] = [];
        const log = (msg: string) => {
            console.log(`[NeuralMother] ${msg}`);
            logs.push(msg);
        };

        try {
            // STEP 1: Deep Research (Phase 1-6)
            log("🚀 Iniciando Deep Research God-Tier...");
            const orchestrator = new ResearchOrchestrator(this.productId);
            const researchResult = await orchestrator.executeResearchPipelineV3();

            if (!researchResult.success) {
                throw new Error(`Fallo en la investigación: ${researchResult.error}`);
            }
            log("✅ Research completado con éxito.");

            // STEP 2: Intelligent Extraction
            // We fetch the latest research run to get the results
            const latestRun = await (prisma as any).researchRun.findFirst({
                where: { productId: this.productId, status: 'READY' },
                orderBy: { createdAt: 'desc' }
            });

            const researchData = JSON.parse(latestRun.results);
            const winnerAvatar = researchData.v3_avatars?.[0]; // Default to first

            if (!winnerAvatar) {
                log("⚠️ No se detectaron avatares en el research. Abortando copy/ebook.");
                return { success: true, warning: "Research finished but no avatars found for next steps." };
            }
            log(`🎯 Avatar seleccionado: ${winnerAvatar.name || 'Avatar Principal'}`);

            // STEP 3: God-Tier Copy Generation
            log("✍️ Generando Copy de Ventas God-Tier...");
            const copyResult = await orchestrator.generateGodTierCopy(0, 0); // Winner avatar, first angle

            if (!copyResult.success) {
                log("⚠️ Fallo en la generación de Copy, continuando con eBook...");
            } else {
                log("✅ Copy God-Tier generado y guardado.");
            }

            // STEP 4: Perceived Value Asset (eBook)
            log("📘 Fabricando eBook de Fidelización...");
            const ebookReq = {
                storeId: this.storeId!,
                productId: this.productId,
                title: `Guía Maestra: ${researchData.product_core?.identity?.definition || 'Tu Solución'}`,
                productName: researchData.product_core?.vehiculo || 'Producto',
                theme: researchData.dna_forense?.mecanismo_real || 'Excelencia',
                targetAudience: winnerAvatar.name || 'Cliente Premium',
                tone: 'EDUCA' as const
            };

            const ebookResult = await generateEbookPDF(ebookReq);
            let finalEbookUrl = '';
            if (ebookResult.success && ebookResult.driveFileId) {
                finalEbookUrl = `https://drive.google.com/uc?id=${ebookResult.driveFileId}`;
                log(`✅ eBook generado: ${finalEbookUrl}`);

                // Link to ContentAsset in DB
                await (prisma as any).contentAsset.create({
                    data: {
                        storeId: this.storeId!,
                        productId: this.productId,
                        name: ebookReq.title,
                        fileUrl: finalEbookUrl,
                        type: 'PDF',
                        metadataJson: JSON.stringify({
                            generatedBy: 'NEURAL_MOTHER',
                            avatar: winnerAvatar.name
                        })
                    }
                });
            } else {
                log("⚠️ Error fabricando eBook.");
            }

            // STEP 5: Knowledge Node Injection (The Global Brain)
            log("🧠 Inyectando conocimiento en la Red Neuronal...");
            await this.populateKnowledgeBase(researchData);

            log("🏁 Wizard finalizado correctamente. Todo el ecosistema está sincronizado.");
            return {
                success: true,
                logs,
                outputs: {
                    researchRunId: latestRun.id,
                    ebookUrl: finalEbookUrl,
                    avatarName: winnerAvatar.name
                }
            };

        } catch (error: any) {
            log(`❌ ERROR CRÍTICO: ${error.message}`);
            return { success: false, error: error.message, logs };
        }
    }

    /**
     * Populates the KnowledgeNode graph for future RAG/Agent awareness
     */
    private async populateKnowledgeBase(data: any) {
        if (!this.storeId) return;

        try {
            const nodes = [
                { type: 'DNA', content: data.dna_forense },
                { type: 'PAIN_STACK', content: data.voc?.pain_stack },
                { type: 'AVATARS', content: data.v3_avatars },
                { type: 'OFFER', content: data.offer_strategy }
            ];

            for (const node of nodes) {
                if (!node.content) continue;

                await (prisma as any).knowledgeNode.create({
                    data: {
                        productId: this.productId,
                        type: node.type,
                        contentJson: JSON.stringify(node.content),
                        metadataJson: JSON.stringify({ source: 'NEURAL_MOTHER_ORCHESTRATOR' })
                    }
                });
            }
        } catch (e) {
            console.warn("[NeuralMother] Failed to populate KnowledgeBase:", e);
        }
    }
}
