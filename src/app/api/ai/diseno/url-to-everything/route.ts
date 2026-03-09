import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyClient } from '@/lib/shopify';
import { decryptSecret } from '@/lib/server/crypto';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { url, storeId } = await request.json();

        if (!url || !storeId) {
            return NextResponse.json({ success: false, error: 'URL y Store ID son requeridos' }, { status: 400 });
        }

        // 1. Extraer handle de la URL
        // Ej: https://tienda.com/products/nombre-del-producto
        const handleMatch = url.match(/\/products\/([^\/\?]+)/);
        if (!handleMatch) {
            return NextResponse.json({ success: false, error: 'URL de producto Shopify inválida' }, { status: 400 });
        }
        const handle = handleMatch[1];

        // 2. Obtener conexión Shopify
        const connection = await prisma.connection.findUnique({
            where: {
                storeId_provider: {
                    storeId,
                    provider: 'SHOPIFY'
                }
            },
            include: {
                store: true
            }
        });

        if (!connection || !connection.secretEnc || !connection.secretIv || !connection.secretTag) {
            return NextResponse.json({ success: false, error: 'Conexión Shopify no configurada o incompleta' }, { status: 400 });
        }

        // 3. Decriptar Access Token
        const accessToken = decryptSecret({
            enc: connection.secretEnc,
            iv: connection.secretIv,
            tag: connection.secretTag
        });

        const shop = connection.store.domain || `${connection.storeId}.myshopify.com`;
        const client = new ShopifyClient(shop, accessToken);

        // 4. Fetch Product via GraphQL
        const shopifyData = await client.getProductByHandle(handle);
        const product = shopifyData?.data?.productByHandle;

        if (!product) {
            return NextResponse.json({ success: false, error: 'Producto no encontrado en Shopify' }, { status: 404 });
        }

        // 5. Analizar con Gemini (Vision + Text)
        const imageUrls = product.images?.nodes?.map((n: any) => n.url) || [];
        const productDescription = product.description || '';
        const productTitle = product.title || '';
        const price = product.variants?.nodes?.[0]?.price || '0';

        const prompt = `
            Analiza este producto de Shopify para crear anuncios estáticos de alto impacto.
            
            PRODUCTO: ${productTitle}
            PRECIO: ${price}
            DESCRIPCIÓN: ${productDescription}
            
            TAREA:
            1. Resume los 3 beneficios principales (no características).
            2. Sugiere 3 headlines disruptivos basados en el framework de IA Pro (interrupción de patrón).
            3. Identifica el ángulo de marketing más potente (Ahorro, Miedo, Status o Placer).
            
            Responde en formato JSON:
            {
                "benefits": ["benefit 1", "benefit 2", "benefit 3"],
                "headlines": ["headline 1", "headline 2", "headline 3"],
                "primaryAngle": "Ahorro | Miedo | Status | Placer",
                "extractedNomenclature": "${handle.toUpperCase()}"
            }
        `;

        const aiResponse = await AiRouter.dispatch(
            storeId,
            TaskType.RESEARCH_FAST,
            prompt,
            {
                images: imageUrls.slice(0, 3), // Max 3 imágenes para análisis rápido
                jsonSchema: true
            }
        );

        let parsedData = {};
        try {
            parsedData = JSON.parse(aiResponse.text);
        } catch (e) {
            console.error("AI Response not JSON:", aiResponse.text);
        }

        return NextResponse.json({
            success: true,
            data: {
                title: productTitle,
                price: price,
                handle: handle,
                images: imageUrls,
                aiAnalysis: parsedData
            }
        });

    } catch (error: any) {
        console.error('[URL-TO-EVERYTHING] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error interno al procesar URL'
        }, { status: 500 });
    }
}
