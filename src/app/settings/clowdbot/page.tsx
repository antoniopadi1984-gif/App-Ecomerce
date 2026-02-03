import { prisma } from "@/lib/prisma";
import AgentManager from "./AgentManager";

export default async function ClowdbotSettingsPage() {
    // For now, fetch the first store. In a multi-tenant setup, this would come from session/context.
    const store = await prisma.store.findFirst();

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-200">
                    <h2 className="text-2xl font-black text-slate-800">No se encontró ninguna tienda</h2>
                    <p className="text-slate-500 mt-2">Por favor, configura una tienda primero.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd]">
            <AgentManager storeId={store.id} />
        </div>
    );
}
