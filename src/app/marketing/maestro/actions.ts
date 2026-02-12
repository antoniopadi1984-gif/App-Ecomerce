'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new Maestro Project
 */
export async function createMaestroProject(data: {
    name: string;
    productId: string;
    platform: string;
    language: string;
    avatarId?: string;
}) {
    const project = await db.creativeProject.create({
        data: {
            name: data.name,
            productId: data.productId,
            platform: data.platform,
            language: data.language,
            avatarId: data.avatarId,
            status: 'DRAFT',
            timelineState: 'INITIAL'
        }
    });
    return project;
}

/**
 * Ingests a video asset (simulated for now, would upload to S3)
 */
export async function ingestVideoAsset(projectId: string, fileName: string, fileType: string) {
    // Simulator: Create asset entry directly
    const asset = await db.maestroAsset.create({
        data: {
            projectId,
            type: 'RAW_VIDEO',
            source: 'UPLOAD',
            url: `/uploads/${fileName}`, // Mock path
            status: 'PROCESSING',
            metadata: JSON.stringify({ mime: fileType })
        }
    });

    // Trigger Analysis Job (Mock)
    // In real app: await queue.add('analyze', { assetId: asset.id })

    return asset;
}

/**
 * Analyzes video to extract hooks and clips (Simulated Gemini Vision)
 */
export async function analyzeVideoAsset(assetId: string) {
    // Update asset status
    await db.maestroAsset.update({
        where: { id: assetId },
        data: { status: 'READY' }
    });

    // Create mock clips
    await db.maestroClip.createMany({
        data: [
            { assetId, kind: 'HOOK', startTime: 0, endTime: 3, score: 9.5, transcript: 'Stop scrolling right now!' },
            { assetId, kind: 'BODY', startTime: 3, endTime: 15, score: 8.0, transcript: 'This product changed my life...' },
            { assetId, kind: 'CTA', startTime: 15, endTime: 20, score: 9.0, transcript: 'Click the link below.' }
        ]
    });

    return { success: true };
}

/**
 * Generates Scripts based on project data (Simulated Claude/Gemini)
 */
export async function generateMaestroScripts(projectId: string, context: string) {
    await db.maestroScript.create({
        data: {
            projectId,
            version: 1,
            content: `Script Version 1 based on ${context}`,
            isApproved: false
        }
    });
    return { success: true };
}

/**
 * Generates Avatar Static Image (Fix for User Bug)
 */
export async function generateAvatarStaticImage(avatarId: string) {
    // Simulate Nano Banana generation via local engine or fallback
    const mockImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;

    await db.avatarProfile.update({
        where: { id: avatarId },
        data: {
            imageUrl: mockImageUrl,
            status: 'READY'
        }
    });

    // Create AvatarAsset record
    await db.avatarAsset.create({
        data: {
            avatarProfileId: avatarId,
            type: 'AVATAR_IMAGE',
            pathLocal: mockImageUrl,
            width: 1024,
            height: 1024
        }
    });

    return { success: true, imageUrl: mockImageUrl };
}

/**
 * Get Project State for "Truth Layer"
 */
export async function getMaestroProjectState(projectId: string) {
    return await db.creativeProject.findUnique({
        where: { id: projectId },
        include: {
            maestroAssets: { include: { clips: true } },
            maestroScripts: true,
            maestroVariants: true,
            product: true,
            avatar: true
        }
    });
}

/**
 * Get all available products for the UI
 */
export async function getProducts() {
    try {
        const products = await db.product.findMany({
            where: {
                OR: [
                    { status: 'ACTIVE' },
                    { status: 'DRAFT' }
                ]
            },
            select: {
                id: true,
                title: true,
                driveFolderId: true,
                driveRootPath: true
            }
        });
        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * MAESTRO ENGINE: Video Analysis (Local)
 */
export async function analyzeVideoLocal(formData: FormData) {
    try {
        const res = await fetch("http://localhost:8000/analyze-video", {
            method: "POST",
            body: formData
        });
        if (!res.ok) throw new Error("Motor Local Error");
        return await res.json();
    } catch (e: any) {
        return { success: false, error: "Motor Offline. ¿Está corriendo dev:all?" };
    }
}

/**
 * MAESTRO ENGINE: Avatar Generation (Local)
 */
export async function generateAvatarLocal(formData: FormData) {
    try {
        const res = await fetch("http://localhost:8000/generate-avatar", {
            method: "POST",
            body: formData
        });
        if (!res.ok) throw new Error("Motor Local Error");
        return await res.json();
    } catch (e: any) {
        return { success: false, error: "Motor Offline. ¿Está corriendo dev:all?" };
    }
}

export async function verifySystemHealth() {
    const checks = {
        database: { status: 'PENDING', message: '' },
        engine: { status: 'PENDING', message: '' },
        avatar: { status: 'PENDING', message: 'Last generation check' }
    };

    try {
        // 1. DB
        await db.$queryRaw`SELECT 1`;
        checks.database = { status: 'OK', message: 'Connected' };
    } catch (e: any) {
        checks.database = { status: 'FAIL', message: e.message };
    }

    try {
        // 2. Engine
        const res = await fetch("http://localhost:8000/health");
        if (res.ok) checks.engine = { status: 'OK', message: 'Operational' };
        else checks.engine = { status: 'FAIL', message: 'Unreachable' };
    } catch (e: any) {
        checks.engine = { status: 'FAIL', message: e.message };
    }

    try {
        // 3. Avatar Check (Check for recent asset)
        const lastAsset = await db.avatarAsset.findFirst({ orderBy: { createdAt: 'desc' } });
        if (lastAsset) checks.avatar = { status: 'OK', message: `Last asset: ${lastAsset.pathLocal}` };
        else checks.avatar = { status: 'WARN', message: 'No assets generated yet' };
    } catch (e: any) {
        checks.avatar = { status: 'FAIL', message: e.message };
    }

    return checks;
}
