import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = request.headers.get('X-Store-Id') || searchParams.get('storeId');

        const products = await prisma.product.findMany({
            where: storeId ? { storeId } : {},
            select: {
                id: true,
                title: true,
                status: true,
                imageUrl: true,
                productFamily: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            products: products.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                imageUrl: p.imageUrl,
                productFamily: p.productFamily
            }))
        });
    } catch (error) {
        console.error('[API] Error fetching products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const storeId = request.headers.get('X-Store-Id');
        if (!storeId) {
            return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            title,
            category,
            imageUrl,
            description,
            unitCost,
            shippingCost,
            sellingPrice,
            market,
            language,
            amazonLinks,
            competitorLinks,
            forceTranslation
        } = body;

        if (!title) {
            return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
        }

        // Basic AI calculations (mocked or real logic depending on environment)
        // BE ROAS = Sale Price / (Sale Price - (Unit Cost + Shipping Cost))
        const totalCost = (Number(unitCost) || 0) + (Number(shippingCost) || 0);
        const salePrice = Number(sellingPrice) || 0;
        let breakevenROAS = 0;
        let maxCPA = 0;

        if (salePrice > totalCost) {
            maxCPA = salePrice - totalCost;
            breakevenROAS = salePrice / maxCPA;
        }

        const newProduct = await prisma.product.create({
            data: {
                storeId,
                title,
                productFamily: category,
                imageUrl,
                description,
                unitCost: Number(unitCost) || 0,
                shippingCost: Number(shippingCost) || 0,
                price: salePrice,
                breakevenROAS,
                breakevenCPC: maxCPA > 0 ? maxCPA * 0.05 : 0,
                country: market || 'ES',
                tags: language,
                status: 'ACTIVE',
                amazonLinks: amazonLinks && amazonLinks.length > 0 ? JSON.stringify(amazonLinks) : null,
                competitorLinks: competitorLinks && competitorLinks.length > 0 ? {
                    create: competitorLinks.map((url: string) => ({
                        url,
                        type: 'COMPETITOR_LIBRARY'
                    }))
                } : undefined
            }
        });

        // Trigger background drive sync
        try {
            fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/drive/organize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'organize_all', productId: newProduct.id })
            }).catch(e => console.error("Drive sync error:", e));
        } catch (e) {
            console.error("Failed to trigger drive sync:", e);
        }

        return NextResponse.json({ success: true, product: newProduct });

    } catch (error) {
        console.error('[API] Error creating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
