
import { PrismaClient } from "@prisma/client";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const prismaClientSingleton = () => {
    // 1. Resolve Absolute Path
    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

    // 2. Encode for LibSQL (Handling the space in "App Ecomerce")
    const encodedPath = dbPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const url = `file:${encodedPath}`;

    // 3. FORCE ENV for Prisma Engine
    // Even with adapter, Prisma sometimes looks at this env var for validation
    process.env.DATABASE_URL = url;

    console.error(`[Prisma Hardcoded] Initializing with: ${url}`);

    const clientConfig: any = { url };
    if (process.env.TURSO_AUTH_TOKEN) {
        clientConfig.authToken = process.env.TURSO_AUTH_TOKEN;
    }

    try {
        const libsql = createClient(clientConfig);

        // Ensure property exists for adapter validation
        (libsql as any).url = url;

        const adapter = new PrismaLibSql(libsql as any);

        return new PrismaClient({
            adapter,
            log: ['warn', 'error'],
        });
    } catch (err: any) {
        console.error("[Prisma Hardcoded] Initialization failed:", err);
        throw err;
    }
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

export default prisma;
