
import prisma from '../src/lib/prisma';

async function main() {
    try {
        const sample = await prisma.adMetricDaily.findFirst({
            where: { level: 'CAMPAIGN' }
        });
        console.log("--- SAMPLE METRIC NORM ---");
        console.log(sample?.metricsNorm);
    } catch (e) {
        console.error(e);
    }
}

main();
