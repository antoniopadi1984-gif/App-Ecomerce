import { prisma } from '../prisma';

/**
 * Research Snapshot Service - Auto-save y version history
 */

export interface SnapshotData {
    productId: string;
    productDNA?: any;
    vocInsights?: any;
    avatars?: any;
    angles?: any;
    completeness?: number;
    quality?: number;
}

export class ResearchSnapshotService {
    /**
    * Crea un snapshot del research actual
    */
    static async createSnapshot(data: SnapshotData) {
        // Get current version number
        const lastSnapshot = await (prisma as any).researchSnapshot.findFirst({
            where: { productId: data.productId },
            orderBy: { version: 'desc' }
        });

        const version = (lastSnapshot?.version || 0) + 1;

        return await (prisma as any).researchSnapshot.create({
            data: {
                productId: data.productId,
                version,
                timestamp: new Date(),
                productDNA: JSON.stringify(data.productDNA || {}),
                vocInsights: JSON.stringify(data.vocInsights || {}),
                avatars: JSON.stringify(data.avatars || {}),
                angles: JSON.stringify(data.angles || {}),
                completeness: data.completeness || 0,
                quality: data.quality || 0
            }
        });
    }

    /**
    * Get all snapshots for a product
    */
    static async getHistory(productId: string, limit: number = 10) {
        return await (prisma as any).researchSnapshot.findMany({
            where: { productId },
            orderBy: { version: 'desc' },
            take: limit
        });
    }

    /**
    * Get specific snapshot
    */
    static async getSnapshot(productId: string, version: number) {
        return await (prisma as any).researchSnapshot.findFirst({
            where: { productId, version }
        });
    }

    /**
    * Get latest snapshot
    */
    static async getLatest(productId: string) {
        return await (prisma as any).researchSnapshot.findFirst({
            where: { productId },
            orderBy: { version: 'desc' }
        });
    }

    /**
    * Compare two snapshots
    */
    static async compare(productId: string, version1: number, version2: number) {
        const snap1 = await this.getSnapshot(productId, version1);
        const snap2 = await this.getSnapshot(productId, version2);

        if (!snap1 || !snap2) return null;

        // Parse JSON data
        const data1 = {
            productDNA: JSON.parse(snap1.productDNA),
            vocInsights: JSON.parse(snap1.vocInsights),
            avatars: JSON.parse(snap1.avatars),
            angles: JSON.parse(snap1.angles)
        };

        const data2 = {
            productDNA: JSON.parse(snap2.productDNA),
            vocInsights: JSON.parse(snap2.vocInsights),
            avatars: JSON.parse(snap2.avatars),
            angles: JSON.parse(snap2.angles)
        };

        // Calculate diff
        return {
            version1,
            version2,
            changes: {
                vocInsights: {
                    before: Object.keys(data1.vocInsights).length,
                    after: Object.keys(data2.vocInsights).length,
                    diff: Object.keys(data2.vocInsights).length - Object.keys(data1.vocInsights).length
                },
                avatars: {
                    before: Array.isArray(data1.avatars) ? data1.avatars.length : 0,
                    after: Array.isArray(data2.avatars) ? data2.avatars.length : 0,
                    diff: (Array.isArray(data2.avatars) ? data2.avatars.length : 0) - (Array.isArray(data1.avatars) ? data1.avatars.length : 0)
                },
                completeness: {
                    before: snap1.completeness,
                    after: snap2.completeness,
                    diff: snap2.completeness - snap1.completeness
                },
                quality: {
                    before: snap1.quality,
                    after: snap2.quality,
                    diff: snap2.quality - snap1.quality
                }
            },
            timestamps: {
                before: snap1.timestamp,
                after: snap2.timestamp
            }
        };
    }

    /**
    * Rollback to a specific version
    */
    static async rollback(productId: string, targetVersion: number) {
        const snapshot = await this.getSnapshot(productId, targetVersion);
        if (!snapshot) throw new Error('Snapshot not found');

        // Parse data
        const data = {
            productDNA: JSON.parse(snapshot.productDNA),
            vocInsights: JSON.parse(snapshot.vocInsights),
            avatars: JSON.parse(snapshot.avatars),
            angles: JSON.parse(snapshot.angles)
        };

        // Create new snapshot with rolled back data
        return await this.createSnapshot({
            productId,
            ...data,
            completeness: snapshot.completeness,
            quality: snapshot.quality
        });
    }

    /**
    * Auto-save - should be called periodically
    */
    static async autoSave(productId: string, currentData: SnapshotData) {
        const latest = await this.getLatest(productId);

        // Only save if data changed significantly
        if (latest) {
            const latestData = {
                productDNA: JSON.parse(latest.productDNA),
                vocInsights: JSON.parse(latest.vocInsights),
                avatars: JSON.parse(latest.avatars),
                angles: JSON.parse(latest.angles)
            };

            // Simple change detection
            const hasChanges =
                JSON.stringify(latestData.productDNA) !== JSON.stringify(currentData.productDNA) ||
                JSON.stringify(latestData.vocInsights) !== JSON.stringify(currentData.vocInsights) ||
                JSON.stringify(latestData.avatars) !== JSON.stringify(currentData.avatars) ||
                JSON.stringify(latestData.angles) !== JSON.stringify(currentData.angles);

            if (!hasChanges) {
                console.log('[AutoSave] No changes detected, skipping');
                return null;
            }
        }

        console.log('[AutoSave] Saving snapshot...');
        return await this.createSnapshot(currentData);
    }
}
