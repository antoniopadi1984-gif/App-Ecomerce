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
                sku: true,
                createdAt: true,
                storeId: true,
                _count: {
                    select: {
                        avatars: true,
                        avatarResearches: true,
                        videoAssets: true,
                        creativeAssets: true,
                        researchRuns: true,
                    }
                }
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
        const storeIdHeader = request.headers.get('X-Store-Id');
        const {
            storeId: bodyStoreId, title, description, price, country,
            imageUrl, shopifyId, sku, unitCost, currency,
            shippingCost, handlingCost, returnCost, vatPercent,
            landingUrl, landingUrls, niche, problemToSolve,
            pvpEstimated, cpaMax, breakevenCPC, breakevenROAS,
            marketLanguage, cvrExpected, deliveryRate, fulfillment,
            paymentMode, googleDocUrl, competitors, adLibraryUrls,
        } = body;

        const storeId = bodyStoreId || storeIdHeader;

        if (!storeId || !title) {
            return NextResponse.json({ success: false, error: 'storeId and title are required' }, { status: 400 });
        }

        // Store paymentMode + competitors metadata in tags as JSON
        const tagsData: any = {};
        if (paymentMode)  tagsData.paymentMode = paymentMode;
        if (fulfillment)  tagsData.fulfillment  = fulfillment;
        if (deliveryRate) tagsData.deliveryRate  = deliveryRate;
        if (cvrExpected)  tagsData.cvrExpected   = cvrExpected;
        const tagsJson = Object.keys(tagsData).length ? JSON.stringify(tagsData) : null;

        // Competitors as JSON stored in amazonLinks field
        const competitorsJson = competitors?.length ? JSON.stringify(competitors) : null;

        const product = await prisma.product.create({
            data: {
                storeId,
                title,
                description: description || null,
                price:           price        || pvpEstimated || 0,
                pvpEstimated:    pvpEstimated || price        || 0,
                country:         country      || 'ES',
                imageUrl:        imageUrl     || null,
                shopifyId:       shopifyId    || null,
                sku:             sku          || null,
                unitCost:        unitCost     || 0,
                shippingCost:    shippingCost || 0,
                handlingCost:    handlingCost || 0,
                returnCost:      returnCost   || 0,
                vatPercent:      vatPercent   ?? 21,
                landingUrl:      landingUrl   || null,
                landingUrls:     landingUrls  || null,
                niche:           niche        || null,
                problemToSolve:  problemToSolve || null,
                cpaMax:          cpaMax       || null,
                breakevenCPC:    breakevenCPC || null,
                breakevenROAS:   breakevenROAS || null,
                marketLanguage:  marketLanguage || 'ES',
                currency:        currency     || 'EUR',
                googleDocUrl:    googleDocUrl || null,
                tags:            tagsJson,
                amazonLinks:     competitorsJson,
                status:          'ACTIVE',
            }
        });

        // ── Drive: fire & forget ───────────────────────────────────
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (store && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            createProductDriveStructure(
                product.id,
                product.title,
                product.sku || null,
                storeId,
                store.name
            ).catch(err => console.error('[Drive] Structure creation failed:', err));
        }

        // Update store currency if not set
        if (currency) {
            await prisma.store.update({
                where: { id: storeId },
                data: { currency }
            }).catch(() => {});
        }

        return NextResponse.json({ success: true, product });

    } catch (error: any) {
        console.error('[API] Error creating product:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create product' }, { status: 500 });
    }
}

