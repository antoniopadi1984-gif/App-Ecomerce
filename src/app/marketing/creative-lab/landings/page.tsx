import { prisma } from "@/lib/prisma";
import LandingLab from "./LandingLab";

export default async function LandingsPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    const products = await prisma.product.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <LandingLab storeId={store.id} products={products} />
        </div>
    );
}
