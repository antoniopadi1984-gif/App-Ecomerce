import { prisma } from "@/lib/prisma";
import AvatarLab from "./AvatarLab";

export default async function AvatarsPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <AvatarLab storeId={store.id} />
        </div>
    );
}
