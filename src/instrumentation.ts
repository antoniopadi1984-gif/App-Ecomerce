export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    const mod = await import("./instrumentation.node");
    await mod.registerNode();
}
