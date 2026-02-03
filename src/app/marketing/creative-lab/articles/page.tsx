import { prisma } from "@/lib/prisma";
import ArticleLab from "./ArticleLab";

export default async function ArticlesPage() {
    const store = await prisma.store.findFirst();
    const products = await prisma.product.findMany({
        where: { storeId: store?.id }
    });

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <ArticleLab storeId={store.id} products={products} />
        </div>
    );
}
