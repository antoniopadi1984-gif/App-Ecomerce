export async function register() {
    // Next puede evaluar esto en Edge. Aquí NO puede existir ni child_process, ni path, ni process.cwd().
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const mod = await import("./instrumentation.node");
        await mod.registerNodeOnly();
    } else {
        // Edge runtime: no hacemos nada
        // (esto evita el error que estás viendo)
    }
}
