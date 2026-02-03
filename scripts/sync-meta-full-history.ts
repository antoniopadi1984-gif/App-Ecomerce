
import { PrismaClient } from "@prisma/client";
import { IntradaySyncService } from "../src/lib/services/intraday-service";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
    const storeId = "default-store";
    const DAYS_TO_SYNC = 365;

    console.log(`🚀 Starting Full Historical Sync for ${DAYS_TO_SYNC} days...`);

    let totalSynced = 0;
    const errors: string[] = [];

    // Sync from yesterday backwards to avoid messing with today's real-time cache significantly,
    // although IntradaySyncService handles it fine.
    for (let i = 0; i < DAYS_TO_SYNC; i++) {
        const targetDate = subDays(new Date(), i);
        console.log(`[${i + 1}/${DAYS_TO_SYNC}] Syncing ${targetDate.toISOString().split('T')[0]}...`);

        try {
            const res = await IntradaySyncService.syncWindow(storeId, 'DAY', targetDate);
            if (res.success) {
                totalSynced += res.synced || 0;
            } else {
                errors.push(`${targetDate.toISOString().split('T')[0]}: ${res.error}`);
            }
        } catch (e: any) {
            console.error(`Status check failed for ${targetDate}: ${e.message}`);
            errors.push(`${targetDate.toISOString().split('T')[0]}: ${e.message}`);
        }
    }

    console.log(`✅ Historical Sync Completed!`);
    console.log(`Total Metrics Processed: ${totalSynced}`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) {
        console.log(errors);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
