
import prisma from '../src/lib/prisma';

async function main() {
    console.log(`[Script] CWD: ${process.cwd()}`);
    try {
        console.log("--- DEBUGGING WINDOW FIELD ---");

        const sample = await prisma.adMetricDaily.findFirst({
            where: { level: 'CAMPAIGN' }
        });

        console.log(`Sample Campaign Metric:`);
        console.log(`- ID: ${sample?.id}`);
        console.log(`- Window: '${sample?.window}'`); // Check exact string
        console.log(`- Date: ${sample?.date}`);

        if (sample && sample.window !== 'DAY') {
            console.log("CRITICAL: Window mismatch! API expects 'DAY' but found '" + sample.window + "'.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
