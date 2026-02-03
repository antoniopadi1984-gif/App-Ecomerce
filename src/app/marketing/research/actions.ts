"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";

/**
 * Research OS: Evidence-Based Market Research
 */

export async function ingestSource(productId: string, data: { url?: string, content?: string, type: 'URL' | 'TEXT' }) {
    try {
        // Enforce Evidence-First: Extract metadata
        let citationText = "Ingreso manual";
        let sourceDate = new Date();

        if (data.type === 'TEXT' && data.content) {
            const metaPrompt = `
                Analiza este contenido pegado y extrae METADATA si existe.
                Contenido: ${data.content.substring(0, 1000)}
                
                JSON: { "sourceName": "...", "date": "YYYY-MM-DD" }
            `;
            try {
                const metaRes = await askGemini(metaPrompt, "Eres un extractor de metadata.");
                const meta = JSON.parse(metaRes.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
                if (meta.sourceName) citationText = meta.sourceName;
                if (meta.date) sourceDate = new Date(meta.date);
            } catch (e) { /* Fallback defaults */ }
        }

        const source = await (prisma as any).researchSource.create({
            data: {
                productId,
                url: data.url,
                content: data.content,
                type: data.type,
                citationText,
                sourceDate
            }
        });
        revalidatePath(`/marketing/research/${productId}`);
        return source;
    } catch (error: any) {
        throw new Error(`Error al ingerir fuente: ${error.message}`);
    }
}

export async function runFullResearch(productId: string) {
    try {
        const sources = await (prisma as any).researchSource.findMany({ where: { productId } });
        const allContent = sources.map((s: any) => s.content).join("\n\n---\n\n");

        // Agent Researcher: Deep Analysis for Run
        const researchPrompt = `
            Actúa como un Consultor de Inteligencia de Mercado Senior.
            Analiza estas fuentes y genera un RESEARCH RUN completo.
            
            FUENTES: ${allContent.substring(0, 20000)}
            
            NECESITO (JSON):
            {
               "summary": "Resumen ejecutivo de 3 párrafos",
               "avatarMatrix": [
                  { "id": "A", "label": "Consciente Escéptico", "traits": "...", "strategy": "..." },
                  { "id": "B", "label": "Desesperado Novato", "traits": "...", "strategy": "..." },
                  { "id": "C", "label": "Comparador Racional", "traits": "...", "strategy": "..." }
               ],
               "objectionHeatmap": [
                  { "objection": "No funciona", "impact": "HIGH", "placement": "HERO/FAQS" },
                  { "objection": "Muy caro", "impact": "MEDIUM", "placement": "OFFER" }
               ],
               "marketMechanism": "El mecanismo actual detectado en el mercado vs el que podemos proponer",
               "sophistication": "1-5",
               "awareness": "O1-O5",
               "quotes": [
                  { "text": "...", "category": "PAIN/DESIRE/OBJECTION", "citation": "..." }
               ]
            }
        `;

        const response = await askGemini(researchPrompt, "Eres un analista de mercado de élite.");
        const data = JSON.parse(response.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        // Save Run
        const run = await (prisma as any).researchRun.create({
            data: {
                productId,
                summary: data.summary,
                results: JSON.stringify(data),
                avatarMatrix: JSON.stringify(data.avatarMatrix),
                objectionHeatmap: JSON.stringify(data.objectionHeatmap),
                marketMechanism: data.marketMechanism,
                sophistication: data.sophistication,
                awareness: data.awareness,
                sourcesSnapshot: JSON.stringify(sources.map((s: any) => s.id))
            }
        });

        // Update main research profile
        await (prisma as any).avatarResearch.create({
            data: {
                productId,
                levelOfAwareness: data.awareness,
                sophistication: data.sophistication,
                desires: data.summary,
                whyItSells: data.marketMechanism,
            }
        });

        // Save Quotes (Live VOC)
        if (data.quotes?.length) {
            await (prisma as any).voiceOfCustomerQuote.createMany({
                data: data.quotes.map((q: any) => ({
                    productId,
                    text: q.text,
                    category: q.category,
                    citationText: q.citation
                }))
            });
        }

        revalidatePath(`/marketing/research`);
        return run;
    } catch (error: any) {
        throw new Error(`Error en investigación profunda: ${error.message}`);
    }
}

export async function analyzeCompetitorLanding(productId: string, url: string) {
    try {
        const prompt = `
            Analiza estructuralmente esta URL de la competencia: ${url}
            (Simula que has navegado y capturado el esqueleto estratégico).
            
            Usa frameworks: Breakthrough Advertising y Hormozi.
            
            NECESITO (JSON):
            {
               "avatar": "...",
               "awareness": "...",
               "angle": "...",
               "promise": "...",
               "objectionsTreated": "...",
               "structureJson": "JSON array de bloques [ { \"type\": \"hero\", \"content\": \"...\" }, ... ]",
               "cta": "...",
               "opportunityScore": 0-100
            }
        `;
        const res = await askGemini(prompt, "Eres un espía industrial experto en landing pages.");
        const data = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        const capture = await (prisma as any).competitorLanding.create({
            data: {
                productId,
                url,
                avatar: data.avatar,
                awareness: data.awareness,
                angle: data.angle,
                promise: data.promise,
                objectionsTreated: data.objectionsTreated,
                structureJson: data.structureJson,
                cta: data.cta,
                opportunityScore: data.opportunityScore,
                status: "ANALYZED"
            }
        });

        revalidatePath(`/marketing/research`);
        return capture;
    } catch (error: any) {
        throw new Error(`Error al analizar competencia: ${error.message}`);
    }
}

export async function runAnglePressureTest(angleId: string) {
    try {
        const angle = await (prisma as any).marketingAngle.findUnique({ where: { id: angleId } });
        if (!angle) throw new Error("Ángulo no encontrado");

        const prompt = `
            Actúa como un Crítico de Marketing Despiadado.
            Evalúa este ÁNGULO DE VENTA en 5 ejes (0-100%):
            
            ÁNGULO: ${angle.title}
            HOOK: ${angle.hook}
            
            NECESITO (JSON):
            {
               "saturation": 0-100,
               "rejectionRisk": 0-100,
               "codRisk": 0-100 (Riesgo de que el cliente no pague en COD por falsas expectativas),
               "alignment": 0-100,
               "clarity": 0-100,
               "verdict": "Saturated / Opportunity / Risky",
               "improvement": "Sugerencia de mejora"
            }
        `;

        const res = await askGemini(prompt, "Eres un validador de ángulos de marketing.");
        const data = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        const updated = await (prisma as any).marketingAngle.update({
            where: { id: angleId },
            data: {
                saturationScore: data.saturation,
                status: data.verdict.toUpperCase(),
                // We'll store other axes in results or separate fields if needed.
                // For now, let's update status and score.
            }
        });

        revalidatePath(`/marketing/research`);
        return data;
    } catch (error: any) {
        throw new Error(`Error en Pressure Test de Ángulo: ${error.message}`);
    }
}

export async function getResearchData(productId: string) {
    const [sources, quotes, angles, research, runs, competitorLandings] = await Promise.all([
        (prisma as any).researchSource.findMany({ where: { productId } }),
        (prisma as any).voiceOfCustomerQuote.findMany({ where: { productId } }),
        (prisma as any).marketingAngle.findMany({ where: { productId } }),
        (prisma as any).avatarResearch.findFirst({ where: { productId }, orderBy: { createdAt: 'desc' } }),
        (prisma as any).researchRun.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } }),
        (prisma as any).competitorLanding.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } })
    ]);

    return { sources, quotes, angles, research, runs, competitorLandings };
}

export async function calculateResearchDelta(productId: string) {
    try {
        const researches = await (prisma as any).avatarResearch.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 2
        });

        if (researches.length < 2) return { delta: "No hay datos suficientes para comparar." };

        const deltaPrompt = `
            Compara estas dos investigaciones de mercado para el mismo producto y dime QUÉ HA CAMBIADO.
            Investigación A (Nueva): ${researches[0].fears} / ${researches[0].desires}
            Investigación B (Vieja): ${researches[1].fears} / ${researches[1].desires}
            
            NECESITO:
            - Nuevas oportunidades detectadas.
            - Cambios en el lenguaje del consumidor.
            - Alertas de competencia.
        `;

        const response = await askGemini(deltaPrompt, "Eres un analista de mercado experto en detectar tendencias.");
        return { delta: response.text };
    } catch (error: any) {
        throw new Error(`Error en Research Delta: ${error.message}`);
    }
}

export async function detectAngleFatigue(productId: string) {
    try {
        const angles = await (prisma as any).marketingAngle.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Anti-Fatiga Logic: Find repeated hooks or patterns
        const repeatedHooks = angles.filter((a: any, i: number, self: any[]) =>
            self.findIndex((t: any) => t.hook === a.hook) !== i
        );

        if (repeatedHooks.length > 2) {
            return { fatigue: true, alert: "ALERTA AMARILLA: Se están repitiendo hooks similares. Sugerido cambio de ángulo." };
        }
        return { fatigue: false };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function generateLanguageMap(productId: string) {
    try {
        const quotes = await (prisma as any).voiceOfCustomerQuote.findMany({ where: { productId } });
        const allVoc = quotes.map((q: any) => q.text).join("\n");

        const mapPrompt = `
            Actúa como un Antropólogo de Marketing.
            Analiza este lenguaje del cliente y crea un MAPA DE LENGUAJE REAL.
            
            COMENTARIOS: ${allVoc.substring(0, 10000)}
            
            NECESITO (JSON):
            {
               "metaphorUsed": ["...", "..."],
               "prohibitedWords": ["...", "..."], // Palabras que activan el radar de 'vendedor'
               "trustSignals": ["...", "..."],
               "typicalPhrases": ["...", "..."],
               "emotionalJourney": {
                  "before": "Estado emocional previo",
                  "during": "Estado emocional compra",
                  "after": "Estado emocional post-consumo"
               }
            }
        `;

        const res = await askGemini(mapPrompt, "Eres un analista de lenguaje experto.");
        const data = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export async function generateWhyNotBuy(productId: string) {
    try {
        const product = await (prisma as any).product.findUnique({ where: { id: productId } });
        const runs = await (prisma as any).researchRun.findMany({ where: { productId }, take: 1, orderBy: { createdAt: 'desc' } });

        const prompt = `
            Actúa como un Consultor de Honestidad Brutal.
            Genera una sección de "POR QUÉ NO COMPRAR" para el producto: ${product.title}.
            Objetivo: Generar confianza absoluta filtrando a los clientes que NO encajan.
            
            NECESITO (JSON):
            {
               "redFlags": ["Si buscas X, este no es tu producto", "Si esperas Y resultados mágicos, no compres"],
               "honestLogic": "Explicación de por qué decimos esto",
               "trustResult": "Cómo esto aumenta la creencia en el avatar ideal"
            }
        `;

        const res = await askGemini(prompt, "Eres un estratega de conversión por honestidad.");
        return JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (e: any) {
        throw new Error(e.message);
    }
}
