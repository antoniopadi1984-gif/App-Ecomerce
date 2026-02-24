import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProductBrainPage() {
 const store = await prisma.store.findFirst();
 const product = await prisma.product.findFirst({ where: { storeId: store?.id } });

 if (product) {
 redirect(`/dashboard/productos/${product.id}/research`);
 }

 redirect("/dashboard/productos");
}
