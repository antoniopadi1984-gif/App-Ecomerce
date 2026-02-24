import { prisma } from "@/lib/prisma";
import { ProductSettings } from "@/components/products/ProductSettings";
import { notFound } from "next/navigation";

export default async function ProductSettingsPage({ params }: { params: Promise<{ productId: string }> | { productId: string } }) {
    const resolvedParams = await params;
    const productId = resolvedParams.productId;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            metaConfig: true,
            supplier: true,
        }
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="py-6">
            <ProductSettings product={product} />
        </div>
    );
}
