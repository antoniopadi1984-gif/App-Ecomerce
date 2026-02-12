/**
 * TEST SIMPLE: ¿Drive sync crea carpetas al terminar investigación?
 */

import { prisma } from '../src/lib/prisma';
import { ResearchLabIntegration } from '../src/lib/research/research-lab-integration';

async function testDriveFolderCreation() {
    console.log('\n📁 ========== TEST DRIVE FOLDER CREATION ==========\n');

    // Get product with completed research
    const product = await prisma.product.findFirst({
        where: {
            researchProjects: {
                some: {
                    versions: {
                        some: {
                            status: 'READY'
                        }
                    }
                }
            }
        },
        select: {
            id: true,
            title: true,
            driveFolderId: true,
            driveRootPath: true,
            country: true
        }
    });

    if (!product) {
        console.log('❌ No hay productos con investigación completada');
        console.log('   Ejecuta primero una investigación desde Research Lab\n');
        return;
    }

    console.log(`✅ Producto encontrado: ${product.title}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Drive Folder ID actual: ${product.driveFolderId || 'NO CREADO'}`);
    console.log(`   Drive Path actual: ${product.driveRootPath || 'NO CREADO'}\n`);

    if (product.driveFolderId) {
        console.log('✅ Las carpetas de Drive YA FUERON CREADAS');
        console.log('   Verifica en Google Drive: https://drive.google.com\n');
        return;
    }

    // Try to create Drive structure now
    console.log('🔄 Intentando crear estructura de carpetas en Drive...\n');

    try {
        const result = await ResearchLabIntegration.onProductCreated(product.id);

        if (result.success) {
            console.log('✅ ¡ÉXITO! Carpetas creadas en Drive');

            // Verify in DB
            const updated = await prisma.product.findUnique({
                where: { id: product.id },
                select: { driveFolderId: true, driveRootPath: true }
            });

            console.log(`   Drive Folder ID: ${updated?.driveFolderId || 'ERROR'}`);
            console.log(`   Drive Path: ${updated?.driveRootPath || 'ERROR'}`);
            console.log('\n   Verifica en Google Drive: https://drive.google.com');
            console.log('   Busca: Ecombom Control > [Store] > ' + product.title + '\n');

        } else {
            console.log('❌ FALLÓ al crear carpetas');
            console.log(`   Error: ${result.error}\n`);
        }

    } catch (error: any) {
        console.error('💥 ERROR:', error.message);
        console.error('   Stack:', error.stack);
    }

    await prisma.$disconnect();
}

testDriveFolderCreation();
