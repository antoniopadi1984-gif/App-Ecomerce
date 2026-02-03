import { prisma } from "@/lib/prisma";
import LibraryLab from "./LibraryLab";

export default async function LibraryPage() {
    const store = await prisma.store.findFirst();
    const products = await prisma.product.findMany({
        where: { storeId: store?.id }
    });

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <LibraryLab storeId={store.id} products={products} />
        </div>
    );
}
