import { prisma } from "@/lib/prisma";
import StaticLab from "./StaticLab";

export default async function StaticAdsPage() {
    const store = await prisma.store.findFirst();
    const products = await prisma.product.findMany({
        where: { storeId: store?.id }
    });

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <StaticLab storeId={store.id} products={products} />
        </div>
    );
}
