/**
 * TEST DIRECTO: ¿Drive sync crea carpetas?
 */

import { prisma } from '../src/lib/prisma';
import { ResearchLabIntegration } from '../src/lib/research/research-lab-integration';

async function testDriveFolders() {
    console.log('\n📁 TEST: Drive Folder Creation\n');

    // Get ANY product with research
    const product = await prisma.product.findFirst({
        select: {
            id: true,
            title: true,
            driveFolderId: true,
            driveRootPath: true
        }
    });

    if (!product) {
        console.log('❌ No product found');
        return;
    }

    console.log(`Producto: ${product.title}`);
    console.log(`Drive Folder ID: ${product.driveFolderId || 'NOT SET'}`);
    console.log(`Drive Path: ${product.driveRootPath || 'NOT SET'}\n`);

    if (product.driveFolderId) {
        console.log('✅ Carpetas YA creadas. Verifica en Google Drive.\n');
        return;
    }

    console.log('🔄 Creando carpetas ahora...\n');

    try {
        const result = await ResearchLabIntegration.onProductCreated(product.id);

        if (result.success) {
            console.log('✅ ¡CARPETAS CREADAS!');

            const updated = await prisma.product.findUnique({
                where: { id: product.id },
                select: { driveFolderId: true, driveRootPath: true }
            });

            console.log(`Folder ID: ${updated?.driveFolderId}`);
            console.log(`Path: ${updated?.driveRootPath}\n`);
            console.log('Verifica en: https://drive.google.com\n');
        } else {
            console.log(`❌ Error: ${result.error}\n`);
        }
    } catch (error: any) {
        console.error(`💥 ERROR: ${error.message}`);
    }

    await prisma.$disconnect();
}

testDriveFolders();
