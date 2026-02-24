import { NextRequest, NextResponse } from "next/server";
import { getConnectionSecret, getConnectionMeta } from "@/lib/server/connections";

export async function GET(request: NextRequest) {
    try {
        const storeId = 'cmlxrad5405b826d99j9kpgyy'; // AleCare Shop
        const provider = 'SHOPIFY';

        console.log(`[API] Testing Connection Fetches for ${storeId} - ${provider}`);

        const secret = await getConnectionSecret(storeId, provider);
        const meta = await getConnectionMeta(storeId, provider);

        return NextResponse.json({
            success: true,
            secretIsDefined: !!secret,
            secretValuePreview: secret ? secret.substring(0, 5) + '...' : null,
            metaIsDefined: !!meta,
            extraConfigIsDefined: !!meta?.extraConfig,
            extraConfigPreview: meta?.extraConfig,
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, raw: String(e) });
    }
}
