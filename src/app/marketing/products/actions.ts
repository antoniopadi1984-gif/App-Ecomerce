"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PRODUCT MASTER MIND ---

export async function getProductMasterData(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                competitors: true,
                documents: true,
                avatars: true, // Deep Analysis here
                creatives: true
            }
        });
        return product;
    } catch {
        return null;
    }
}

export async function addCompetitorLink(productId: string, data: { type: string, url: string, notes?: string }) {
    await prisma.competitorLink.create({
        data: {
            productId,
            type: data.type.toUpperCase().replace(/ /g, "_"),
            url: data.url,
            notes: data.notes
        }
    });
    revalidatePath(`/marketing/products/${productId}`);
}

export async function addResearchDocument(productId: string, data: { title: string, content: string, type: string, fileUrl?: string, language: string }) {
    // TRANSLATION SIMULATION LAYER
    // In production, this would call Google Translate API / DeepL / OpenAI

    let processedContent = data.content;
    let processedTitle = data.title;

    // Check if translation needed (Mock logic: if target is 'en' but text looks spanish 'el', 'la')
    // We will just append a tag to show user it "worked"
    if (data.language && data.language !== 'es') {
        // Simulating delay for "AI Translation"
        await new Promise(r => setTimeout(r, 700));
        processedTitle = `[${data.language.toUpperCase()}] ${data.title}`;
        processedContent = `[TRANSLATED TO ${data.language.toUpperCase()}]\n\n${data.content}`;
    }

    await prisma.researchDocument.create({
        data: {
            productId,
            title: processedTitle,
            type: data.type,
            content: processedContent,
            fileUrl: data.fileUrl,
            language: data.language
        }
    });
    revalidatePath(`/marketing/products/${productId}`);
}

export async function uploadAndProcessVideo(productId: string, data: { name: string, driveUrl: string, targetLanguage?: string }) {
    // 1. Simulate "Upload" (In real app, we get the Drive ID)
    await new Promise(r => setTimeout(r, 1500));

    // 2. Simulate "TurboScribe" Transcription
    // 3. Simulate "Translation" if targetLanguage provided

    const assetName = data.targetLanguage && data.targetLanguage !== 'es'
        ? `${data.name} [DUBBED: ${data.targetLanguage}]`
        : data.name;

    await prisma.creativeAsset.create({
        data: {
            productId,
            name: assetName,
            type: "VIDEO",
            driveUrl: data.driveUrl,
            language: data.targetLanguage || 'es',
            // Default metrics
            spend: 0,
            revenue: 0,
            verdict: "PROCESSING" // Mark as processing initially
        }
    });

    revalidatePath(`/marketing/products/${productId}`);
}

export async function updateProductDrive(productId: string, driveFolder: string) {
    await prisma.product.update({
        where: { id: productId },
        data: { driveFolder }
    });
    revalidatePath(`/marketing/products/${productId}`);
}

export async function runDeepAnalysisAgent(productId: string) {
    // MOCK AI AGENT
    await new Promise(r => setTimeout(r, 2000));

    const analysis = `
    **ANÁLISIS DE PROFUNDIDAD (AGENTE MARKETING v1)**
    
    **Por qué vende este producto?**
    La propuesta de valor ataca directamente la inseguridad latente sobre el dolor principal del cliente.
    
    **Deseo Principal (Core Desire):**
    Estatus y Validación Social rápida.

    **Ángulos de Ataque Recomendados:**
    1. *El Mecanismo Único:* Enfatizar la tecnología "Nano-Tech".
    2. *Us versus Them:* Comparar con productos tradicionales.
    3. *La Demostración Instantánea:* Creativos de 3 segundos mostrando el antes/después.
    `;

    const existing = await prisma.avatarResearch.findFirst({ where: { productId } });
    if (existing) {
        await prisma.avatarResearch.update({
            where: { id: existing.id },
            data: { whyItSells: analysis }
        });
    } else {
        await prisma.avatarResearch.create({
            data: {
                productId,
                whyItSells: analysis,
                levelOfAwareness: "O3"
            }
        });
    }
    revalidatePath(`/marketing/products/${productId}`);
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            include: {
                finance: true,
                orderItems: { take: 1, select: { sku: true } }
            },
            orderBy: { title: 'asc' }
        });
        return products;
    } catch {
        return [];
    }
}
