import { prisma } from '../prisma';

export class VersioningService {
    /**
     * Agrupa assets similares como versiones del mismo creativo
     */
    static async groupVersions(productId: string) {
        const assets = await (prisma as any).creativeAsset.findMany({
            where: { productId },
            orderBy: { createdAt: 'asc' }
        });

        const groups: Record<string, string[]> = {};

        for (const asset of assets) {
            // Lógica de similaridad basada en nomenclatura base (quitando version)
            // Ej: PURE-MECH01-C-V1 -> PURE-MECH01-C
            const baseNomenclature = asset.nomenclatura?.replace(/-V\d+$/, '') || asset.name;

            if (!groups[baseNomenclature]) groups[baseNomenclature] = [];
            groups[baseNomenclature].push(asset.id);
        }

        const updates = [];
        for (const [groupName, ids] of Object.entries(groups)) {
            if (ids.length > 1) {
                const masterId = ids[0];
                for (let i = 0; i < ids.length; i++) {
                    updates.push((prisma as any).creativeAsset.update({
                        where: { id: ids[i] },
                        data: {
                            versionGroup: groupName,
                            isMaster: i === 0,
                            versionNumber: i + 1
                        }
                    }));
                }
            }
        }

        await Promise.all(updates);
        return { groupsCreated: Object.keys(groups).length };
    }
}
