
import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const health = await getSystemHealth();
        return NextResponse.json(health);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
