"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Estructura de Folders & Organización
export async function getCreativeFolders() {
    try {
        // Simulación de sistema de carpetas si no existe en DB aún
        // Idealmente crearíamos un modelo 'CreativeFolder'
        // Por ahora, agruparemos por 'Concept' o 'Product'

        const products = await prisma.product.findMany({
            include: {
                creatives: true
            }
        });

        return { success: true, data: products };
    } catch (error) {
        return { success: false, error: "Failed to fetch folders" };
    }
}

// 2. Auditoría Profunda de Video Creativo (Ingeniería Inversa de Ventas)
export async function auditVideoCreative(videoAssetId: string, competitorReference?: string) {
    // Legacy support, redirecting to real audit if possible or keeping mock for testing
    return { success: false, message: "Utiliza runMasterAudit para análisis real." };
}

export async function runMasterAudit(params: {
    productName: string,
    targetCountry: string,
    competitorUrls: string,
    imageBase64?: string
}) {
    const { askGemini } = await import("@/lib/ai");

    const prompt = `
        ACTÚA COMO: Media Buyer de Élite + Analista Forense de Marketing (Experto en Eugene Schwartz y Robert Cialdini).
        
        OBJETIVO: Realizar una AUDITORÍA MAESTRA (Master Protocol v4.2) para el producto "${params.productName}".
        TARGET: ${params.targetCountry || "Cualquier país"}
        REFERENCIAS COMPETENCIA: ${params.competitorUrls}

        METODOLOGÍA:
        1. Determinar el NIVEL DE CONCIENCIA del Avatar (O1-O5 según Schwartz).
        2. Determinar la SOFISTICACIÓN DEL MERCADO (1-5).
        3. Realizar Ingeniería Inversa del ángulo de venta.
        4. Identificar el Mecanismo Único (Unique Mechanism).

        ESTRUCTURA DE RESPUESTA (JSON estricto):
        {
            "landingAlignment": "Óptima/Media/Baja",
            "reasoning": "Explicación profunda de la coherencia mensaje-mercado",
            "suggestions": ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"],
            "audit": {
                "metadata": {
                    "transcription": "Resumen forense del guión/mensaje detectado",
                    "hookType": "Ej: Disruptor de Patrón, Desafío Directo, Curiosidad Pura"
                },
                "marketingAnalysis": {
                    "levelOfAwareness": "Descripción detallada (ej: O3 - Problem Aware)",
                    "marketSophistication": "Nivel X - Explicación de por qué",
                    "replicationStrategy": "Plan de acción exacto para replicar y mejorar el ángulo",
                    "structure": [
                        { "time": "0-3s", "segment": "HOOK", "description": "Descripción de la acción inicial" },
                        { "time": "3-15s", "segment": "BODY", "description": "Desarrollo del problema/solución" },
                        { "time": "15-30s", "segment": "CTA", "description": "Llamada a la acción y oferta" }
                    ]
                }
            },
            "conversionPotential": "X.X/10"
        }

        INSTRUCCIONES ADICIONALES:
        - Si hay una imagen proporcionada, úsala para entender la estética y el branding.
        - Sé brutalmente honesto. Si el ángulo es débil, dilo.
        - El tono debe ser profesional, técnico y orientado a resultados.

        RESPONDE ÚNICAMENTE EL JSON.
    `;

    try {
        const res = await askGemini(prompt, "", params.imageBase64);
        if (res.error) return { success: false, error: res.error };

        const analysis = JSON.parse(res.text.replace(/```json|```/g, ""));
        return { success: true, analysis };
    } catch (e: any) {
        console.error("Master Audit Error:", e);
        return { success: false, error: "Error parsing DNA from Gemini. Re-intenta o revisa el prompt." };
    }
}

// 3. Análisis de Alineación (Mensaje-Landing-Avatar)
export async function analyzeCreativeAlignment(creativeId: string, landingUrl?: string) {
    const { askGemini } = await import("@/lib/ai");

    const creative = await prisma.creativeAsset.findUnique({
        where: { id: creativeId },
        include: { product: true }
    });

    if (!creative) return { success: false, message: "Creative not found" };

    const prompt = `
        ACTÚA COMO: Especialista en CRO y Alineación de Mensaje.
        OBJETIVO: Analizar la coherencia entre este creativo y la landing page/oferta.
        
        CREATIVO: ${creative.name} (${creative.angulo || "Ángulo no especificado"})
        LANDING URL: ${landingUrl || "No proporcionada"}
        PRODUCTO: ${creative.product.title}

        INSTRUCCIONES:
        1. Evalúa si el mensaje del creativo fluye naturalmente hacia la oferta.
        2. Califica el 'Hook Score' (0-10) según su capacidad de retención.
        3. Proporciona sugerencias críticas para mejorar la tasa de conversión.

        RESPUESTA (JSON):
        {
            "hookScore": X.X,
            "landingAlignment": "Alta/Media/Baja",
            "reasoning": "Explicación técnica",
            "suggestions": ["Sugerencia 1", "Sugerencia 2"]
        }
    `;

    try {
        const res = await askGemini(prompt);
        if (res.error) throw new Error(res.error);
        const analysis = JSON.parse(res.text.replace(/```json|```/g, ""));
        return { success: true, analysis };
    } catch (error) {
        return { success: false, error: "Fallo en el análisis de alineación real." };
    }
}

// 3. Batch Upload & Naming
export async function batchCreateCreatives(files: { name: string, type: string }[], productId: string, baseNomenclature: string) {
    try {
        // Logic to auto-increment nomenclature: UGC_01, UGC_02...
        const existingCount = await prisma.creativeAsset.count({
            where: {
                productId,
                nomenclatura: { startsWith: baseNomenclature } // e.g., starts with "UGC_KW1_"
            }
        });

        let currentIdx = existingCount + 1;
        const created = [];

        for (const file of files) {
            const nomenclature = `${baseNomenclature}_${String(currentIdx).padStart(2, '0')}`; // UGC_KW1_01

            const newCreative = await prisma.creativeAsset.create({
                data: {
                    name: file.name,
                    type: file.type,
                    productId,
                    nomenclatura: nomenclature,
                    verdict: "TESTING"
                }
            });
            created.push(newCreative);
            currentIdx++;
        }

        revalidatePath("/marketing/creative-lab");
        return { success: true, count: created.length, message: `Generados ${created.length} creativos con nomenclatura secuencial.` };
    } catch (error) {
        return { success: false, error: "Batch creation failed" };
    }
}

// 4. Competitor Analysis (Simulated)
export async function analyzeCompetitorCreative(url: string) {
    // Aquí iría un scraper de AdLibrary o similar
    return {
        success: true,
        data: {
            formats: ["User Generated Content", "Static Image comparison"],
            primaryAngles: ["Price anchor", "Us vs Them"],
            estimatedSpend: "High (>50k/mo)"
        }
    };
}

// 5. AI Magic Clipper (Simulated)
export async function generateClipsFromVideo(productId: string, videoName: string) {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2000));

    // We will generate 3 clips: Hook, Body, CTA
    const clips = [
        { suffix: "HOOK", duration: "0:03", type: "VIDEO", score: 9.2 },
        { suffix: "BODY", duration: "0:15", type: "VIDEO", score: 8.5 },
        { suffix: "CTA", duration: "0:05", type: "VIDEO", score: 8.8 }
    ];

    const generatedAssets = [];

    // Base nomenclature auto-calc
    const count = await prisma.creativeAsset.count({ where: { productId } });
    let idx = count + 1;

    for (const clip of clips) {
        const nomenclature = `CLIP_${String(idx).padStart(3, '0')}_${clip.suffix}`;

        try {
            const asset = await prisma.creativeAsset.create({
                data: {
                    productId,
                    name: `${videoName} - [${clip.suffix}]`,
                    type: clip.type,
                    nomenclatura: nomenclature,
                    verdict: "TESTING",
                    angulo: `Auto-generated ${clip.suffix}`,
                    editor: "AI Clipper Agent",
                    // We could store the "score" or "duration" in a metadata field if we had one, 
                    // for now we just put it in the name or ignore
                }
            });
            generatedAssets.push({ ...asset, ...clip });
        } catch (e) {
            console.error(e);
        }
        idx++;
    }

    revalidatePath("/marketing/creative-lab");
    return { success: true, clips: generatedAssets };
}

// 6. Project Management
export async function getRecentProjects() {
    try {
        const projects = await prisma.creativeProject.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { product: true }
        });
        return { success: true, projects };
    } catch {
        return { success: false, projects: [] };
    }
}
