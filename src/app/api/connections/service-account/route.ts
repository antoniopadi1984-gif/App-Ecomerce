import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { serviceAccountJson } = body;

        if (!serviceAccountJson) {
            return NextResponse.json({ error: "No JSON provided" }, { status: 400 });
        }

        let parsedJson;
        try {
            parsedJson = typeof serviceAccountJson === 'string'
                ? JSON.parse(serviceAccountJson)
                : serviceAccountJson;

            if (!parsedJson.client_email || !parsedJson.private_key) {
                throw new Error("Invalid Service Account JSON");
            }
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON format. Please paste the entire content of the key file." }, { status: 400 });
        }

        // Determine store (defaulting to first or creating one)
        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({ data: { name: "Nano Banana Store", currency: "EUR" } });
        }

        // Upsert Connection
        await prisma.connection.upsert({
            where: {
                storeId_provider: {
                    storeId: store.id,
                    provider: "GOOGLE_CLOUD"
                }
            },
            update: {
                apiKey: parsedJson.client_id || "SERVICE_ACCOUNT",
                apiSecret: "HIDDEN_PRIVATE_KEY",
                extraConfig: JSON.stringify(parsedJson),
                isActive: true
            },
            create: {
                storeId: store.id,
                provider: "GOOGLE_CLOUD",
                apiKey: parsedJson.client_id || "SERVICE_ACCOUNT",
                apiSecret: "HIDDEN_PRIVATE_KEY",
                extraConfig: JSON.stringify(parsedJson),
                isActive: true
            }
        });

        return NextResponse.json({ success: true, email: parsedJson.client_email });

    } catch (error: any) {
        console.error("Service Account Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
