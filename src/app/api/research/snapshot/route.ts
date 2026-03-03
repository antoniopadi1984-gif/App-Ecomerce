import { NextRequest, NextResponse } from 'next/server';
import { ResearchMetricsSnapshotService } from '@/lib/research/research-snapshot-service';

/**
 * Research Snapshot API
 * For auto-save, version history, and rollback
 */

/**
 * POST - Create snapshot
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            productId,
            productDNA,
            vocInsights,
            avatars,
            angles,
            completeness,
            quality
        } = body;

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'productId required' },
                { status: 400 }
            );
        }

        const snapshot = await ResearchMetricsSnapshotService.createSnapshot({
            productId,
            productDNA,
            vocInsights,
            avatars,
            angles,
            completeness,
            quality
        });

        return NextResponse.json({
            success: true,
            snapshot: {
                id: snapshot.id,
                version: snapshot.version,
                timestamp: snapshot.timestamp,
                completeness: snapshot.completeness,
                quality: snapshot.quality
            }
        });

    } catch (error: unknown) {
        console.error('[Snapshot POST] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET - Get snapshots or compare
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const version1 = searchParams.get('version1');
        const version2 = searchParams.get('version2');
        const action = searchParams.get('action'); // 'history' | 'compare' | 'latest'

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'productId required' },
                { status: 400 }
            );
        }

        if (action === 'compare' && version1 && version2) {
            const comparison = await ResearchMetricsSnapshotService.compare(
                productId,
                parseInt(version1),
                parseInt(version2)
            );

            return NextResponse.json({
                success: true,
                comparison
            });
        }

        if (action === 'latest') {
            const snapshot = await ResearchMetricsSnapshotService.getLatest(productId);
            return NextResponse.json({
                success: true,
                snapshot
            });
        }

        // Default: return history
        const limit = parseInt(searchParams.get('limit') || '10');
        const history = await ResearchMetricsSnapshotService.getHistory(productId, limit);

        return NextResponse.json({
            success: true,
            history,
            count: history.length
        });

    } catch (error: unknown) {
        console.error('[Snapshot GET] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT - Rollback to version
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, targetVersion } = body;

        if (!productId || !targetVersion) {
            return NextResponse.json(
                { success: false, error: 'productId and targetVersion required' },
                { status: 400 }
            );
        }

        const newSnapshot = await ResearchMetricsSnapshotService.rollback(
            productId,
            targetVersion
        );

        return NextResponse.json({
            success: true,
            message: `Rolled back to version ${targetVersion}`,
            newVersion: newSnapshot.version
        });

    } catch (error: unknown) {
        console.error('[Snapshot PUT] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
