import { prisma } from "@/lib/prisma";
import AutomationManager from "./AutomationManager";

export default async function AutomationsPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <AutomationManager storeId={store.id} />
        </div>
    );
}
