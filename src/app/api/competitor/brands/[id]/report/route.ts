import { NextRequest, NextResponse } from 'next/server';
import { CompetitorService } from '@/lib/services/competitor-service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await params;
        const brandId = resolvedParams.id;

        const report = await CompetitorService.generateBrandReport(brandId);
        return NextResponse.json({ ok: true, report });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
