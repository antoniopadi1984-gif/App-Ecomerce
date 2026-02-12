
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobs() {
    try {
        const pendingCount = await (prisma.job as any).count({ where: { status: 'PENDING' } });
        const processingCount = await (prisma.job as any).count({ where: { status: 'PROCESSING' } });
        const failedCount = await (prisma.job as any).count({ where: { status: 'FAILED' } });
        const completedCount = await (prisma.job as any).count({ where: { status: 'COMPLETED' } });

        console.log(`\n📊 [JOB STATS]`);
        console.log(`- PENDING:    ${pendingCount}`);
        console.log(`- PROCESSING: ${processingCount}`);
        console.log(`- FAILED:     ${failedCount}`);
        console.log(`- COMPLETED:  ${completedCount}`);

        if (failedCount > 0) {
            const lastFailed = await (prisma.job as any).findFirst({
                where: { status: 'FAILED' },
                orderBy: { updatedAt: 'desc' }
            });
            console.log(`\n❌ [LATEST FAILURE]`);
            console.log(`ID: ${lastFailed.id}`);
            console.log(`Type: ${lastFailed.type}`);
            console.log(`Error: ${lastFailed.lastError}`);
        }

        const systemStatus = await (prisma as any).systemHeartbeat.findUnique({ where: { id: 'singleton' } });
        console.log(`\n💓 [WORKER RADIOGRAPHY]`);
        if (systemStatus) {
            const diff = Date.now() - new Date(systemStatus.timestamp).getTime();
            const isActive = diff < 120000; // < 2 min
            console.log(`- Last Heartbeat: ${systemStatus.timestamp.toISOString()}`);
            console.log(`- Worker Status: ${isActive ? '✅ ONLINE' : '💀 OFFLINE (Maybe stale)'}`);
        } else {
            console.log(`- Worker Status: ❓ NOT INITIALIZED`);
        }

    } catch (e: any) {
        console.error("Error checking jobs:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkJobs();
