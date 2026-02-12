import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        const assets = await prisma.creativeAsset.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        const projects = await prisma.creativeProject.findMany({
            where: { productId },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });

        // Calculate some basic stats
        const totalSpend = assets.reduce((sum, a) => sum + (a.spend || 0), 0);
        const totalRevenue = assets.reduce((sum, a) => sum + (a.revenue || 0), 0);
        const avgCtr = assets.length > 0
            ? assets.reduce((sum, a) => sum + (a.ctr || 0), 0) / assets.length
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                assets,
                projects,
                stats: {
                    totalSpend,
                    totalRevenue,
                    avgCtr,
                    count: assets.length
                }
            }
        });
    } catch (error) {
        console.error('[API] Error fetching creative data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch creative details' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;
        const body = await request.json();
        const { action, payload } = body;

        switch (action) {
            case 'AUDIT':
                // Placeholder for real audit logic (calling runMasterAudit)
                return NextResponse.json({ success: true, message: "Audit triggered" });

            case 'CLIP':
                // Placeholder for real clipping logic
                return NextResponse.json({ success: true, message: "Clipping triggered" });

            case 'BATCH_NAME':
                // Placeholder for batch naming logic
                return NextResponse.json({ success: true, message: "Batch naming triggered" });

            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error('[API] Error performing creative action:', error);
        return NextResponse.json(
            { success: false, error: 'Operation failed' },
            { status: 500 }
        );
    }
}
