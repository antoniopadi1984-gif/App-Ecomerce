"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { askGemini } from "@/lib/ai";
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";
import { createJob } from "@/lib/worker";

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
    // Offload to Worker for Robustness
    await createJob('CONTENT_EBOOK', { templateId, type: 'EBOOK' });

    revalidatePath("/marketing/contents");
    return { success: true, message: "Generación de eBook iniciada en segundo plano." };
}

import { ImageGenerator } from "@/lib/creative/generators/image-generator";
import { VoiceGenerator } from "@/lib/creative/generators/voice-generator";
import { CourseEngine, CourseSegment } from "@/lib/marketing/contents/course-engine";

// 3. Mini-Course Logic (Full Automation)
export async function generateMiniCourse(templateId: string) {
    // Offload to Worker for Robustness
    await createJob('CONTENT_COURSE', { templateId, type: 'COURSE' });

    revalidatePath("/marketing/contents");
    return { success: true, message: "Generación de mini-curso iniciada en segundo plano." };
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

import { AlmanacGenerator } from "@/lib/marketing/contents/almanac-generator";

// 5. Almanac / Calendar Generator
export async function generateAlmanacAction(productId: string, goal: string) {
    try {
        await createJob('CONTENT_ALMANAC', { productId, goal, type: 'ALMANAC' });
        revalidatePath("/marketing/contents");
        return { success: true, message: "Generación de almanaque iniciada." };
    } catch (e: any) {
        console.error("🛑 [Almanac Action Error]", e.message);
        throw new Error(`Fallo generando almanaque: ${e.message}`);
    }
}

export async function getContentAssets(storeId: string) {
    return await (prisma as any).contentAsset.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' }
    });
}
