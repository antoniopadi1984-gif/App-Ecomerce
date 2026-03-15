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

        // Save connection in DB — leer storeId del parámetro state del OAuth
        const storeId = searchParams.get('state') || 'store-main';
        const store = await prisma.store.findUnique({ where: { id: storeId } })
            || await prisma.store.findFirst();
        if (!store) throw new Error('No store found — asegúrate de que hay al menos una tienda en BD');

        // Upsert conexión principal GOOGLE_OAUTH
        await prisma.connection.upsert({
            where: { storeId_provider: { storeId: store.id, provider: 'GOOGLE_OAUTH' } },
            update: {
                secretEnc: tokens.refresh_token || tokens.access_token,
                accessToken: tokens.access_token,
                extraConfig: JSON.stringify({
                    refresh_token: tokens.refresh_token,
                    access_token: tokens.access_token,
                    token_type: tokens.token_type,
                    expires_in: tokens.expires_in,
                    scope: tokens.scope,
                    granted_at: new Date().toISOString()
                }),
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: 'GOOGLE_OAUTH',
                secretEnc: tokens.refresh_token || tokens.access_token,
                accessToken: tokens.access_token,
                extraConfig: JSON.stringify({
                    refresh_token: tokens.refresh_token,
                    access_token: tokens.access_token,
                    scope: tokens.scope,
                    granted_at: new Date().toISOString()
                }),
                isActive: true
            }
        });

        // También: GOOGLE_SHEETS (retrocompatibilidad)
        await prisma.connection.upsert({
            where: { storeId_provider: { storeId: store.id, provider: 'GOOGLE_SHEETS' } },
            update:  { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true },
            create:  { storeId: store.id, provider: 'GOOGLE_SHEETS', apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true }
        });

        // También: GOOGLE_ANALYTICS si el scope lo incluye
        if (tokens.scope?.includes('analytics')) {
            await prisma.connection.upsert({
                where: { storeId_provider: { storeId: store.id, provider: 'GOOGLE_ANALYTICS' } },
                update:  { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true },
                create:  { storeId: store.id, provider: 'GOOGLE_ANALYTICS', apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true }
            });
        }

        // También: GOOGLE_DRIVE
        if (tokens.scope?.includes('drive')) {
            await prisma.connection.upsert({
                where: { storeId_provider: { storeId: store.id, provider: 'GOOGLE_DRIVE' } },
                update:  { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true },
                create:  { storeId: store.id, provider: 'GOOGLE_DRIVE', apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true }
            });
        }

        // NUEVO: GOOGLE_GMAIL si se concedió el scope
        if (tokens.scope?.includes('gmail')) {
            await prisma.connection.upsert({
                where: { storeId_provider: { storeId: store.id, provider: 'GOOGLE_GMAIL' } },
                update:  { apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true },
                create:  { storeId: store.id, provider: 'GOOGLE_GMAIL', apiKey: tokens.access_token, apiSecret: tokens.refresh_token, secretEnc: tokens.refresh_token, accessToken: tokens.access_token, isActive: true }
            });
        }

        return NextResponse.redirect(`${origin}/connections?success=google_connected`);

    } catch (err: any) {
        console.error("Google Callback Exception:", err.message);
        return NextResponse.redirect(`${origin}/connections?error=server_error`);
    }
}
