import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SETTINGS_PROVIDER_KEY = "ALERT_SYSTEM";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || "default-store";

        const connection = await prisma.connection.findUnique({
            where: {
                storeId_provider: {
                    storeId,
                    provider: SETTINGS_PROVIDER_KEY
                }
            }
        });

        if (!connection?.extraConfig) {
            return NextResponse.json({ thresholds: null });
        }

        return NextResponse.json({
            thresholds: JSON.parse(connection.extraConfig)
        });

    } catch (error) {
        console.error("Error fetching alert thresholds:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { storeId, thresholds } = await request.json();

        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId,
                    provider: SETTINGS_PROVIDER_KEY
                }
            },
            update: {
                extraConfig: JSON.stringify(thresholds),
                updatedAt: new Date()
            },
            create: {
                storeId,
                provider: SETTINGS_PROVIDER_KEY,
                extraConfig: JSON.stringify(thresholds),
                isActive: true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving alert thresholds:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
