/**
 * CLEANUP: Eliminar carpetas duplicadas de Drive
 */

import { google } from 'googleapis';
import { prisma } from '../src/lib/prisma';

async function cleanupDuplicateFolders() {
    console.log('\n🧹 CLEANUP: Eliminando carpetas duplicadas\n');

    // Get Service Account
    const sa = await prisma.connection.findFirst({
        where: { provider: "GOOGLE_SERVICE_ACCOUNT", isActive: true }
    });

    if (!sa?.extraConfig) {
        console.log('❌ No Service Account found');
        return;
    }

    const credentials = JSON.parse(sa.extraConfig as string);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: "v3", auth: await auth.getClient() as any });

    // Find product folder
    const productFolder = await prisma.product.findFirst({
        where: { driveFolderId: { not: null } },
        select: { driveFolderId: true, title: true }
    });

    if (!productFolder?.driveFolderId) {
        console.log('❌ No product folder found');
        return;
    }

    console.log(`Producto: ${productFolder.title}`);
    console.log(`Folder ID: ${productFolder.driveFolderId}\n`);

    // List all folders inside product folder
    const response = await drive.files.list({
        q: `'${productFolder.driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'name'
    });

    console.log(`Carpetas encontradas: ${response.data.files?.length || 0}\n`);

    // Folders to DELETE (old structure with numbers)
    const toDelete = [
        '00_ADMIN',
        '01_RESEARCH',
        '02_CLAUDE_COPY',
        '03_LANDINGS',
        '04_CREATIVOS',
        '05_AVATARES',
        '06_ADS_PERFORMANCE',
        '07_POSTVENTA_COD',
        '08_SCRIPTS',
        '09_COMPETENCIA',
        '10_STATIC_ADS'
    ];

    let deleted = 0;
    for (const file of response.data.files || []) {
        if (toDelete.includes(file.name!)) {
            console.log(`🗑️  Eliminando: ${file.name}`);
            await drive.files.delete({ fileId: file.id! });
            deleted++;
        } else {
            console.log(`✅ Manteniendo: ${file.name}`);
        }
    }

    console.log(`\n✅ Eliminadas ${deleted} carpetas duplicadas\n`);

    await prisma.$disconnect();
}

cleanupDuplicateFolders();
