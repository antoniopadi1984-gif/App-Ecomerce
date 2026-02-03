import { repairMonthOrderItems } from '../src/app/logistics/orders/actions';

async function main() {
    const jobs = [
        { month: 9, year: 2025 },
        { month: 10, year: 2025 },
        { month: 11, year: 2025 },
        { month: 12, year: 2025 },
        { month: 1, year: 2026 },
        { month: 2, year: 2026 }
    ];

    console.log("🚀 Starting Global Financial Restoration...");

    for (const job of jobs) {
        console.log(`\n📅 Processing ${job.month}/${job.year}...`);
        try {
            const result = await repairMonthOrderItems(job.month, job.year);
            if (result.success) {
                console.log(`✅ Success: ${result.message}`);
            } else {
                console.log(`❌ Error: ${result.message}`);
            }
        } catch (e) {
            console.log(`💥 Critical Failure for ${job.month}/${job.year}:`, e);
        }
    }

    console.log("\n✨ Global Restoration Finished!");
}

main().catch(console.error);
