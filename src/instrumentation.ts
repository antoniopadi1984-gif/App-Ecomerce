


export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { spawn } = await import("child_process");
        const path = await import("path");
        // Prevent multiple initializations in dev mode
        if ((global as any)._workerStarted) {
            console.log("⏭️ [Instrumentation] Worker already started, skipping...");
            return;
        }
        (global as any)._workerStarted = true;

        console.log("⚙️ [Instrumentation] System initializing...");


        (async () => {
            try {
                console.log("🚀 [Instrumentation] Auto-Starting Worker Sidecar...");
                const { initHandlers, startWorker } = await import("@/lib/worker");
                await initHandlers();

                // Start Worker
                startWorker();

                console.log("✅ [Instrumentation] Worker Sidecar is now backgrounded.");

                // Start Python Engine (Nano Banana)
                console.log("🍌 [Instrumentation] Auto-Starting Nano Banana Engine...");
                const engineScript = path.resolve(process.cwd(), "src/engine/start_engine.sh");
                const engineProcess = spawn("bash", [engineScript], {
                    detached: true,
                    stdio: 'ignore',
                    cwd: process.cwd()
                });
                engineProcess.unref();
                console.log("✅ [Instrumentation] Nano Banana Engine initialization triggered.");
            } catch (e) {
                console.error("❌ [Instrumentation] Failed to auto-start worker:", e);
                (global as any)._workerStarted = false; // Reset lock on failure
            }
        })();
    }
}
