
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    const dbUrl = process.env.DATABASE_URL;
    console.log(`🔌 [PRISMA] Connecting to DB at: ${dbUrl}`);
    if (dbUrl?.includes("Mobile Documents") || dbUrl?.includes("CloudDocs")) {
        console.error("🚨 [CRITICAL] DB DETECTED IN ICLOUD! DATA LOSS RISK.");
    }

    return new PrismaClient({
        log: ['warn', 'error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

export default prisma;
