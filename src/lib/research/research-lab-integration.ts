import { DriveSync } from './drive-sync';
import { prisma } from '../prisma';

/**
 * RESEARCH LAB INTEGRATION
 * 
 * When a product is created in Research Lab → automatically create full Drive structure
 */

export class ResearchLabIntegration {

    /**
     * Called after Research Lab creates a product
     */
    static async onProductCreated(productId: string): Promise<{
        success: boolean;
        driveStructure?: Record<string, string>;
        error?: string;
    }> {

        console.log('[ResearchLab] Creating Drive structure for product:', productId);

        try {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: {
                    title: true,
                    country: true,
                    driveFolderId: true
                }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            // Skip if structure already exists
            if (product.driveFolderId) {
                console.log('[ResearchLab] Drive structure already exists');
                return { success: true };
            }

            // Create complete folder structure
            const driveSync = new DriveSync();
            const folderMap = await driveSync.createProductStructure(
                productId,
                product.title,
                product.country || 'ES'
            );

            console.log('[ResearchLab] ✅ Drive structure created');

            return {
                success: true,
                driveStructure: folderMap
            };

        } catch (error: any) {
            console.error('[ResearchLab] Failed to create Drive structure:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export research results to Drive
     */
    static async exportResearchToDrive(
        productId: string,
        researchData: any
    ): Promise<void> {

        console.log('[ResearchLab] 📤 Exporting GOD TIER research to Drive...');

        try {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { driveFolderId: true, title: true, productFamily: true }
            });

            if (!product?.driveFolderId) {
                console.warn('[ResearchLab] ⚠️ No Drive folder - skipping export');
                return;
            }

            const driveSync = new DriveSync();
            const drive = await driveSync['getDrive']();

            // Find or create RESEARCH subfolder
            const researchFolderQuery = `mimeType='application/vnd.google-apps.folder' and name='RESEARCH' and '${product.driveFolderId}' in parents and trashed=false`;
            const resFolders = await drive.files.list({ q: researchFolderQuery, fields: 'files(id)' });
            const researchFolderId = resFolders.data.files?.[0]?.id || product.driveFolderId;

            const uploadDoc = async (name: string, content: string) => {
                try {
                    // We use application/vnd.google-apps.document to force conversion to Google Doc
                    await drive.files.create({
                        requestBody: {
                            name,
                            parents: [researchFolderId],
                            mimeType: 'application/vnd.google-apps.document'
                        },
                        media: {
                            mimeType: 'text/markdown',
                            body: content
                        }
                    });
                } catch (e) {
                    console.error(`Error uploading ${name}:`, e);
                }
            };

            // Parallelized Uploads
            const exportPromises: Promise<void>[] = [];

            // --- 00. MASTER STRATEGY BIBLE ---
            const masterContent = `# 🏆 GOD TIER STRATEGY BIBLE: ${product.title}
PRODUCT FAMILY: ${product.productFamily || 'N/A'}
DATE: ${new Date().toLocaleDateString()}

## 1. CORE IDENTITY
${researchData.product_core?.identity?.definition || 'Análisis de identidad pendiente.'}

## 2. UNIQUE MECHANISM
${researchData.product_core?.solution_mechanism?.unique_method || 'Mecanismo no definido.'}

## 3. PRIMARY EMOTIONAL HOOK
${researchData.v3_desires?.primary_emotional_hook || 'Buscando gancho emocional...'}

## 4. MARKET SOPHISTICATION (Schwartz)
Level: ${researchData.breakthrough_advertising?.market_sophistication?.level || '3'}
Justification: ${researchData.breakthrough_advertising?.market_sophistication?.justification || 'N/A'}

## 5. WINNING AVATAR
${researchData.v3_avatars?.[0]?.name || 'N/A'} - ${researchData.v3_avatars?.[0]?.awareness_level || 'N/A'}
Core Pain: ${researchData.v3_avatars?.[0]?.core_pain || 'N/A'}

## 6. STRATEGIC POSITIONING
${researchData.product_core?.market_intelligence?.positioning_angle || 'En desarrollo...'}
`;
            exportPromises.push(uploadDoc('00_BIBLIA_ESTRATEGICA_MASTER', masterContent));

            // --- 00.1 CREATIVE BRIEF ---
            const creativeBrief = `# 🎬 CREATIVE BRIEF: STRATEGIC DIRECTION
PRODUCT: ${product.title}
WINNING AVATAR: ${researchData.v3_avatars?.[0]?.name || 'N/A'}

## PSICOLOGÍA DEL GANCHO (HOOKS)
1. **Deseo:** ${researchData.v3_avatars?.[0]?.core_desire || 'N/A'}
2. **Dolor:** ${researchData.v3_avatars?.[0]?.core_pain || 'N/A'}

## ELEMENTOS VISUALES RECOMENDADOS
- Escenas de: ${researchData.product_core?.creative_guidelines?.visual_hooks || 'N/A'}
- Tono: ${researchData.product_core?.creative_guidelines?.tone || 'Profesional / Directo'}

## COPYS MAESTROS (VOC)
${(researchData.voc?.dictionary || []).slice(0, 5).map((d: any) => `- "${d.phrase}"`).join('\n')}

---
*Este documento es la base para el Laboratorio de Video.*
`;
            exportPromises.push(uploadDoc('00_BRIEFING_CREATIVO', creativeBrief));

            // --- 00.2 VISUAL IDENTITY GUIDE ---
            if (researchData.visual_branding) {
                const vb = researchData.visual_branding;
                const visualGuide = `# 🎨 GUÍA DE IDENTIDAD VISUAL: ${product.title}
## 1. PALETA DE COLORES
- **Primario:** ${vb.palette?.primary || '#000000'}
- **Secundario:** ${vb.palette?.secondary || '#FFFFFF'}
- **Acento:** ${vb.palette?.accent || '#FF0000'}

**Psicología:** ${vb.palette?.rationale || 'N/A'}

## 2. TIPOGRAFÍA RECOMENDADA
- **Titulares:** ${vb.typography?.heading || 'Sans-serif'}
- **Cuerpo:** ${vb.typography?.body || 'Serif'}

**Notas de Estilo:** ${vb.typography?.style_notes || 'N/A'}

## 3. DIRECCIÓN CREATIVA (VISUAL STYLE)
**Estilo de Anuncios:** ${vb.visual_style?.creative_direction || 'N/A'}
**Iluminación y Vibe:** ${vb.visual_style?.lighting_and_vibe || 'N/A'}
**Diferenciación Visual:** ${vb.visual_style?.competitor_contrast || 'N/A'}

## 4. PACKAGING & LOGO
**Sugerencias de Empaque:** ${vb.packaging_guidelines || 'N/A'}
**Análisis de Logo:** ${vb.logo_critique_or_suggestion || 'N/A'}

---
*Esta guía debe ser entregada al Editor de Video y Diseñador Web.*
`;
                exportPromises.push(uploadDoc('00_GUIA_IDENTIDAD_VISUAL', visualGuide));
            }

            // --- 01. ADN PRODUCTO ---
            if (researchData.product_core) {
                const pc = researchData.product_core;
                const content = `# 🧬 PRODUCT CORE FORENSIC: ${product.title}
## Identidad & Propósito
${pc.identity?.definition || 'N/A'}
## El Mecanismo (The How)
**Método:** ${pc.solution_mechanism?.unique_method || 'N/A'}
**Pruebas de Superioridad:**
${(pc.solution_mechanism?.superiority_claims || []).map((c: string) => `- ${c}`).join('\n')}
## Problemas que Elimina
**Funcionales:** ${(pc.problem_solving?.functional_problems || []).join(', ')}
**Emocionales:** ${(pc.problem_solving?.emotional_problems || []).join(', ')}
## Promesa de Transformación
${pc.transformation_promise || 'N/A'}
`;
                exportPromises.push(uploadDoc('01_CORE_FORENSIC', content));
            }

            // --- 02. TRUTH LAYER ---
            if (researchData.truth_layer_v3) {
                const tl = researchData.truth_layer_v3;
                const vr = researchData.validation_report || {};
                const content = `# ⚖️ TRUTH LAYER (EVIDENCIAS REALES)
## Score de Validación: ${vr.status || 'N/A'} (${vr.traceability_score || 0}%)
## Claims Verificados
${(tl.claims || []).map((c: any) => `### [${c.category}] ${c.claim}\n- Evidencias: ${c.evidence_ids?.length || 0}`).join('\n\n')}
## Repositorio de Evidencias (Raw Quotes)
${(tl.evidence || []).map((e: any) => `> "${e.quote}"\n> — *Source: ${e.source_url || 'N/A'}*`).join('\n\n')}
`;
                exportPromises.push(uploadDoc('02_TRUTH_LAYER_VERIFIED', content));
            }

            // --- 03. AVATAR MATRIX ---
            if (researchData.v3_avatars) {
                const content = `# 👥 MATRIZ DE AVATARES PSICOGRÁFICOS
${(researchData.v3_avatars || []).map((a: any, i: number) => `
## Avatar #${i + 1}: ${a.name}
**Nivel de Consciencia:** ${a.awareness_level}
**Deseo Profundo:** ${a.core_desire || a.desire}
**Dolor Agudo:** ${a.core_pain}
**Diálogo Interno:** "${a.internal_dialogue}"
**Matriz de Creencias:**
${(a.beliefs_system || a.beliefs || []).map((b: string) => `- ${b}`).join('\n')}
`).join('\n---\n')}
`;
                exportPromises.push(uploadDoc('03_AVATAR_MATRIX', content));
            }

            // --- 04. LANGUAGE BANK (VOC) ---
            if (researchData.v3_language_bank) {
                const content = `# 🗣️ LINGUISTIC INTELLIGENCE (VOC)
## Expresiones de Dolor (Pains)
${(researchData.voc?.dictionary || []).filter((d: any) => d.emotion === 'INTENSE').map((d: any) => `- "${d.phrase}"`).join('\n').substring(0, 5000)}
## Objeciones & Escepticismo
${(researchData.voc?.objections || []).map((o: any) => `- **Trigger:** ${o.trigger || o}\n  **Counter:** ${o.counter || ''}`).join('\n')}
## Clusters de Esperanza
${(researchData.voc?.desires || []).map((d: any) => `- ${d.name || d}`).join('\n')}
`;
                exportPromises.push(uploadDoc('04_LANGUAGE_BANK', content));
            }

            // --- 05. ANGLES & HOOKS ---
            if (researchData.marketing_angles?.angle_tree) {
                const content = `# 🏹 INGENIERÍA DE ÁNGULOS
${(researchData.marketing_angles.angle_tree || []).map((a: any, i: number) => `
## ÁNGULO #${i + 1}: ${a.type} [${a.spencer_angle_code || 'N/A'}]
**Concepto:** ${a.concept}
**Lead (Apertura):** "${a.lead_lines}"
### Hooks Sugeridos:
${(a.hooks || []).map((h: any) => `- **${h.spencer_hook_code || 'N/A'}**: ${h.text || h} (${h.logic || ''})`).join('\n')}
`).join('\n---\n')}
`;
                exportPromises.push(uploadDoc('05_MARKETING_ANGLES', content));
            }

            // --- 06. ECONOMÍA Y OFERTA ---
            if (researchData.economics || researchData.offer_strategy) {
                const econ = researchData.economics || {};
                const offer = researchData.offer_strategy || {};
                const content = `# 💰 ECONOMÍA Y ESTRATEGIA DE OFERTA
## Diagnóstico Financiero
- **Unit Cost (Real):** €${econ.unit_cost || 0}
- **Envío:** €${econ.shipping_cost || 0}
- **Coste Total:** €${econ.total_cost || 0}
- **Precio Actual:** €${econ.current_price || 0}
- **Margen:** €${econ.margin_value || 0} (${econ.margin_percent || 0}%)
## Límites Publicitarios
- **CPA Máximo (70%):** €${econ.cpa_limit || 0}
- **Break-Even ROAS:** x${econ.break_even_roas || 0}
## Escenarios de Escalado
${(econ.scenarios || []).map((s: any) => `### Escenario: ${s.name}\n- **PVP:** €${s.price}\n- **Margen:** ${s.margin}\n- **Posicionamiento:** ${s.positioning}`).join('\n\n')}
## Estrategia de Oferta Irresistible
${JSON.stringify(offer, null, 2).substring(0, 5000)}
`;
                exportPromises.push(uploadDoc('06_ECONOMIA_OFERTA', content));
            }

            // --- 07. ANÁLISIS DE COMPETENCIA ---
            if (researchData.competitor_intel) {
                const ci = researchData.competitor_intel;
                const content = `# 🕵️ INTELIGENCIA COMPETITIVA
## Brecha de Mercado
${ci.market_gap_analysis || 'N/A'}
## Desglose por Competidor
${(ci.competitor_breakdowns || []).map((c: any) => `### ${c.name || 'Competidor'}\n- **PVP:** ${c.price || 'N/A'}\n- **Promesa:** ${c.main_promise || 'N/A'}\n- **Debilidad:** ${c.detected_weakness || 'N/A'}`).join('\n\n')}
## Claims Dominantes en el Nicho
${(ci.dominant_claims || []).map((cl: string) => `- ${cl}`).join('\n')}
`;
                exportPromises.push(uploadDoc('07_COMPETENCIA', content));
            }

            // Wait for all exports to finish
            await Promise.all(exportPromises);

            console.log(`[ResearchLab] ✅ Documentos exportados a Drive (Formato Google Docs)`);

        } catch (error) {
            console.error('[ResearchLab] ❌ Failed to export research:', error);
        }
    }

    /**
     * Save a generated God Tier copy piece to Drive
     */
    static async saveGodTierCopyToDrive(productId: string, copyContent: string, avatarName: string, angleName: string): Promise<void> {
        try {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { driveFolderId: true }
            });

            if (!product?.driveFolderId) return;

            const driveSync = new DriveSync();
            const drive = await driveSync['getDrive']();

            // Find SCRIPTS subfolder
            const scriptsQuery = `mimeType='application/vnd.google-apps.folder' and name='SCRIPTS' and '${product.driveFolderId}' in parents and trashed=false`;
            const resFolders = await drive.files.list({ q: scriptsQuery, fields: 'files(id)' });
            let scriptsFolderId = resFolders.data.files?.[0]?.id;

            if (!scriptsFolderId) {
                scriptsFolderId = product.driveFolderId;
            }

            const fileName = `GOD_TIER_${avatarName.toUpperCase().replace(/\s+/g, '_')}_${angleName.toUpperCase().replace(/\s+/g, '_')}_${new Date().getTime()}`;

            await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [scriptsFolderId],
                    mimeType: 'application/vnd.google-apps.document'
                },
                media: {
                    mimeType: 'text/markdown',
                    body: `# 🧙‍♂️ GOD TIER COPY (CLAUDE 3.7)
                    
**AVATAR:** ${avatarName}
**ÁNGULO:** ${angleName}
**FECHA:** ${new Date().toLocaleString()}

---

${copyContent}

---
*Generado mediante Secuencia Forense 3-Step*
`
                }
            });

            console.log(`[ResearchLab] ✅ God Tier Copy guardado en Drive: ${fileName}`);

        } catch (error) {
            console.error('[ResearchLab] Failed to save copy to Drive:', error);
        }
    }
}
