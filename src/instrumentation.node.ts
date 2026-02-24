export async function registerNodeOnly() {
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Evita duplicados en dev/hot reload
    if ((global as any)._workerStarted) {
        console.log("⏭️ [Instrumentation] Worker already started, skipping...");
        return;
    }
    (global as any)._workerStarted = true;

    console.log("⚙️ [Instrumentation] System initializing...");

    // Auto-connection (no bloquea)
    (async () => {
        try {
            const { AutoConnectionService } = await import("@/lib/server/auto-connection-service");
            await AutoConnectionService.run();
        } catch (e) {
            console.error("❌ [Instrumentation] AutoConnection failed:", e);
        }
    })();

    // Worker/Engine
    (async () => {
        try {
            // En DEV no arranques sidecars aquí (esto suele meter ruido y bloqueos)
            if (process.env.NODE_ENV !== "production") {
                console.log("🛑 [Instrumentation] Worker auto-start disabled in development mode.");
                return;
            }

            console.log("🚀 [Instrumentation] Auto-Starting Worker Sidecar...");
            const { initHandlers, startWorker } = await import("@/lib/worker");
            await initHandlers();
            startWorker();
            console.log("✅ [Instrumentation] Worker Sidecar is now backgrounded.");

            console.log("🚀 [Instrumentation] Auto-Starting EcomBoom Control Engine...");
            const engineScript = path.resolve(process.cwd(), "src/engine/start_engine.sh");
            const engineProcess = spawn("bash", [engineScript], {
                detached: true,
                stdio: "ignore",
                cwd: process.cwd(),
            });
            engineProcess.unref();
            console.log("✅ [Instrumentation] EcomBoom Control Engine initialization triggered.");
        } catch (e) {
            console.error("❌ [Instrumentation] Failed to auto-start worker:", e);
            (global as any)._workerStarted = false;
        }
    })();
}
