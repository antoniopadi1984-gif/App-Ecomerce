import { prisma } from "@/lib/prisma";
import ProductBrain from "./ProductBrain";

export default async function ProductBrainPage() {
    const store = await prisma.store.findFirst();
    const product = await prisma.product.findFirst({ where: { storeId: store?.id } });

    if (!store || !product) {
        return <div className="p-8 text-center font-black text-rose-500 uppercase">Sin Datos Disponibles. Crea un producto primero.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <ProductBrain productId={product.id} />
        </div>
    );
}
