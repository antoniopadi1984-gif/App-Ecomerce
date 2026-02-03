
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

async function test() {
    console.log("🚀 Starting Decorated Prisma Test...");

    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    const url = `file:${dbPath}`;

    const libsql = createClient({ url });
    // DECORATE
    (libsql as any).url = url;

    console.log("🏗️ Initializing PrismaClient with decorated adapter...");
    const adapter = new PrismaLibSql(libsql as any);
    const prisma = new PrismaClient({ adapter });

    try {
        const result = await (prisma as any).connection.findFirst();
        console.log("✅ Success! ID:", result?.id || "found but no ID");
    } catch (e) {
        console.error("❌ Failed!");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
