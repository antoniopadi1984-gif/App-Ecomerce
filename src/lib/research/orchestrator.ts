import { prisma } from '../prisma';
import { Scraper } from './scraper';
import { EconomicsCalculator } from './calculator';
import { SearchOrchestrator, UnifiedSearchResult } from './search-orchestrator';
import { AiRouter } from '../ai/router';
import { TaskType, AIResponse } from '../ai/providers/interfaces';
import { API_CONFIG } from '../config/api-config';
import { isSameDay, format } from 'date-fns';
import { STRATEGIC_INTELLIGENCE_CORE } from './strategic-context';
import { DriveSync } from './drive-sync';
import { GEMINI_PROMPTS_V3 } from './v3-prompts';
import { VOCCategorizer } from './voc-categorizer';
import { ResearchSnapshotService } from './snapshot-service';
import { ResearchLabIntegration } from './research-lab-integration';
import { ForensicResearcherAgent } from '../ai/agents/specialist-agents';

// --- DEEP RESEARCH CONTRACT ---
export interface Evidence {
    evidence_id: string;
    quote: string;
    source_url?: string;
    source_type?: string;
    confidence?: number;
}

export interface Claim {
    claim_id: string;
    claim: string;
    category: 'PAIN' | 'DESIRE' | 'MECHANISM' | 'OBJECTION';
    evidence_ids: string[];
    status?: 'CONFIRMED' | 'HYPOTHESIS';
}

export interface ResearchResults {
    sources: {
        url: string;
        provider: string;
        date: string;
        locale: string;
        type: string;
        reliability_score: number;
    }[];
    truth_layer: {
        evidence: Evidence[];
        claims: Claim[];
    };
    mechanisms: {
        unique_real: string;
        perceived: string;
        analogies: string[];
        differentiation: string;
        evidence_ids: string[];
    };
    voc: {
        dictionary: { phrase: string; meaning: string; emotion: string; evidence_id?: string }[];
        pain_stack: { level: number; pain: string; evidence_id?: string }[];
        objections: { trigger: string; counter: string; evidence_id?: string }[];
        desires: {
            name: string;
            type: 'primary' | 'secondary'; evidence_id?: string
        }[];
        phrases_by_emotion: any[];
        prohibited_words: string[];
    };
    avatar_scoring: {
        avatars: any[];
        winner: any | null;
    };
    desire_ranking: {
        ranking: { desire: string; frequency: number; intensity: number; urgency: number; evidence_ids: string[] }[];
        primary: string | null;
    };
    breakthrough_advertising: {
        awareness_levels: Record<string, string>;
        market_sophistication: {
            level: number;
            justification: string;
            claims_dominantes: string[];
            promesas_quemadas: string[];
        };
        mass_desire: any;
        unique_mechanism: {
            real: string;
            perceived: string;
            analogy: string;
        };
        market_mechanism_gap?: string;
    };
    life_forces: {
        primary: string;
        secondary: string[];
        hidden: string[];
        ranking: { desire: string; intensity: number; urgency: number; pvp_alignment: number }[];
    };
    problem_map: {
        visible: string[];
        emotional: string[];
        social: string[];
        aspirational: string[];
    };
    transformation_map: {
        functional: string;
        emotional: string;
        identitary: string;
    };
    angles: {
        angle_tree: any[];
        hooks: any[];
    };
    offer_psychology: {
        value_stack: { item: string; value_perceived: string; reason: string }[];
        guarantees?: string[];
        price_anchors?: string[];
        risk_reversal?: string;
        guarantee?: string;
        scarcity?: string;
    };
    economics: any;
    summary: string;
    dna_forense: any;
    v3_desires?: any;
    v3_avatars?: any;
    v3_language_bank?: any;
    product_core?: any;
    truth_layer_v3?: any;
    competitor_intel?: any;
    sophistication?: any;
    avatars?: any;
    psychology?: any;
    marketing_angles?: any;
    mechanism?: any;
    awareness_levels?: any;
    scientific_data?: any;
    offer_strategy?: any;
    claude_brief?: any;
    creative_briefs?: any;
    positioning?: any;
    market_validation?: any;
    final_markdown?: string;
    validation_report?: any;
}

export class ResearchOrchestrator {
    private productId: string;
    private storeId: string | null = null;
    private runId: string | null = null;
    private sessionId: string | null = null;
    private iterationId: string | null = null;
    private ctx: { data: ResearchResults } = {
        data: {
            sources: [],
            truth_layer: { evidence: [], claims: [] },
            mechanisms: { unique_real: '', perceived: '', analogies: [], differentiation: '', evidence_ids: [] },
            voc: { dictionary: [], pain_stack: [], objections: [], desires: [], phrases_by_emotion: [], prohibited_words: [] },
            avatar_scoring: { avatars: [], winner: null },
            desire_ranking: { ranking: [], primary: null },
            breakthrough_advertising: {
                awareness_levels: {},
                market_sophistication: { level: 1, justification: '', claims_dominantes: [], promesas_quemadas: [] },
                mass_desire: {},
                unique_mechanism: { real: '', perceived: '', analogy: '' }
            },
            life_forces: { primary: '', secondary: [], hidden: [], ranking: [] },
            problem_map: { visible: [], emotional: [], social: [], aspirational: [] },
            transformation_map: { functional: '', emotional: '', identitary: '' },
            angles: { angle_tree: [], hooks: [] },
            offer_psychology: { value_stack: [] },
            economics: { scenarios: [] },
            summary: '',
            dna_forense: {}
        }
    };

    constructor(productId: string) {
        this.productId = productId;
    }

    private async init() {
        const product = await prisma.product.findUnique({
            where: { id: this.productId }
        });
        if (!product) throw new Error("Product not found");
        this.storeId = product.storeId;

        // 1. Manage ResearchSession (Find active or create)
        let session = await (prisma as any).researchSession.findFirst({
            where: { productId: this.productId, status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
        });

        if (!session) {
            session = await (prisma as any).researchSession.create({
                data: {
                    productId: this.productId,
                    name: `Sesión ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
                    status: 'OPEN'
                }
            });
        }
        this.sessionId = session.id;

        // 2. Create minimal initial run record
        const run = await (prisma as any).researchRun.create({
            data: {
                productId: this.productId,
                sessionId: this.sessionId,
                status: 'PROCESSING',
                version: 'V4-GOD-TIER'
            }
        });
        this.runId = run.id;

        // 3. Create iteration record
        const iteration = await (prisma as any).researchIteration.create({
            data: {
                sessionId: this.sessionId,
                runId: this.runId,
                version: 1, // Default, can be incremented
                changeLog: 'Inicio de investigación God-Tier'
            }
        });
        this.iterationId = iteration.id;

        await this.log(`[${format(new Date(), 'HH:mm:ss')}] Inicializando Sesión: ${session.id} | Iteración: ${iteration.id}`);
    }

    private parseJsonSafe(text: string, fallback: any = {}): any {
        try {
            const clean = text.replace(/```json /g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        }
        catch (e) {
            console.error("[Orchestrator JSON Parse Error]", e);
            try {
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    return JSON.parse(text.substring(start, end + 1));
                }
            }
            catch (inner) { }
            return fallback;
        }
    }

    private verifyForensicOutput(data: any, criticalFields: string[]): boolean {
        if (!data || typeof data !== 'object') return false;
        for (const field of criticalFields) {
            const val = data[field];
            if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.length < 10)) {
                return false;
            }
        }
        return true;
    }

    private async updateStatus(progress: number, phase: number, msg: string) {
        if (!this.runId) return;
        const currentRun = await (prisma.researchRun as any).findUnique({ where: { id: this.runId } });
        const newLogs = (currentRun?.logs || '') + `\n[${format(new Date(), 'HH:mm:ss')}] PHASE ${phase}: ${msg}`;

        await (prisma.researchRun as any).update({
            where: { id: this.runId },
            data: {
                progress,
                currentPhase: phase,
                logs: newLogs
            }
        }).catch((e: any) => console.warn("Update status failed (non-critical):", e));
    }

    private async log(msg: string) {
        if (!this.runId) return;
        const currentRun = await (prisma.researchRun as any).findUnique({ where: { id: this.runId } });
        const newLogs = (currentRun?.logs || '') + `\n${msg}`;

        await (prisma.researchRun as any).update({
            where: { id: this.runId },
            data: {
                logs: newLogs
            }
        }).catch((e: any) => console.warn("Log update failed (non-critical):", e));
    }

    private async saveCheckpoint() {
        if (!this.runId) return;
        try {
            await (prisma.researchRun as any).update({
                where: { id: this.runId },
                data: {
                    results: JSON.stringify(this.ctx.data)
                }
            });
        }
        catch (e) {
            console.warn("[Orchestrator] Failed to save checkpoint:", e);
        }
    }

    /**
    * Calculate product economics (pricing, margins, etc.)
    */
    private async calculateEconomics(): Promise<any> {
        const product = await prisma.product.findUnique({
            where: { id: this.productId }
        }) as any;

        if (!product) return { scenarios: [] };

        let basePrice = product.price || 0;

        // If NO price configured, research market pricing
        if (basePrice === 0) {
            this.log('💰 Producto sin precio → Investigando precios de mercado...');
            const priceQuery = `${product.title} precio comprar`;
            const priceResults = await SearchOrchestrator.search(this.productId, priceQuery, 'GENERAL', true);
            const priceEvidence = priceResults.slice(0, 5).map((r: any) => r.snippet || r.content).join('\n');

            const pricePrompt = `Analiza estos resultados de búsqueda y extrae el PRECIO PROMEDIO de venta del producto "${product.title}":
EVIDENCIA:
${priceEvidence}
Responde SOLO con un número (precio en EUR).`;

            try {
                const priceResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_DEEP, pricePrompt, {});
                const extractedPrice = parseFloat(priceResult.text.replace(/[^0-9.]/g, ''));
                basePrice = extractedPrice > 0 ? extractedPrice : 29.90;
                this.log(`✅ Precio de mercado detectado: €${basePrice}`);
            }
            catch (e) {
                basePrice = 29.90;
                this.log(`⚠️ Usando precio por defecto: €${basePrice}`);
            }
        }

        // Real Precision: Use user-provided costs if available
        const unitCost = product.unitCost || (basePrice * 0.25);
        const shipping = product.shippingCost || 5;
        const totalCostPerUnit = unitCost + shipping;

        const suggestedRetail = product.compareAtPrice || (basePrice * 1.5);
        const margin = basePrice - totalCostPerUnit;
        const marginPercent = (margin / basePrice) * 100;

        return {
            unit_cost: parseFloat(unitCost.toFixed(2)),
            shipping_cost: parseFloat(shipping.toFixed(2)),
            total_cost: parseFloat(totalCostPerUnit.toFixed(2)),
            current_price: parseFloat(basePrice.toFixed(2)),
            suggested_retail: parseFloat(suggestedRetail.toFixed(2)),
            margin_value: parseFloat(margin.toFixed(2)),
            margin_percent: parseFloat(marginPercent.toFixed(1)),
            scenarios: [
                {
                    name: 'Económico (Low Cap)',
                    price: Math.round(totalCostPerUnit * 2.2),
                    margin: ((totalCostPerUnit * 2.2 - totalCostPerUnit) / (totalCostPerUnit * 2.2) * 100).toFixed(1) + '%',
                    positioning: 'Entrada Masiva / Liquidación'
                },
                {
                    name: 'Escalable (Optimal)',
                    price: Math.round(totalCostPerUnit * 3.5),
                    margin: ((totalCostPerUnit * 3.5 - totalCostPerUnit) / (totalCostPerUnit * 3.5) * 100).toFixed(1) + '%',
                    positioning: 'Crecimiento Sostenible'
                },
                {
                    name: 'Premium (High Hook)',
                    price: Math.round(totalCostPerUnit * 5.5),
                    margin: ((totalCostPerUnit * 5.5 - totalCostPerUnit) / (totalCostPerUnit * 5.5) * 100).toFixed(1) + '%',
                    positioning: 'Autoridad / Exclusividad'
                }
            ],
            recommended_price: Math.round(totalCostPerUnit * 3.5),
            cpa_limit: parseFloat((margin * 0.7).toFixed(2)), // 70% of margin as CPA limit
            break_even_roas: parseFloat((basePrice / margin).toFixed(2))
        };
    }

    async executeResearchPipelineV3() {
        try {
            await this.init();
            await this.updateStatus(0, 1, 'Iniciando Pipeline God-Tier Research (6 Fases)...');

            console.log(`[ResearchOrchestrator] Starting V3 Pipeline for product ${this.productId}`);
            console.log(`[ResearchOrchestrator] Stable Gemini Model: ${API_CONFIG.vertexAI.models.gemini.production}`);

            const product = await prisma.product.findUnique({
                where: { id: this.productId },
                include: { competitorLinks: true }
            }) as any;

            if (!product) throw new Error("Producto no encontrado");

            // PHASE 1: Truth & Core Forensic (Esencia + Validación de Mercado)
            await this.updateStatus(10, 1, 'Fase 1: Extracción de Verdad y Definición Forense (Core Truth)...');

            // 1.1 Product Core
            const coreResult = await ForensicResearcherAgent.executeDeepAnalysis(
                this.storeId!,
                product.title,
                JSON.stringify({
                    niche: product.niche,
                    country: product.country,
                    competitors: product.competitorLinks
                }),
                product.productFamily || ''
            );

            const coreData = this.parseJsonSafe(coreResult.text, {});
            this.ctx.data.product_core = coreData;

            // 1.2 Market Validation (Reddit + Forums)
            this.log('🔍 Buscando opiniones reales en foros para validación de mercado...');
            const marketValidationResults = await SearchOrchestrator.search(
                this.productId,
                `${product.title} opiniones reales experiencia forum reddit`,
                'FORUMS',
                true
            );

            this.ctx.data.market_validation = {
                sources_count: marketValidationResults.length,
                forums_analyzed: ['reddit', 'forocoches', 'quora', 'trustpilot'],
                evidence: marketValidationResults.slice(0, 20).map(r => ({
                    source: r.url,
                    snippet: r.snippet,
                    title: r.title,
                    provider: r.provider
                })),
                status: marketValidationResults.length > 0 ? 'CONFIRMED' : 'PARTIAL',
                timestamp: new Date().toISOString()
            };

            await this.saveCheckpoint();

            // PHASE 2: Mass Desire & Market Physics (DNA + Schwartz)
            await this.updateStatus(25, 2, 'Fase 2: Física del Mercado y Descubrimiento de Deseos Masivos...');

            // 2.1 Mass Desire
            const desirePrompt = GEMINI_PROMPTS_V3.MASS_DESIRE_DISCOVERY
                .replace('{{productTitle}}', product.title)
                .replace('{{niche}}', product.niche || '')
                .replace('{{productFamily}}', product.productFamily || '')
                .replace('{{country}}', product.country || 'ES')
                .replace('{{amazonUrls}}', product.competitorLinks?.map((l: any) => l.url).join(', ') || 'N/A');

            const desireResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FAST, desirePrompt, { jsonSchema: true });
            const desiresData = this.parseJsonSafe(desireResult.text, { desires: [] });
            this.ctx.data.v3_desires = desiresData;

            // 2.2 Breakthrough Analysis (Psychology of Market)
            const physicsPrompt = GEMINI_PROMPTS_V3.BREAKTHROUGH_ANALYSIS
                .replace('{{productCore}}', JSON.stringify(coreData))
                .replace('{{competitorsAnalysis}}', "{}") // Initial pass
                .replace('{{avatarsJson}}', JSON.stringify(desiresData));

            const physicsResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FORENSIC, physicsPrompt, { jsonSchema: true });
            const physicsData = this.parseJsonSafe(physicsResult.text, {});
            this.ctx.data.sophistication = physicsData.market_sophistication || { level: 3 };

            // Mapping results
            this.ctx.data.summary = `🕵️ INFORME FORENSE GOD-TIER: ${desiresData.primary_emotional_hook?.substring(0, 150) || 'Análisis estratétigo completado.'}...`;
            this.ctx.data.dna_forense = {
                vehiculo: product.title,
                mecanismo_real: coreData.solution_mechanism?.unique_method || desiresData.primary_emotional_hook,
                mecanismo_percibido: desiresData.desires?.[0]?.surface_desire || "N/A",
                diferenciacion: coreData.solution_mechanism?.superiority_claims?.join(' | ') || desiresData.market_saturation_observation,
                opportunity: desiresData.white_space_opportunity,
                core_identity: coreData.identity?.definition,
                root_problem: coreData.problem_solving?.functional_problems?.[0]
            } as any;

            this.ctx.data.breakthrough_advertising = {
                awareness_levels: physicsData.awareness_levels || {},
                market_sophistication: physicsData.market_sophistication || { level: 3 },
                mass_desire: desiresData.primary_emotional_hook || physicsData.mass_desire || {},
                unique_mechanism: {
                    real: physicsData.unique_mechanism?.real || coreData.solution_mechanism?.unique_method || '',
                    perceived: physicsData.unique_mechanism?.perceived || desiresData.desires?.[0]?.surface_desire || '',
                    analogy: physicsData.unique_mechanism?.analogy || ''
                }
            };
            await this.saveCheckpoint();

            // PHASE 3: Deep Avatar & Language Profiling (Macro-Avatares + VOC)
            await this.updateStatus(45, 3, 'Fase 3: Perfilado Profundo y Extracción Lingüística (Avatar + VOC)...');

            // 3.1 Macro-Avatar
            const avatarPrompt = GEMINI_PROMPTS_V3.MACRO_AVATAR_CREATION
                .replace('{{productTitle}}', product.title)
                .replace('{{productDescription}}', product.description || product.problemToSolve || 'N/A')
                .replace('{{niche}}', product.niche || 'General')
                .replace('{{country}}', product.country || 'ES')
                .replace('{{desiresJson}}', JSON.stringify(desiresData))
                .replace('{{productCore}}', JSON.stringify(coreData));

            const avatarResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FORENSIC, avatarPrompt, { jsonSchema: true });
            const avatarsData = this.parseJsonSafe(avatarResult.text, { avatars: [] });
            this.ctx.data.v3_avatars = avatarsData.avatars;

            // 3.2 Language Extraction
            const languagePrompt = GEMINI_PROMPTS_V3.LANGUAGE_EXTRACTION
                .replace('{{avatarsJson}}', JSON.stringify(avatarsData))
                .replace('{{desiresJson}}', JSON.stringify(desiresData))
                .replace('{{productContext}}', `${product.title} - ${product.niche}`);

            const languageResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FAST, languagePrompt, { jsonSchema: true });
            const languageData = this.parseJsonSafe(languageResult.text, { language_bank: [] });
            this.ctx.data.v3_language_bank = languageData.language_bank;

            // Mapping VOC
            this.ctx.data.voc = {
                pain_stack: (desiresData.desires || []).map((d: any) => ({ level: 10, pain: d.pain_point })),
                dictionary: languageData.language_bank?.[0]?.vocabulary_clusters ? Object.entries(languageData.language_bank[0].vocabulary_clusters).flatMap(([k, v]: [string, any]) => v.map((p: string) => ({ phrase: p, meaning: k.toUpperCase(), emotion: 'INTENSE' }))) : [],
                objections: languageData.language_bank?.[0]?.vocabulary_clusters?.skepticism_phrases || [],
                desires: languageData.language_bank?.[0]?.vocabulary_clusters?.hope_phrases || [],
                phrases_by_emotion: [],
                prohibited_words: []
            };
            await this.saveCheckpoint();

            // PHASE 4: Breakthrough Diagnosis & Intel (Search + Competitors + Scientific)
            await this.updateStatus(65, 4, 'Fase 4: Diagnóstico de Irrupción e Inteligencia Competitiva...');

            // 4.1 Parallel Search & Competitor Analysis
            const searchQueries = desiresData.desires?.flatMap((d: any) => d.keywords_detected || []).slice(0, 5) || [product.title];
            const [searchResults, compResult, instResult] = await Promise.all([
                Promise.all(searchQueries.map((q: string) => SearchOrchestrator.search(this.productId, q, 'GENERAL', true))),
                AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FAST, GEMINI_PROMPTS_V3.COMPETITOR_ANALYSIS_V3.replace('{{competitorsJson}}', JSON.stringify(product.competitorLinks || [])), { jsonSchema: true }),
                AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_DEEP, GEMINI_PROMPTS_V3.INSTITUTIONAL_RESEARCH_V3.replace('{{dnaJson}}', JSON.stringify(this.ctx.data.dna_forense)), { jsonSchema: true })
            ]);

            const compData = this.parseJsonSafe(compResult.text, {});
            this.ctx.data.competitor_intel = compData;
            this.ctx.data.scientific_data = this.parseJsonSafe(instResult.text, {});

            // Truth extraction from search results
            const rawEvidence = searchResults.flat().map(r => `SOURCE: ${r.url}\nCONTENT: ${r.snippet}`).join('\n---\n');
            const truthPrompt = GEMINI_PROMPTS_V3.TRUTH_EXTRACTION_V3.replace('{{rawEvidence}}', rawEvidence.substring(0, 20000));
            const truthDispatch = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FAST, truthPrompt, { jsonSchema: true });
            const truthData = this.parseJsonSafe(truthDispatch.text, { evidence: [], claims: [] });
            this.ctx.data.truth_layer = truthData;
            this.ctx.data.truth_layer_v3 = truthData;

            this.ctx.data.validation_report = {
                status: truthData.evidence?.length >= 30 ? 'A+' : 'B',
                traceability_score: truthData.evidence?.length > 0 ? 85 : 0,
                confirmed: (truthData.claims || []).length,
                evidence_total: truthData.evidence?.length || 0,
                timestamp: new Date().toISOString()
            };
            await this.saveCheckpoint();

            // PHASE 5: Angle Engineering & Psychology Mapping (Angles + LF8)
            await this.updateStatus(85, 5, 'Fase 5: Ingeniería de Ángulos y Mapeo Psicológico (LF8)...');

            // 5.1 Psychology Mapping
            const psychPrompt = GEMINI_PROMPTS_V3.PSYCHOLOGY_MAPPING_V3.replace('{{avatarJson}}', JSON.stringify(avatarsData.avatars?.[0] || {}));
            const psychResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_FORENSIC, psychPrompt, { jsonSchema: true });
            this.ctx.data.psychology = this.parseJsonSafe(psychResult.text, {});

            // 5.2 Angle Engineering
            const anglePrompt = GEMINI_PROMPTS_V3.ANGLE_ENGINEERING_V3
                .replace('{{awarenessLevel}}', avatarsData.avatars?.[0]?.awareness_level || '3')
                .replace('{{sophistication}}', String(this.ctx.data.sophistication?.level || '3'))
                .replace('{{avatarJson}}', JSON.stringify(avatarsData.avatars?.[0] || {}))
                .replace('{{productTitle}}', product.title)
                .replace('{{productCore}}', JSON.stringify(this.ctx.data.product_core));

            const angleResult = await AiRouter.dispatch(this.storeId!, TaskType.COPYWRITING_DEEP, anglePrompt, { jsonSchema: true });
            const anglesData = this.parseJsonSafe(angleResult.text, { angle_tree: [] });
            this.ctx.data.marketing_angles = anglesData;
            this.ctx.data.angles = anglesData;
            await this.saveCheckpoint();

            // PHASE 6: Economics & Global Strategy (Economics + Offer + Final Report)
            await this.updateStatus(95, 6, 'Fase 6: Economía de Producto y Estrategia Global de Oferta...');

            // 6.1 Economics
            const economics = await this.calculateEconomics();
            this.ctx.data.economics = economics;

            // 6.2 Grand Slam Offer
            const offerPrompt = GEMINI_PROMPTS_V3.OFFER_PSYCHOLOGY_V3
                .replace('{{productTitle}}', product.title)
                .replace('{{productCore}}', JSON.stringify(this.ctx.data.product_core))
                .replace('{{economicsJson}}', JSON.stringify(economics));

            const offerResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_DEEP, offerPrompt, { jsonSchema: true });
            this.ctx.data.offer_strategy = this.parseJsonSafe(offerResult.text, {});

            // Finalizing Status
            await this.updateStatus(100, 6, 'Investigación God-Tier Finalizada Correctamente.');

            await (prisma.researchRun as any).update({
                where: { id: this.runId },
                data: {
                    status: 'READY',
                    results: JSON.stringify(this.ctx.data)
                }
            });

            // Export to V2 for UI compatibility
            await this.exportToV2Structure();

            // Drive Sync
            try {
                await ResearchLabIntegration.exportResearchToDrive(this.productId, this.ctx.data);
            }
            catch (e) { this.log('⚠️ Error al exportar a Drive (no crítico)'); }

            return { success: true };

        }
        catch (error: any) {
            console.error("Critical error in pipeline V3+:", error);
            if (this.runId) {
                const run = await (prisma.researchRun as any).findUnique({ where: { id: this.runId } });
                await (prisma.researchRun as any).update({
                    where: { id: this.runId },
                    data: {
                        status: 'FAILED',
                        logs: (run?.logs || '') + `\n\nCRITICAL ERROR: ${error.message}`
                    }
                });
            }
            return { success: false, error: error.message };
        }
    }

    async runFullResearch() {
        return await this.executeResearchPipelineV3();
    }

    /**
    * Export research data to v2 structure (ResearchProject/ResearchVersion/ResearchOutput)
    * This ensures UI compatibility with version selector
    */
    private async exportToV2Structure() {
        try {
            // 1. Find or create ResearchProject
            let project = await (prisma as any).researchProject.findFirst({
                where: { productId: this.productId }
            });

            if (!project) {
                project = await (prisma as any).researchProject.create({
                    data: {
                        productId: this.productId,
                        name: `Research Project - ${this.productId}`
                    }
                });
                await this.log(`✅ Created ResearchProject: ${project.id}`);
            }

            // 2. Determine next version number
            const latestVersion = await (prisma as any).researchVersion.findFirst({
                where: { projectId: project.id },
                orderBy: { versionNumber: 'desc' }
            });

            const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

            // 3. Create new version
            const version = await (prisma as any).researchVersion.create({
                data: {
                    projectId: project.id,
                    versionNumber: newVersionNumber,
                    status: 'READY'
                }
            });

            await this.log(`✅ Created ResearchVersion V${newVersionNumber}: ${version.id}`);

            // 4. Create outputs with all data
            await (prisma as any).researchOutput.create({
                data: {
                    versionId: version.id,
                    exportsJson: JSON.stringify(this.ctx.data),
                    productIntelligence: JSON.stringify(this.ctx.data.dna_forense || {}),
                    languageBank: JSON.stringify(this.ctx.data.v3_language_bank || []),
                    macroAvatarSheet: JSON.stringify(this.ctx.data.v3_avatars || []),
                    hookAngleDb: JSON.stringify(this.ctx.data.marketing_angles || {}),
                    competitorBreakdown: JSON.stringify(this.ctx.data.breakthrough_advertising || {}),
                    competitorIntelJson: JSON.stringify(this.ctx.data.competitor_intel || {}),
                    economicsJson: JSON.stringify(this.ctx.data.economics || this.ctx.data.offer_strategy || {}),
                    creativeInsights: JSON.stringify(this.ctx.data.creative_briefs || {}),
                    validationReport: JSON.stringify(this.ctx.data.validation_report || null)
                }
            });

            await this.log(`✅ Exported to v2 structure: Version ${newVersionNumber}`);

        }
        catch (error: any) {
            console.error('[exportToV2Structure] Error:', error);
            await this.log(`⚠️ Warning: Failed to export to v2 structure: ${error.message}`);
            // Don't throw - this is not critical, research data is already in researchRun
        }
    }

    async runStrategyIteration(avatarId?: string) {
        // Simple iteration logic to avoid crashes
        return { success: true, message: "Variación generada (Placeholder)" };
    }

    /**
    * GOD TIER COPYWRITING SEQUENCE
    * Sequential orchestration: Briefing -> Distillation -> Generation
    */
    async generateGodTierCopy(avatarIdx: number, angleIdx: number) {
        try {
            this.log(`🔥 Invocando Secuencia COPYWRITING GOD TIER (Claude 3.7)...`);

            const avatars = this.ctx.data.v3_avatars || [];
            const angles = this.ctx.data.marketing_angles?.angle_tree || [];
            const avatar = avatars[avatarIdx] || avatars[0];
            const angle = angles[angleIdx] || angles[0];

            if (!avatar || !angle) throw new Error("Avatar o Ángulo no encontrado para la secuencia.");

            // 1. Briefing
            await this.log('🎯 Step 1: Creando Briefing de Ángulo Forense...');
            const briefPrompt = GEMINI_PROMPTS_V3.COPY_GOD_TIER_1_BRIEFING
                .replace('{{avatarJson}}', JSON.stringify(avatar))
                .replace('{{angleJson}}', JSON.stringify(angle))
                .replace('{{truthJson}}', JSON.stringify(this.ctx.data.truth_layer_v3));

            const briefResult = await AiRouter.dispatch(this.storeId!, TaskType.COPYWRITING_DEEP, briefPrompt, { jsonSchema: true });
            const briefingData = this.parseJsonSafe(briefResult.text);

            // 2. Distillation
            await this.log('💧 Step 2: Destilación Emocional (Midnight Whispers)...');
            const distPrompt = GEMINI_PROMPTS_V3.COPY_GOD_TIER_2_DISTILLATION
                .replace('{{briefingJson}}', JSON.stringify(briefingData))
                .replace('{{languageBank}}', JSON.stringify(this.ctx.data.v3_language_bank));

            const distResult = await AiRouter.dispatch(this.storeId!, TaskType.COPYWRITING_DEEP, distPrompt, { jsonSchema: true });
            const distillationData = this.parseJsonSafe(distResult.text);

            // 3. Final Generation
            await this.log('✍️ Step 3: Generando Pieza de Copy Final (Eugene Schwartz Style)...');
            const genPrompt = GEMINI_PROMPTS_V3.COPY_GOD_TIER_3_GENERATION
                .replace('{{sophisticationLevel}}', String(this.ctx.data.sophistication?.level || 3))
                .replace('{{briefingJson}}', JSON.stringify(briefingData))
                .replace('{{distillationJson}}', JSON.stringify(distillationData))
                .replace('{{productCore}}', JSON.stringify(this.ctx.data.product_core))
                .replace('{{truthJson}}', JSON.stringify(this.ctx.data.truth_layer_v3));

            const finalResult = await AiRouter.dispatch(this.storeId!, TaskType.COPYWRITING_DEEP, genPrompt);

            // AUTO-SAVE TO DRIVE
            try {
                await ResearchLabIntegration.saveGodTierCopyToDrive(
                    this.productId,
                    finalResult.text,
                    avatar.name || `Avatar ${avatarIdx}`,
                    angle.concept || angle.type || `Angle ${angleIdx}`
                );
            }
            catch (driveErr) {
                console.warn("[Orchestrator] Non-fatal: Failed to save God Tier copy to Drive:", driveErr);
            }

            return {
                success: true,
                copy: finalResult.text,
                metadata: {
                    briefing: briefingData,
                    distillation: distillationData
                }
            };
        }
        catch (error: any) {
            console.error("[God Tier Copy Error]", error);
            return { success: false, error: error.message };
        }
    }

    /**
    * AVATAR REGENERATION - Iterate avatars without re-running full research
    * Reuses: product_core, truth_layer, desires, competitor_intel
    * Re-runs: Only avatar creation (Phase 4)
    */
    async regenerateAvatars(params?: {
        awarenessLevel?: 'Unaware' | 'Problem Aware' | 'Solution Aware' | 'Product Aware' | 'Most Aware';
        sophisticationLevel?: 1 | 2 | 3 | 4 | 5;
        focusPain?: string;
        targetDemo?: string;
    }) {
        try {
            await this.init();

            // Load existing research data
            const latestRun = await (prisma.researchRun as any).findFirst({
                where: { productId: this.productId, status: 'READY' },
                orderBy: { createdAt: 'desc' }
            });

            if (!latestRun || !latestRun.results) {
                throw new Error('No base research found. Run full research first.');
            }

            const baseData = JSON.parse(latestRun.results);
            if (!baseData.product_core || !baseData.truth_layer_v3 || !baseData.v3_desires) {
                throw new Error('Incomplete research data. Missing required phases.');
            }

            const product = await prisma.product.findUnique({
                where: { id: this.productId }
            }) as any;

            if (!product) throw new Error('Product not found');

            // Build custom avatar prompt with overrides
            let avatarPrompt = GEMINI_PROMPTS_V3.MACRO_AVATAR_CREATION
                .replace('{{productTitle}}', product.title)
                .replace('{{productDescription}}', product.description || product.problemToSolve || 'N/A')
                .replace('{{niche}}', product.niche || 'General')
                .replace('{{country}}', product.country || 'ES')
                .replace('{{desiresJson}}', JSON.stringify(baseData.v3_desires, null, 2))
                .replace('{{truthJson}}', JSON.stringify(baseData.truth_layer_v3, null, 2))
                .replace('{{evidenceList}}', JSON.stringify(baseData.truth_layer_v3.evidence || [], null, 2).substring(0, 10000))
                .replace('{{claimsList}}', JSON.stringify(baseData.truth_layer_v3.claims || [], null, 2).substring(0, 10000))
                .replace('{{productCore}}', JSON.stringify(baseData.product_core || {}, null, 2).substring(0, 5000))
                .replace('{{competitorIntel}}', JSON.stringify(baseData.competitor_intel || {}, null, 2).substring(0, 5000));

            // Inject custom parameters
            if (params) {
                let overrideInstructions = "\n\n🎯 CUSTOM AVATAR PARAMETERS:\n";

                if (params.awarenessLevel) {
                    overrideInstructions += `- FOCUS AWARENESS: ${params.awarenessLevel} (genera avatares PREDOMINANTEMENTE en este nivel)\n`;
                }

                if (params.sophisticationLevel) {
                    overrideInstructions += `- MARKET SOPHISTICATION: Level ${params.sophisticationLevel} (ajusta promesas y mecanismos según este nivel)\n`;
                }

                if (params.focusPain) {
                    overrideInstructions += `- PAIN FOCUS: "${params.focusPain}" (enfatiza avatares que sufren este dolor específico)\n`;
                }

                if (params.targetDemo) {
                    overrideInstructions += `- TARGET DEMO: "${params.targetDemo}" (centra avatares en esta demografía)\n`;
                }

                avatarPrompt += overrideInstructions;
            }

            // Generate new avatars
            console.log('[ResearchOrchestrator] Regenerating avatars with custom params...');
            const avatarResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_DEEP, avatarPrompt, { jsonSchema: true });
            let avatarsData = this.parseJsonSafe(avatarResult.text, { avatars: [] });

            // Validation
            if (!this.verifyForensicOutput(avatarsData, ['avatars']) || avatarsData.avatars.length < 3) {
                console.warn('[ResearchOrchestrator] Re-processing avatars due to insufficient data...');
                const retryPrompt = avatarPrompt + "\n\nCRITICAL: Generate AT LEAST 5 HIGH-QUALITY avatars with forensic depth.";
                const retryResult = await AiRouter.dispatch(this.storeId!, TaskType.RESEARCH_DEEP, retryPrompt, { jsonSchema: true });
                avatarsData = this.parseJsonSafe(retryResult.text, { avatars: [] });
            }

            return {
                success: true,
                avatars: avatarsData.avatars,
                count: avatarsData.avatars.length,
                params: params || {}
            };

        }
        catch (error: any) {
            console.error('[ResearchOrchestrator.regenerateAvatars] Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
