import { NextRequest, NextResponse } from 'next/server';
import { AssetOrganizer } from '@/lib/drive/asset-organizer';
import { prisma } from '@/lib/prisma';

/**
 * API for auto-organizing Drive assets
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, productId, fileId, fileName } = body;

        const organizer = new AssetOrganizer();

        // Action: Initial structure creation for a product
        if (action === 'create_structure') {
            if (!productId || !body.sku || !body.storeId) {
                return NextResponse.json({ success: false, error: 'Missing productId, sku or storeId' }, { status: 400 });
            }
            const structure = await organizer.productSetup(body.storeId, productId, body.sku, body.competitors || []);
            return NextResponse.json({ success: true, structure });
        }

        // Action: Organize single file
        if (action === 'organize_file') {
            if (!fileId || !fileName || !productId) {
                return NextResponse.json(
                    { success: false, error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            const result = await organizer.organizeFile(fileId, fileName, productId);
            return NextResponse.json(result);
        }

        // Action: Organize all unorganized files for product
        if (action === 'organize_all') {
            if (!productId) {
                return NextResponse.json(
                    { success: false, error: 'Missing productId' },
                    { status: 400 }
                );
            }

            const stats = await organizer.organizeAllUnorganized(productId);
            return NextResponse.json({
                success: true,
                stats
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[Organize API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET - List unorganized assets
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'Missing productId' },
                { status: 400 }
            );
        }

        const unorganized = await prisma.driveAsset.findMany({
            where: {
                productId,
                organized: false
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            total: unorganized.length,
            assets: unorganized
        });

    } catch (error: any) {
        console.error('[Organize API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
