import { prisma } from "@/lib/prisma";
import CouponManager from "./CouponManager";

export default async function CouponsPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-6 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] p-6">
            <CouponManager storeId={store.id} />
        </div>
    );
}
