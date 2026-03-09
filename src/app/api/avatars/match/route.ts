import { NextRequest, NextResponse } from 'next/server';
import { AvatarPerformanceService } from '@/lib/services/avatar-performance-service';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const productId = searchParams.get('productId');
        const funnelStage = searchParams.get('funnelStage') || undefined;
        const conceptType = searchParams.get('conceptType') || undefined;

        if (!productId) {
            return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
        }

        const avatar = await AvatarPerformanceService.suggestAvatar(productId, funnelStage, conceptType);
        return NextResponse.json({ success: true, avatar });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
