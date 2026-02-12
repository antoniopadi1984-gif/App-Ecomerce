import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing new Prisma models...')
    try {
        // Try to count records in new tables (even if 0)
        const projects = await prisma.researchProject.count()
        const runs = await prisma.researchRun.count()
        const outputs = await prisma.researchOutput.count()

        console.log('OK: ResearchProject count:', projects)
        console.log('OK: ResearchRun count:', runs)
        console.log('OK: ResearchOutput count:', outputs)

        console.log('Verification Success: New models are accessible in the DB.')
    } catch (e) {
        console.error('Verification Failed:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
