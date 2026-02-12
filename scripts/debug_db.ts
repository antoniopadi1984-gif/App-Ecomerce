import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DB DEBUG ---')
    const count = await prisma.store.count()
    console.log('Total Stores:', count)

    if (count > 0) {
        const store = await prisma.store.findFirst()
        console.log('Valid Store ID found:', store?.id)
    } else {
        console.log('CRITICAL: No Stores found in DB!')
    }

    const avatarProfilesCount = await prisma.avatarProfile.count()
    console.log('Total Avatar Profiles:', avatarProfilesCount)

    console.log('----------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
