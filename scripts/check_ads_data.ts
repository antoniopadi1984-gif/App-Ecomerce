
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Manual config
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:' + path.join(__dirname, '../prisma/dev.db')
        }
    }
});

async function checkData() {
    try {
        console.log('Checking DB at:', process.env.DATABASE_URL);

        const count = await prisma.adMetricDaily.count();
        console.log(`\n📊 Total AdMetricDaily rows: ${count}`);

        if (count > 0) {
            // Count for today
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            const todayCount = await prisma.adMetricDaily.count({
                where: { date: { gte: new Date(todayStr) } }
            });
            console.log(`📅 Rows for Today (${todayStr}): ${todayCount}`);

            if (todayCount > 0) {
                const sample = await prisma.adMetricDaily.findFirst({
                    where: { date: { gte: new Date(todayStr) } }
                });
                console.log('\n📄 Sample Row (Today):');
                console.log(JSON.stringify(sample, null, 2));
            } else {
                console.log('⚠️ No rows found for today.');
                const last = await prisma.adMetricDaily.findFirst({ orderBy: { date: 'desc' } });
                console.log(`Last recorded date: ${last?.date}`);
            }

        }
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
