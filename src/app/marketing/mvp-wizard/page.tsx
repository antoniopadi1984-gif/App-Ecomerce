import { prisma } from "@/lib/prisma";
import MVPWizard from "./MVPWizard";

export default async function MVPWizardPage() {
    const stores = await prisma.store.findMany();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <MVPWizard stores={stores} />
        </div>
    );
}
