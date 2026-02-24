export async function registerNode() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    // No iniciar worker automáticamente en desarrollo
    if (process.env.NODE_ENV === "development" && !process.env.FORCE_WORKER) {
        console.log("🛑 [Instrumentation] Worker auto-start disabled in development mode.");
        return;
    }

    const { spawn } = await import("child_process");
    const path = await import("path");

    if ((global as any)._workerStarted) {
        console.log("⏭️ [Instrumentation] Worker already started, skipping...");
        return;
    }

    (global as any)._workerStarted = true;

    console.log("⚙️ [Instrumentation] Production Worker Initialization...");

    try {
        const { AutoConnectionService } = await import("@/lib/server/auto-connection-service");
        await AutoConnectionService.run();

        console.log("🚀 Starting Worker...");
        const { initHandlers, startWorker } = await import("@/lib/worker");
        await initHandlers();
        startWorker();

        console.log("🚀 Starting Engine...");
        const engineScript = path.resolve(process.cwd(), "src/engine/start_engine.sh");

        const engineProcess = spawn("bash", [engineScript], {
            detached: true,
            stdio: 'ignore',
            cwd: process.cwd()
        });

        engineProcess.unref();

        console.log("✅ Worker & Engine Running.");
    } catch (e) {
        console.error("❌ Worker initialization failed:", e);
        (global as any)._workerStarted = false;
    }
}
