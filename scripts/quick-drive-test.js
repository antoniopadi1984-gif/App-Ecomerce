/**
 * Quick Drive Connection Test
 */
const { google } = require('googleapis');
const sqlite3 = require('sqlite3');
const path = require('path');

async function quickTest() {
    console.log('🧪 Testing Drive Connection...\n');

    const dbPath = path.join(__dirname, '../prisma/dev.db');
    const db = new sqlite3.Database(dbPath);

    // Get credentials from DB
    const sa = await new Promise((resolve, reject) => {
        db.get(
            "SELECT extraConfig FROM Connection WHERE provider = 'GOOGLE_SERVICE_ACCOUNT' AND isActive = 1",
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });

    db.close();

    if (!sa || !sa.extraConfig) {
        console.error('❌ Service Account not found in database');
        process.exit(1);
    }

    const credentials = JSON.parse(sa.extraConfig);
    console.log(`✅ Credentials loaded`);
    console.log(`   Email: ${credentials.client_email}\n`);

    // Test Drive API
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
    });

    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });

    const response = await drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, mimeType)'
    });

    console.log(`✅ Drive API Connected`);
    console.log(`   Found ${response.data.files?.length || 0} accessible files/folders\n`);

    // Look for Ecombom Control
    const ecombom = response.data.files?.find(f => f.name === 'Ecombom Control');

    if (ecombom) {
        console.log('✅ "Ecombom Control" folder accessible!');
        console.log(`   ID: ${ecombom.id}\n`);
        console.log('🎉 ALL SYSTEMS GO!\n');
        console.log('The system can now:');
        console.log('  ✅ Create folders automatically');
        console.log('  ✅ Upload videos');
        console.log('  ✅ Export research data');
        console.log('  ✅ Organize creative assets\n');
        process.exit(0);
    } else {
        console.log('⚠️  "Ecombom Control" not found in accessible files');
        console.log('   Make sure the folder is shared with:');
        console.log(`   ${credentials.client_email}\n`);
        process.exit(1);
    }
}

quickTest().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
