import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProductDriveStructure } from '@/lib/google-drive';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const where = storeId ? { storeId } : {};

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                status: true,
                imageUrl: true,
                productFamily: true,
                shopifyId: true,
                price: true,
                country: true,
                driveFolderId: true,
                createdAt: true,
                storeId: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error('[API] Error fetching products:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            storeId, title, description, price, country,
            imageUrl, shopifyId, sku, unitCost,
            shippingCost, returnCost, vatPercent,
            landingUrl, niche, problemToSolve,
        } = body;

        if (!storeId || !title) {
            return NextResponse.json({ success: false, error: 'storeId and title are required' }, { status: 400 });
        }

        const CURRENCY_MAP: Record<string, string> = {
            ES: 'EUR', MX: 'MXN', US: 'USD', GB: 'GBP', AU: 'AUD', CN: 'CNY'
        };
        const currency = CURRENCY_MAP[country || 'ES'] || 'EUR';

        const product = await prisma.product.create({
            data: {
                storeId,
                title,
                description: description || null,
                price: price || 0,
                country: country || 'ES',
                imageUrl: imageUrl || null,
                shopifyId: shopifyId || null,
                sku: sku || null,
                unitCost: unitCost || 0,
                shippingCost: shippingCost || 0,
                returnCost: returnCost || 0,
                vatPercent: vatPercent ?? 21,
                landingUrl: landingUrl || null,
                niche: niche || null,
                problemToSolve: problemToSolve || null,
                status: 'ACTIVE',
            }
        });

        let driveFolderId: string | null = null;
        try {
            const driveResult = await createProductDriveStructure(product.id, title);
            driveFolderId = driveResult?.productRootId || null;
        } catch (driveError) {
            console.error('[API] Drive folder creation failed (non-fatal):', driveError);
        }

        await prisma.store.update({
            where: { id: storeId },
            data: { currency }
        }).catch(() => { });

        return NextResponse.json({ success: true, product: { ...product, driveFolderId } });

    } catch (error: any) {
        console.error('[API] Error creating product:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create product' }, { status: 500 });
    }
}
