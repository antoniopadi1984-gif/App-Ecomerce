/**
 * DEBUG: ¿Por qué se cuelga Drive sync?
 */

import { google } from 'googleapis';
import { prisma } from '../src/lib/prisma';

async function debugDriveAuth() {
    console.log('\n🔍 DEBUG: Drive Authentication\n');

    // 1. Check Service Account in DB
    const sa = await prisma.connection.findFirst({
        where: { provider: "GOOGLE_SERVICE_ACCOUNT", isActive: true }
    });

    if (!sa) {
        console.log('❌ No Service Account found in DB');
        return;
    }

    console.log(`✅ Service Account found: ${sa.name}`);
    console.log(`   ID: ${sa.id}`);
    console.log(`   Config size: ${sa.extraConfig?.length || 0} chars\n`);

    if (!sa.extraConfig) {
        console.log('❌ No extraConfig (credentials JSON)');
        return;
    }

    // 2. Try to parse credentials
    try {
        const credentials = JSON.parse(sa.extraConfig as string);
        console.log('✅ Credentials parsed successfully');
        console.log(`   Email: ${credentials.client_email}`);
        console.log(`   Project: ${credentials.project_id}\n`);

        // 3. Try to authenticate
        console.log('🔄 Testing Google Auth...');
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        const client = await auth.getClient();
        console.log('✅ Auth client created successfully\n');

        // 4. Try to initialize Drive API
        console.log('🔄 Initializing Drive API...');
        const drive = google.drive({ version: "v3", auth: client as any });
        console.log('✅ Drive API initialized\n');

        // 5. Try to list files (simple test)
        console.log('🔄 Testing Drive API with simple query...');
        const response = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)'
        });

        console.log('✅ Drive API works!');
        console.log(`   Found ${response.data.files?.length || 0} files\n`);

        if (response.data.files && response.data.files.length > 0) {
            console.log(`   Example file: ${response.data.files[0].name}`);
        }

        console.log('\n✅ DRIVE AUTH FUNCIONA CORRECTAMENTE\n');

    } catch (error: any) {
        console.error('❌ ERROR:', error.message);
        if (error.code) console.error('   Code:', error.code);
        if (error.errors) console.error('   Details:', error.errors);
    }

    await prisma.$disconnect();
}

debugDriveAuth();
