import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- SEARCHING FOR RAMON ---");
    const ramon = await prisma.avatarProfile.findFirst({
        where: { name: { contains: 'RAMON' } },
        orderBy: { createdAt: 'desc' }
    });

    if (ramon) {
        console.log("RAMON PROFILE DETECTED:");
        console.log(JSON.stringify(ramon, null, 2));

        console.log("\n--- SEARCHING FOR JOBS FOR THIS PROFILE ---");
        const jobs = await (prisma as any).job.findMany({
            where: {
                payload: { contains: ramon.id },
                type: 'GENERATE_AVATAR_IMAGE'
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log("JOBS FOUND:");
        console.log(JSON.stringify(jobs, null, 2));
    } else {
        console.log("RAMON profile not found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
