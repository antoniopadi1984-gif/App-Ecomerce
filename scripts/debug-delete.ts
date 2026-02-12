
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Delete Debug Script...");

    // 1. Get a store ID
    const store = await prisma.store.findFirst();
    if (!store) {
        console.error("❌ No store found. Cannot create avatar.");
        return;
    }
    console.log(`✅ Using Store: ${store.id}`);

    // 2. Create Dummy Avatar
    const avatar = await prisma.avatarProfile.create({
        data: {
            storeId: store.id,
            name: "DEBUG_DELETE_TEST",
            sex: "FEMALE",
            status: "DRAFT"
        }
    });
    console.log(`✅ Created Dummy Avatar: ${avatar.id}`);

    // 3. Create Dummy Asset (to test cascade)
    await prisma.avatarAsset.create({
        data: {
            avatarProfileId: avatar.id,
            pathLocal: "/tmp/debug.png",
            type: "AVATAR_IMAGE"
        }
    });
    console.log(`✅ Created Dummy Asset for Avatar`);

    // 4. Attempt Delete
    try {
        console.log("🗑️ Attempting deletion...");
        await prisma.avatarProfile.delete({
            where: { id: avatar.id }
        });
        console.log("✅ Deletion SUCCESSFUL! (Cascade works)");
    } catch (e: any) {
        console.error("❌ Deletion FAILED:");
        console.error(e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
