import { PrismaClient } from '@prisma/client';
import { encryptSecret } from '../src/lib/server/crypto';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting Connection Consolidation & Security Migration...');

    const connections = await (prisma as any).connection.findMany();
    const storeId = 'store-main'; // Primary store for global keys

    // 1. CLEANUP: Delete legacy 'GOOGLE' or empty connections
    await (prisma as any).connection.deleteMany({
        where: {
            OR: [
                { provider: 'GOOGLE' },
                { secretEnc: null, apiKey: null, accessToken: null, apiSecret: null, extraConfig: null }
            ]
        }
    });

    // 2. CONSOLIDATE GOOGLE CLOUD
    console.log('🔍 Consolidating Google Services...');
    const googleRelated = connections.filter((c: any) => ['GCP', 'VERTEX', 'GOOGLE', 'GA4'].includes(c.provider.toUpperCase()));

    if (googleRelated.length > 0) {
        let masterMetadata: any = {};
        let masterSecret = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';

        googleRelated.forEach((c: any) => {
            try {
                const config = JSON.parse(c.extraConfig || '{}');
                masterMetadata = { ...masterMetadata, ...config };
                if (!masterSecret) masterSecret = c.apiKey || c.accessToken || c.apiSecret || '';
            } catch (e) { }
        });

        // Use canonical keys
        if (masterMetadata.GOOGLE_CLOUD_PROJECT_ID || masterMetadata.projectId) {
            masterMetadata.GOOGLE_CLOUD_PROJECT_ID = masterMetadata.GOOGLE_CLOUD_PROJECT_ID || masterMetadata.projectId;
            delete masterMetadata.projectId;
        }

        const { enc, iv, tag } = encryptSecret(masterSecret);

        await (prisma as any).connection.upsert({
            where: { storeId_provider: { storeId, provider: 'GOOGLE_CLOUD' } },
            update: { secretEnc: enc, secretIv: iv, secretTag: tag, extraConfig: JSON.stringify(masterMetadata) },
            create: { storeId, provider: 'GOOGLE_CLOUD', secretEnc: enc, secretIv: iv, secretTag: tag, extraConfig: JSON.stringify(masterMetadata) }
        });

        // Delete others
        await (prisma as any).connection.deleteMany({
            where: { provider: { in: ['GCP', 'VERTEX', 'GA4', 'GOOGLE'] } }
        });
    }

    // 3. CONSOLIDATE REPLICATE / CLAUDE
    console.log('🔍 Consolidating Replicate Intelligence...');
    const replicateRelated = connections.filter((c: any) => ['REPLICATE', 'ANTHROPIC'].includes(c.provider.toUpperCase()));

    if (replicateRelated.length > 0) {
        let masterSecret = process.env.REPLICATE_API_TOKEN || '';
        replicateRelated.forEach((c: any) => {
            if (!masterSecret) {
                try {
                    const config = JSON.parse(c.extraConfig || '{}');
                    masterSecret = config.REPLICATE_API_TOKEN || c.apiKey || c.accessToken || '';
                } catch (e) { }
            }
        });

        if (masterSecret) {
            const { enc, iv, tag } = encryptSecret(masterSecret);
            await (prisma as any).connection.upsert({
                where: { storeId_provider: { storeId, provider: 'REPLICATE' } },
                update: { secretEnc: enc, secretIv: iv, secretTag: tag, extraConfig: JSON.stringify({ ENGINE: 'REPLICATE_AI_FACTORY' }) },
                create: { storeId, provider: 'REPLICATE', secretEnc: enc, secretIv: iv, secretTag: tag, extraConfig: JSON.stringify({ ENGINE: 'REPLICATE_AI_FACTORY' }) }
            });

            await (prisma as any).connection.deleteMany({ where: { provider: 'ANTHROPIC' } });
            // REPLICATE is now the master ID, so we keep only that one.
        }
    }

    // 4. SYNC SHOPIFY & META SECRETS FROM ENV
    console.log('🔍 Syncing Shopify & Meta from Environment...');

    if (process.env.SHOPIFY_ACCESS_TOKEN) {
        const { enc, iv, tag } = encryptSecret(process.env.SHOPIFY_ACCESS_TOKEN);
        await (prisma as any).connection.updateMany({
            where: { provider: 'SHOPIFY' },
            data: { secretEnc: enc, secretIv: iv, secretTag: tag }
        });
    }

    if (process.env.META_ACCESS_TOKEN) {
        const { enc, iv, tag } = encryptSecret(process.env.META_ACCESS_TOKEN);
        await (prisma as any).connection.updateMany({
            where: { provider: 'META' },
            data: { secretEnc: enc, secretIv: iv, secretTag: tag }
        });
    }

    console.log('✅ Migration Complete. Connections unified and secured.');
}

migrate()
    .catch(err => console.error('❌ Migration Failed:', err))
    .finally(() => prisma.$disconnect());
