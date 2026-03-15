
import { JobHandler } from "../worker";
import { prisma } from "../prisma";
import { AlmanacGenerator } from "../marketing/contents/almanac-generator";
import { CourseEngine, CourseSegment } from "../marketing/contents/course-engine";
import { ImageGenerator } from "../creative/generators/image-generator";
import { VoiceGenerator } from "../creative/generators/voice-generator";
import { askGemini } from "../ai";
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";

const contentGenHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        const { type, productId, templateId, storeId, goal, config } = payload;

        switch (type) {
            case 'ALMANAC':
                return await handleAlmanac(productId, goal, onProgress);
            case 'COURSE':
                return await handleCourse(templateId, onProgress);
            case 'EBOOK':
                return await handleEbook(templateId, onProgress);
            default:
                throw new Error(`Tipo de contenido desconocido: ${type}`);
        }
    }
};

async function handleAlmanac(productId: string, goal: string, onProgress: any) {
    await onProgress(20);
    const fileUrl = await AlmanacGenerator.generateAlmanac(productId, goal);
    await onProgress(80);

    const product = await prisma.product.findUnique({ where: { id: productId } });

    const asset = await (prisma as any).contentAsset.create({
        data: {
            storeId: product?.storeId || '',
            productId,
            name: `Almanaque: ${goal}`,
            fileUrl,
            type: 'IMAGE',
            metadataJson: JSON.stringify({
                goal,
                generatedBy: 'ALMANAC_ENGINE',
                type: 'TRANSFORMATION_RITUAL'
            })
        }
    });

    await onProgress(100);
    return { success: true, url: fileUrl, assetId: asset.id };
}

async function handleEbook(templateId: string, onProgress: any) {
    await onProgress(10);
    const template = await (prisma as any).contentTemplate.findFirst({
        where: { id: templateId },
        include: { product: true }
    });

    if (!template) throw new Error("Template not found");

    const config = JSON.parse(template.configJson);
    const productName = template.product?.title || "nuestro producto";

    const prompt = `
        Genera el contenido para un eBook de tipo ${template.type} sobre el producto: ${productName}.
        OBJETIVO: ${template.description || "Educar al cliente"}
        TONO: ${config.tone || "Profesional"}
        PAÍS: ${template.product?.country || 'España'}
        
        ESTRUCTURA REQUERIDA (JSON):
        {
            "title": "Título sugerente",
            "sections": [
                { "header": "Introducción", "content": "..." },
                { "header": "Cómo usarlo", "content": "..." },
                { "header": "Preguntas Frecuentes", "content": "..." },
                { "header": "Garantía y Contacto", "content": "..." }
            ]
        }
        Responde SOLO el JSON.
    `;

    const aiResponse = await askGemini(prompt, "Eres un educador experto.");
    await onProgress(40);

    const content = JSON.parse((aiResponse.text || "").match(/\{[\s\S]*\}/)?.[0] || "{}");

    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.text(content.title || template.name, 20, y);
    y += 20;

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

    const fileName = `ebook_${template.id}_${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "contents");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, Buffer.from(doc.output('arraybuffer')));
    await onProgress(90);

    const asset = await (prisma as any).contentAsset.create({
        data: {
            storeId: template.storeId,
            templateId: template.id,
            productId: template.productId,
            name: content.title || template.name,
            fileUrl: `/uploads/contents/${fileName}`,
            type: 'PDF',
            metadataJson: JSON.stringify({ pages: doc.getNumberOfPages(), generatedBy: 'EBOOK_ENGINE' })
        }
    });

    await onProgress(100);
    return asset;
}

async function handleCourse(templateId: string, onProgress: any) {
    await onProgress(5);
    const template = await (prisma as any).contentTemplate.findFirst({
        where: { id: templateId },
        include: { product: true }
    });

    if (!template) throw new Error("Template not found");

    const prompt = `
        Genera un guión para un MINI-CURSO en vídeo de 5 lecciones sobre: ${template.product?.title}.
        Cada lección dura 8 segundos.
        ESTRUCTURA (JSON):
        {
            "title": "Nombre del Curso",
            "lessons": [
                { "title": "Lección 1", "script": "Texto...", "imagePrompt": "..." }
            ]
        }
    `;

    const aiResponse = await askGemini(prompt, "Eres un director de contenidos.");
    const content = JSON.parse((aiResponse.text || "").match(/\{[\s\S]*\}/)?.[0] || "{}");
    await onProgress(20);

    const imageGen = new ImageGenerator();
    const voiceGen = new VoiceGenerator();

    const imagePromises = content.lessons.map((l: any) => imageGen.generate({ prompt: l.imagePrompt, style: 'photo', aspectRatio: '9:16' }));
    const voicePromises = content.lessons.map((l: any) => voiceGen.generate({ text: l.script }));

    const images = await Promise.all(imagePromises);
    await onProgress(40);
    const voices = await Promise.all(voicePromises);
    await onProgress(60);

    const segments: CourseSegment[] = content.lessons.map((l: any, i: number) => ({
        imagePath: images[i],
        audioPath: voices[i],
        text: l.title,
        duration: 8
    }));

    const videoUrl = await CourseEngine.assembleMiniCourse(template.id, segments);
    await onProgress(90);

    const asset = await (prisma as any).contentAsset.create({
        data: {
            storeId: template.storeId,
            templateId: template.id,
            productId: template.productId,
            name: content.title || template.name,
            fileUrl: videoUrl,
            type: 'MP4'
        }
    });

    await onProgress(100);
    return { success: true, assetId: asset.id, url: videoUrl };
}

export default contentGenHandler;
