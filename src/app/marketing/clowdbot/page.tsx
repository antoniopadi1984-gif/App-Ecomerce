import { prisma } from "@/lib/prisma";
import ClowdbotHub from "./ClowdbotHub";

export default async function ClowdbotPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center font-black text-rose-500 uppercase">Sin Tienda Detectada.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <ClowdbotHub storeId={store.id} />
        </div>
    );
}
