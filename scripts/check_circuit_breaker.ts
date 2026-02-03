
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:' + path.join(__dirname, '../prisma/dev.db')
        }
    }
});

async function main() {
    try {
        const logs = await prisma.auditLog.findMany({
            where: { action: "INTRADAY_SYNC" },
            orderBy: { createdAt: "desc" },
            take: 5
        });
        console.log('Last 5 Audit Logs:');
        console.log(JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
