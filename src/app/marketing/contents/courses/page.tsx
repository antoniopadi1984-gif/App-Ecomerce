import { prisma } from "@/lib/prisma";
import CourseManager from "./CourseManager";

export default async function CoursesPage() {
    const store = await prisma.store.findFirst();

    if (!store) {
        return <div className="p-8 text-center">No se encontró tienda.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            <CourseManager storeId={store.id} />
        </div>
    );
}
