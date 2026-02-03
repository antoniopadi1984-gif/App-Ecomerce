
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const TOKEN = process.env.META_ACCESS_TOKEN;
const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

if (!TOKEN || !APP_ID || !APP_SECRET) {
    console.error("❌ Missing META credentials in .env");
    process.exit(1);
}

const GRAPH_API = 'https://graph.facebook.com/v20.0';

async function validate() {
    console.log("🔍 Starting Mandatory Meta API Tests...");

    // 1. Debug Token
    try {
        console.log("\n1️⃣  Testing Token Validity & Scopes...");
        const appAccessToken = `${APP_ID}|${APP_SECRET}`;
        const debugUrl = `${GRAPH_API}/debug_token?input_token=${TOKEN}&access_token=${appAccessToken}`;

        const debugRes = await fetch(debugUrl);
        const debugJson = await debugRes.json();

        if (debugJson.error) {
            throw new Error(debugJson.error.message);
        }

        const data = debugJson.data;

        if (data.is_valid) {
            console.log("✅ Token is VALID");
            console.log(`   Expires at: ${data.expires_at}`);
            console.log(`   Scopes: ${JSON.stringify(data.scopes)}`);

            const requiredScopes = ['ads_read', 'read_insights'];
            const missing = requiredScopes.filter(s => !data.scopes.includes(s));
            if (missing.length > 0) {
                console.warn(`⚠️  WARNING: Missing scopes: ${missing.join(', ')}`);
            } else {
                console.log("✅ Required scopes present (ads_read, read_insights).");
            }
        } else {
            console.error("❌ Token is INVALID");
            console.error(data);
            return;
        }

    } catch (e: any) {
        console.error("❌ Failed to debug token:", e.message);
    }

    // 2. Ad Accounts
    let firstAccountId = '';
    try {
        console.log("\n2️⃣  Testing Ad Accounts Access...");
        const accountsUrl = `${GRAPH_API}/me/adaccounts?fields=id,name,account_status&limit=5&access_token=${TOKEN}`;
        const accRes = await fetch(accountsUrl);
        const accJson = await accRes.json();

        if (accJson.error) throw new Error(accJson.error.message);

        const accounts = accJson.data;

        if (accounts && accounts.length > 0) {
            console.log(`✅ Found ${accounts.length} ad accounts.`);
            console.log(JSON.stringify(accounts, null, 2));
            firstAccountId = accounts[0].id;
        } else {
            console.error("❌ No ad accounts found. Token might belong to a user without ad access.");
            return;
        }
    } catch (e: any) {
        console.error("❌ Failed to fetch ad accounts:", e.message);
        return;
    }

    if (!firstAccountId) return;

    // 3. Campaigns
    try {
        console.log(`\n3️⃣  Testing Campaigns Access for account ${firstAccountId}...`);
        const campaignsUrl = `${GRAPH_API}/${firstAccountId}/campaigns?fields=id,name,status&limit=5&access_token=${TOKEN}`;
        const campRes = await fetch(campaignsUrl);
        const campJson = await campRes.json();

        if (campJson.error) throw new Error(campJson.error.message);

        const campaigns = campJson.data;

        console.log(`✅ Found ${campaigns.length} campaigns.`);
        if (campaigns.length > 0) {
            console.log("Sample campaign:", JSON.stringify(campaigns[0], null, 2));
        }
    } catch (e: any) {
        console.error("❌ Failed to fetch campaigns:", e.message);
    }

    // 4. Insights
    try {
        console.log(`\n4️⃣  Testing Insights Access for account ${firstAccountId} (today)...`);
        const insightsUrl = `${GRAPH_API}/${firstAccountId}/insights?level=campaign&date_preset=today&fields=campaign_id,campaign_name,spend,impressions&access_token=${TOKEN}`;
        const insightsRes = await fetch(insightsUrl);
        const insightsJson = await insightsRes.json();

        if (insightsJson.error) throw new Error(insightsJson.error.message);

        const insights = insightsJson.data;

        console.log(`✅ Found ${insights.length} insight records.`);
        if (insights.length > 0) {
            console.log("Sample insight:", JSON.stringify(insights[0], null, 2));
        } else {
            console.log("   (Empty insights might mean no delivery today. Trying last_7d...)");
            const insights7dUrl = `${GRAPH_API}/${firstAccountId}/insights?level=campaign&date_preset=last_7d&fields=campaign_id,name,spend,impressions&access_token=${TOKEN}`;
            const insights7dRes = await fetch(insights7dUrl);
            const insights7dJson = await insights7dRes.json();

            if (insights7dJson.data) {
                console.log(`   last_7d found ${insights7dJson.data.length} records.`);
            }
        }

    } catch (e: any) {
        console.error("❌ Failed to fetch insights:", e.message);
    }
}

validate();
