import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB CONNECTIONS DIAGNOSTIC ---');
    const storeId = 'cmlxrad5405b826d99j9kpgyy'; // AleCare Shop

    const conns = await prisma.connection.findMany({
        where: { storeId }
    });

    console.log(`Found ${conns.length} connections for AleCare Shop.`);
    conns.forEach(c => console.log(`- Connection ID: ${c.id}, Provider: ${c.provider}, IsActive: ${c.isActive}`));

    // Check if it's returning from the API endpoint directly
    const res = await fetch('http://localhost:3000/api/connections?reveal=true', {
        headers: {
            'X-Store-Id': storeId
        }
    });

    if (res.ok) {
        const json = await res.json();
        console.log(`API Returned ${json.length} connections for AleCare Shop header.`);
        json.forEach((c: any) => console.log(`- API Conn: ${c.id}, Provider: ${c.provider}, StoreId: ${c.storeId}`));
    } else {
        console.error('API failed:', res.status);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
