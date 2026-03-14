import { NextRequest, NextResponse } from 'next/server';
import { CreativeStorageService } from '@/lib/creative/services/creative-storage-service';

/**
 * GET /api/creative/library
 * 
 * Obtener librería de creativos
 * Query params: productId, type, stage, limit
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const type = searchParams.get('type');
        const stage = searchParams.get('stage') as 'COLD' | 'WARM' | 'HOT' | null;
        const limit = parseInt(searchParams.get('limit') || '50');
        const topPerformers = searchParams.get('topPerformers') === 'true';

        let creatives;

        if (topPerformers) {
            creatives = await CreativeStorageService.getTopPerformers(limit, type || undefined);
        } else if (stage) {
            creatives = await CreativeStorageService.getByStage(stage, productId || undefined);
        } else if (productId) {
            creatives = await CreativeStorageService.getByProduct(productId, { type: type || undefined });
        } else {
            // Get all recent creatives
            creatives = await CreativeStorageService.getRecent(limit);
        }

        return NextResponse.json({
            success: true,
            creatives,
            count: creatives.length
        });

    } catch (error: any) {
        console.error('[API] Error fetching creatives:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/creative/library
 * 
 * Guardar creative
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const creative = await CreativeStorageService.saveVideo(body);

        return NextResponse.json({
            success: true,
            creative
        });

    } catch (error: any) {
        console.error('[API] Error saving creative:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/creative/library/:id
 * 
 * Actualizar creative (rating, performance, etc)
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, action, data } = body;

        if (!id || !action) {
            return NextResponse.json(
                { success: false, error: 'id and action required' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'rate':
                result = await CreativeStorageService.rate(id, data.rating);
                break;
            case 'approve':
                result = await CreativeStorageService.approve(id);
                break;
            case 'archive':
                result = await CreativeStorageService.archive(id);
                break;
            case 'updatePerformance':
                result = await CreativeStorageService.updatePerformance(id, data);
                break;
            case 'setQualityScore':
                result = await CreativeStorageService.setQualityScore(id, data.score);
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            creative: result
        });

    } catch (error: any) {
        console.error('[API] Error updating creative:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
        await CreativeStorageService.deleteCreative(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error deleting creative:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
