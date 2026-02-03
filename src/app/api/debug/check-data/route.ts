
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const count = await prisma.adMetricDaily.count();
        const todayCount = await prisma.adMetricDaily.count({
            where: { date: { gte: new Date(todayStr) } }
        });

        let sample = null;
        if (todayCount > 0) {
            sample = await prisma.adMetricDaily.findFirst({
                where: { date: { gte: new Date(todayStr) } }
            });
        } else {
            // Get last record to see when it stopped
            sample = await prisma.adMetricDaily.findFirst({ orderBy: { date: 'desc' } });
        }

        return NextResponse.json({
            success: true,
            totalRows: count,
            todayRows: todayCount,
            dateChecked: todayStr,
            sampleOrLastRecord: sample
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
