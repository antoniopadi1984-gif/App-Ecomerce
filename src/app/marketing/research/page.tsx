import { prisma } from "@/lib/prisma";
import ResearchLab from "./ResearchLab";

export default async function ResearchPage() {
    const store = await prisma.store.findFirst();
    const products = await prisma.product.findMany({
        where: { storeId: store?.id }
    });

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <ResearchLab storeId={store.id} products={products} />
        </div>
    );
}
