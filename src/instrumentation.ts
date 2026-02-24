export async function register() {
    // En desarrollo NO arrancamos worker ni engine desde aquí.
    // Esto evita que Next intente meter APIs Node en Edge Runtime.
    if (process.env.NODE_ENV !== "production") {
        console.log("🛑 [Instrumentation] Worker/Engine auto-start disabled (dev).");
        return;
    }

    // En producción, si quieres auto-start, se hace desde scripts/procesos externos,
    // no desde instrumentation, para no romper runtimes.
    console.log("ℹ️ [Instrumentation] Production mode: no auto-start here.");
}
