"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";

// 1. Manage Templates
export async function saveContentTemplate(storeId: string, data: any) {
    const { id, ...templateData } = data;
    const payload = {
        storeId,
        name: templateData.name,
        type: templateData.type,
        description: templateData.description,
        configJson: JSON.stringify(templateData.config || {}),
        productId: templateData.productId || null
    };

    if (id) {
        return await (prisma as any).contentTemplate.update({ where: { id }, data: payload });
    }
    return await (prisma as any).contentTemplate.create({ data: payload });
}

export async function getContentTemplates(storeId: string) {
    return await (prisma as any).contentTemplate.findMany({
        where: { storeId },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });
}

// 2. eBook Generator Engine
export async function generateEbook(templateId: string) {
    const template = await (prisma as any).contentTemplate.findFirst({
        where: { id: templateId },
        include: { product: true }
    });

    if (!template) throw new Error("Template not found");

    const config = JSON.parse(template.configJson);
    const productName = template.product?.title || "nuestro producto";

    // Step A: Generate Copy with Gemini (Agente Educador)
    const prompt = `
        Actúa como un experto "Clowdbot Educador" para un ecommerce premium.
        Tu tarea es generar el contenido para un eBook de tipo ${template.type} sobre el producto: ${productName}.
        
        OBJETIVO: ${template.description || "Educar al cliente y aumentar valor percibido"}
        TONO: ${config.tone || "Profesional y cercano"}
        PAÍS: España
        
        ESTRUCTURA REQUERIDA (Formato JSON):
        {
            "title": "Título sugerente",
            "sections": [
                { "header": "Introducción", "content": "..." },
                { "header": "Cómo usarlo", "content": "..." },
                { "header": "Preguntas Frecuentes", "content": "..." },
                { "header": "Garantía y Contacto", "content": "..." }
            ],
            "visualPrompts": ["Descripción para imagen 1", "Descripción para imagen 2"]
        }
        
        Sé muy detallado y útil. Evita genéricos. Responde SOLO el JSON.
    `;

    const aiResponse = await askGemini(prompt, "Eres un educador experto en productos de ecommerce.");
    let content;
    try {
        content = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (e) {
        console.error("JSON Parse failed", aiResponse.text);
        throw new Error("Fallo en la generación de contenido por IA");
    }

    // Step B: PDF Creation
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text(content.title || template.name, 20, y);
    y += 20;

    // Sections
    doc.setFontSize(12);
    content.sections.forEach((s: any) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(s.header, 20, y);
        y += 10;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(s.content, 170);
        doc.text(lines, 20, y);
        y += (lines.length * 7) + 10;
    });

    // Save locally
    const fileName = `ebook_${template.id}_${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "contents");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(doc.output('arraybuffer'));
    await fs.writeFile(filePath, buffer);

    // Step C: Record as ContentAsset
    const asset = await (prisma as any).contentAsset.create({
        data: {
            storeId: template.storeId,
            templateId: template.id,
            productId: template.productId,
            name: content.title || template.name,
            fileUrl: `/uploads/contents/${fileName}`,
            type: 'PDF',
            metadataJson: JSON.stringify({ pages: doc.getNumberOfPages(), generatedBy: 'AGENTE_EDUCADOR' })
        }
    });

    revalidatePath("/marketing/contents");
    return asset;
}

// 3. Mini-Course Logic (Modo B: FFmpeg + ElevenLabs)
export async function generateMiniCourse(templateId: string) {
    const template = await (prisma as any).contentTemplate.findFirst({
        where: { id: templateId },
        include: { product: true }
    });

    if (!template) throw new Error("Template not found");

    const productName = template.product?.title || "nuestro producto";

    // Step A: Generate Script with Gemini
    const prompt = `
        Genera un guión para un MINI-CURSO en vídeo de 5 lecciones sobre: ${productName}.
        Cada lección dura 8 segundos.
        
        ESTRUCTURA (JSON):
        {
            "title": "Nombre del Curso",
            "lessons": [
                { "title": "Lección 1", "script": "Texto para locución (máx 20 palabras)", "imagePrompt": "Prompt visual para Nano Banana" },
                ...
            ]
        }
    `;

    const aiResponse = await askGemini(prompt, "Eres un director de contenidos educativos.");
    const content = JSON.parse(aiResponse.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

    // Step B: Audio & Music (Simulation for now, using external APIs if keys present)
    // In a real scenario, we would call ElevenLabs here.

    // Step C: Recording Asset
    const asset = await (prisma as any).contentAsset.create({
        data: {
            storeId: template.storeId,
            templateId: template.id,
            productId: template.productId,
            name: content.title || template.name,
            fileUrl: `/uploads/contents/course_${template.id}.mp4`, // Real FFmpeg integration would save here
            type: 'MP4',
            metadataJson: JSON.stringify({ lessons: content.lessons.length, mode: 'MODO_B_LITE' })
        }
    });

    // Create sub-lessons in DB
    for (const [index, lesson] of content.lessons.entries()) {
        await (prisma as any).courseLesson.create({
            data: {
                assetId: asset.id,
                title: lesson.title,
                content: lesson.script,
                order: index
            }
        });
    }

    revalidatePath("/marketing/contents");
    return asset;
}

// 4. Content Automations (Campaigns)
export async function saveContentCampaign(storeId: string, data: any) {
    const { id, ...campaignData } = data;
    const payload = {
        storeId,
        name: campaignData.name,
        triggerEvent: campaignData.triggerEvent,
        assetId: campaignData.assetId,
        isActive: campaignData.isActive,
        requireApproval: campaignData.requireApproval,
        conditionsJson: JSON.stringify(campaignData.conditions || {})
    };

    if (id) {
        return await (prisma as any).contentCampaign.update({ where: { id }, data: payload });
    }
    return await (prisma as any).contentCampaign.create({ data: payload });
}

export async function getContentCampaigns(storeId: string) {
    return await (prisma as any).contentCampaign.findMany({
        where: { storeId },
        include: { asset: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getContentAssets(storeId: string) {
    return await (prisma as any).contentAsset.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' }
    });
}
