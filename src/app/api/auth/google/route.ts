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
        // Workspace
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        // Analytics
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics',
        // User identity
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        // Cloud Platform (Vertex AI, Veo, Gemini, etc.)
        'https://www.googleapis.com/auth/cloud-platform',
        // Gmail — agente que responde clientes
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
    ].join(' ');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
}
