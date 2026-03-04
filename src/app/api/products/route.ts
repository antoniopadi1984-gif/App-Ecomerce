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
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            products: products.map(p => ({
                id: p.id, title: p.title, status: p.status,
                imageUrl: p.imageUrl, productFamily: p.productFamily
            }))
        });
    } catch (error) {
        console.error('[API] Error fetching products:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
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
            title, country, niche, productFamily, pvpEstimated, price,
            unitCost, shippingCost, cvrExpected, cpaMax, breakevenCPC, breakevenROAS,
            landingUrl, description, imageUrl, googleDocUrl, foreplayBoardUrl,
            adLibraryUrls, amazonLinks, landingUrls, competitorLinks, agentDescription,
            marketLanguage, interfaceLanguage,
            // legacy compat
            category, market, sellingPrice,
            handlingCost, returnRate, deliveryRate, fulfillment, sku
        } = body;

        if (!title) {
            return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
        }

        const pvp = pvpEstimated || Number(sellingPrice) || Number(price) || 0;
        const cvr = cvrExpected ? Number(cvrExpected) : 2.0;

        // Compute breakevens if not already provided
        const computedCpaMax = cpaMax ?? (pvp > 0 ? pvp * 0.4 : 0);
        const computedROASBE = breakevenROAS ?? (computedCpaMax > 0 ? pvp / computedCpaMax : 0);
        const computedCPCBE = breakevenCPC ?? (computedCpaMax > 0 ? computedCpaMax * (cvr / 100) : 0);

        const newProduct = await prisma.product.create({
            data: {
                storeId,
                title,
                country: country || market || 'ES',
                niche: niche || null,
                productFamily: productFamily || category || null,
                marketLanguage: marketLanguage || 'ES',
                interfaceLanguage: interfaceLanguage || 'ES',
                pvpEstimated: pvp || null,
                price: pvp,
                unitCost: Number(unitCost) || 0,
                shippingCost: Number(shippingCost) || 0,
                handlingCost: Number(handlingCost) || 0,
                returnCost: Number(returnRate) || 5, // Mapping to returnCost

                sku: sku || undefined,
                cvrExpected: cvrExpected ? Number(cvrExpected) : null,
                cpaMax: computedCpaMax || null,
                breakevenCPC: computedCPCBE || null,
                breakevenROAS: computedROASBE || null,
                landingUrl: landingUrl || null,
                description: description || agentDescription || null,
                agentDescription: agentDescription || null,
                imageUrl: imageUrl || null,
                googleDocUrl: googleDocUrl || null,
                foreplayBoardUrl: foreplayBoardUrl || null,
                adLibraryUrls: adLibraryUrls || null,
                amazonLinks: amazonLinks || null,
                landingUrls: landingUrls || null,
                status: 'ACTIVE',
                competitorLinks: competitorLinks && competitorLinks.length > 0 ? {
                    create: competitorLinks.map((url: string) => ({ url, type: 'COMPETITOR_LIBRARY' }))
                } : undefined,
            }
        });

        // Auto-create ThresholdConfig from breakeven values
        if (computedROASBE > 0) {
            try {
                await prisma.thresholdConfig.create({
                    data: {
                        storeId,
                        type: 'PRODUCT',
                        scenarioName: `BE Alerts — ${title}`,
                        minRoas: computedROASBE * 0.75,
                        maxCpa: computedCpaMax * 1.2,
                        maxCpc: computedCPCBE * 1.3,
                    }
                });
            } catch (e: unknown) {
                console.warn('[API] ThresholdConfig creation skipped:', e instanceof Error ? e.message : String(e));
            }
        }

        // Background: pre-fill Research Steps if docExtracted is provided
        if (body.docExtracted) {
            try {
                const ext = JSON.parse(body.docExtracted);
                const runId = `run_doc_${Date.now()}`;

                const stepsToCreate = [];
                if (ext.surfaceDesires && ext.surfaceDesires.length > 0) {
                    stepsToCreate.push({ productId: newProduct.id, runId, stepKey: 'P1', outputJson: JSON.stringify(ext.surfaceDesires), status: '✅ Pre-cargado desde documento' });
                }
                if (ext.avatares && ext.avatares.length > 0) {
                    stepsToCreate.push({ productId: newProduct.id, runId, stepKey: 'P2', outputJson: JSON.stringify(ext.avatares), status: '✅ Pre-cargado desde documento' });
                }
                if (ext.languageBank && Object.keys(ext.languageBank).length > 0) {
                    stepsToCreate.push({ productId: newProduct.id, runId, stepKey: 'P2.1', outputJson: JSON.stringify(ext.languageBank), status: '✅ Pre-cargado desde documento' });
                }
                if (ext.angulos && ext.angulos.length > 0) {
                    stepsToCreate.push({ productId: newProduct.id, runId, stepKey: 'P4', outputJson: JSON.stringify(ext.angulos), status: '✅ Pre-cargado desde documento' });
                }

                for (const st of stepsToCreate) {
                    await prisma.researchStep.create({
                        data: {
                            productId: st.productId,
                            runId: st.runId,
                            stepKey: st.stepKey,
                            version: 1,
                            outputJson: st.outputJson,
                        }
                    });
                }
            } catch (e) {
                console.error('[API] Error pre-filling research steps:', e);
            }
        }

        // Background: trigger Drive organize (fire & forget)
        fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/drive/organize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_structure', storeId, productId: newProduct.id, sku: body.sku || newProduct.sku, competitors: body.competitors || [] })
        }).catch(() => { });

        return NextResponse.json({ success: true, product: newProduct });

    } catch (error) {
        console.error('[API] Error creating product:', error);
        return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
    }
}
