import { NextRequest, NextResponse } from 'next/server';
import { AvatarPerformanceService } from '@/lib/services/avatar-performance-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const productId = searchParams.get('productId') || undefined;

        const data = await AvatarPerformanceService.getPerformance(id, productId);
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
