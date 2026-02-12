import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Fetch Dynamic Configuration
    const { prisma } = await import("@/lib/prisma");
    const appConfig = await prisma.connection.findFirst({
        where: { provider: "GOOGLE_APP", isActive: true }
    });

    const clientId = appConfig?.apiKey || process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

    console.log("🔵 [Google Auth] Using Redirect URI:", redirectUri);

    if (!clientId) {
        return NextResponse.json({ error: "Missing Google Client ID configuration." }, { status: 500 });
    }

    // We request offline access to get a refresh_token
    const scopes = [
        "https://www.googleapis.com/auth/spreadsheets", // Full Sheets Access
        "https://www.googleapis.com/auth/drive",        // Full Drive Access
        "https://www.googleapis.com/auth/analytics.readonly", // GA4 Data
        "https://www.googleapis.com/auth/analytics",    // GA4 Management
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/cloud-platform" // Access to Vertex AI (Veo, Gemini, etc.)
    ].join(" ");

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
}
