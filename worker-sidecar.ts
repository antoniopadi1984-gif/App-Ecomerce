import "dotenv/config";
import dotenv from "dotenv";
import path from "path";

// Load .env.local specifically if it exists, as Next.js uses it
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { startWorker, initHandlers } from "./src/lib/worker";

async function main() {
    try {
        await initHandlers();
        await startWorker();
    } catch (e) {
        console.error("Worker CRASHED:", e);
        process.exit(1);
    }
}

main();
