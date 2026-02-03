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
