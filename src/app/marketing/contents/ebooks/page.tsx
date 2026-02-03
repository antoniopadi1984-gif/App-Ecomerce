import { prisma } from "@/lib/prisma";
import EbookManager from "./EbookManager";

export default async function EbooksPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <EbookManager storeId={store.id} />
        </div>
    );
}
