import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        return NextResponse.redirect(`${origin}/connections?error=google_failed`);
    }

    try {
        // Fetch Dynamic Configuration
        const appConfig = await prisma.connection.findFirst({
            where: { provider: "GOOGLE_APP", isActive: true }
        });

        const clientId = appConfig?.apiKey || process.env.GOOGLE_OAUTH_CLIENT_ID;
        const clientSecret = appConfig?.apiSecret || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

        // Hardcoded to match the start route exactly
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error("Google Token Error:", tokens.error_description);
            return NextResponse.redirect(`${origin}/connections?error=token_exchange`);
        }

        // Save connection in DB
        // Determine storeId (default for now)
        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({ data: { name: "Nano Banana Store", currency: "EUR" } });
        }

        // Upsert GOOGLE_OAUTH connection
        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: "GOOGLE_SHEETS" // Using Google Sheets as the primary label for the Google identity
                }
            },
            update: {
                apiKey: tokens.access_token,
                apiSecret: tokens.refresh_token, // Store refresh token in apiSecret for persistent access
                extraConfig: JSON.stringify({
                    expires_at: Date.now() + (tokens.expires_in * 1000),
                    scope: tokens.scope,
                    token_type: tokens.token_type
                }),
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: "GOOGLE_SHEETS",
                apiKey: tokens.access_token,
                apiSecret: tokens.refresh_token,
                extraConfig: JSON.stringify({
                    expires_at: Date.now() + (tokens.expires_in * 1000),
                    scope: tokens.scope,
                    token_type: tokens.token_type
                }),
                isActive: true
            }
        });

        // Also update Google Analytics connection if scope matches
        if (tokens.scope?.includes("analytics")) {
            await prisma.connection.upsert({
                where: { storeId_provider: { storeId: store.id, provider: "GOOGLE_ANALYTICS" } },
                update: { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, isActive: true },
                create: { storeId: store.id, provider: "GOOGLE_ANALYTICS", apiKey: tokens.access_token, apiSecret: tokens.refresh_token, isActive: true }
            });
        }

        // Upsert GOOGLE_DRIVE connection (Critical for Deep Research)
        if (tokens.scope?.includes("drive")) {
            await prisma.connection.upsert({
                where: { storeId_provider: { storeId: store.id, provider: "GOOGLE_DRIVE" } },
                update: { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, isActive: true },
                create: { storeId: store.id, provider: "GOOGLE_DRIVE", apiKey: tokens.access_token, apiSecret: tokens.refresh_token, isActive: true }
            });
        }

        return NextResponse.redirect(`${origin}/connections?success=google_connected`);

    } catch (err: any) {
        console.error("Google Callback Exception:", err.message);
        return NextResponse.redirect(`${origin}/connections?error=server_error`);
    }
}
