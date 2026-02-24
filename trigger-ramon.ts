import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const avatarId = "cmlsjamva00bd26wrmflx5qac";

    console.log(`Resetting status for avatar ${avatarId}...`);
    await prisma.avatarProfile.update({
        where: { id: avatarId },
        data: { status: 'PROCESANDO', lastError: null }
    });

    console.log("Enqueuing new GENERATE_AVATAR_IMAGE job...");
    const job = await (prisma as any).job.create({
        data: {
            type: 'GENERATE_AVATAR_IMAGE',
            status: 'PENDING',
            payload: JSON.stringify({ avatarProfileId: avatarId, tier: 'premium' })
        }
    });

    console.log(`Job created with ID: ${job.id}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
