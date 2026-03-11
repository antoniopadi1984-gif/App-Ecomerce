require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');

async function test() {
    try {
        const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
        const auth = new google.auth.GoogleAuth({
            credentials: saKey,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });
        const folderId = '1L3tcrb2eX_eOd86Q9LRDQAgRCRSbt7iv';
        
        const res = await drive.files.get({ 
            fileId: folderId, 
            fields: 'id, name, parents, capabilities',
            supportsAllDrives: true 
        });
        console.log("Folder Info:", JSON.stringify(res.data, null, 2));

    } catch (e) {
        console.error(e.message);
    }
}
test();
