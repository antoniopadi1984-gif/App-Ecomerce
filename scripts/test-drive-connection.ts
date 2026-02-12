/**
 * Test Google Drive Connection
 * 
 * This script verifies that the Service Account is properly configured
 * and can connect to Google Drive API
 */

import { prisma } from './src/lib/prisma';
import { google } from 'googleapis';

async function testDriveConnection() {
    try {
        console.log('🔍 Testing Google Drive Service Account connection...\n');

        // 1. Load Service Account from database
        console.log('Step 1: Loading Service Account credentials from database...');
        const sa = await prisma.connection.findFirst({
            where: {
                provider: 'GOOGLE_SERVICE_ACCOUNT',
                isActive: true
            }
        });

        if (!sa || !sa.extraConfig) {
            console.error('❌ Service Account not found in database');
            console.error('Run the setup script first to add credentials');
            process.exit(1);
        }

        const credentials = JSON.parse(sa.extraConfig as string);
        console.log('✅ Credentials loaded');
        console.log(`   Email: ${credentials.client_email}`);
        console.log(`   Project: ${credentials.project_id}\n`);

        // 2. Create Google Auth client
        console.log('Step 2: Creating Google Auth client...');
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        const client = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: client as any });
        console.log('✅ Auth client created\n');

        // 3. Test Drive API access
        console.log('Step 3: Testing Drive API access...');
        const response = await drive.files.list({
            pageSize: 10,
            fields: 'files(id, name, mimeType)'
        });

        console.log('✅ Drive API accessible');
        console.log(`   Found ${response.data.files?.length || 0} files/folders\n`);

        // 4. Look for "Ecombom Control" folder
        console.log('Step 4: Looking for "Ecombom Control" folder...');
        const ecombomFolder = response.data.files?.find(
            f => f.name === 'Ecombom Control' && f.mimeType === 'application/vnd.google-apps.folder'
        );

        if (ecombomFolder) {
            console.log('✅ "Ecombom Control" folder found!');
            console.log(`   Folder ID: ${ecombomFolder.id}\n`);
        } else {
            console.log('⚠️  "Ecombom Control" folder NOT found');
            console.log('   You need to:');
            console.log('   1. Create "Ecombom Control" folder in YOUR Google Drive');
            console.log(`   2. Share it with: ${credentials.client_email}`);
            console.log('   3. Grant "Editor" permissions\n');
        }

        // 5. Summary
        console.log('═══════════════════════════════════════════');
        console.log('📊 CONNECTION TEST SUMMARY');
        console.log('═══════════════════════════════════════════');
        console.log('✅ Service Account: CONFIGURED');
        console.log('✅ Database: CREDENTIALS LOADED');
        console.log('✅ Google Auth: WORKING');
        console.log('✅ Drive API: ACCESSIBLE');
        console.log(ecombomFolder ? '✅ Ecombom Folder: FOUND' : '⚠️  Ecombom Folder: NOT SHARED');
        console.log('═══════════════════════════════════════════\n');

        if (!ecombomFolder) {
            console.log('⚠️  NEXT STEP: Share "Ecombom Control" folder');
            console.log(`   Email to share with: ${credentials.client_email}`);
            console.log('   Permission level: Editor\n');
        } else {
            console.log('🎉 ALL SYSTEMS READY!');
            console.log('   The system can now:');
            console.log('   - Create folders automatically');
            console.log('   - Upload videos');
            console.log('   - Organize assets');
            console.log('   - Export research data\n');
        }

        process.exit(ecombomFolder ? 0 : 1);

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testDriveConnection();
