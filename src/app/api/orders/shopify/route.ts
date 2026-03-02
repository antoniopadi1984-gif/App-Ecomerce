import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace with environment variables
const SHOPIFY_API_URL = 'https://{store_name}.myshopify.com/admin/api/2024-01';

/**
 * Endpoint para listar pedidos de Shopify.
 * GET /orders.json
 */
export async function GET(req: NextRequest) {
    try {
        // Implementar fetching de datos a Shopify
        // const res = await fetch(`${SHOPIFY_API_URL}/orders.json`, {
        //     headers: { 'X-Shopify-Access-Token': 'shpat_...' }
        // });
        // const data = await res.json();

        // El tipado y mapeado se haría después con mapShopifyOrder()
        return NextResponse.json({ success: true, message: 'Endpoint de Shopify preparado para listar pedidos' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al conectar con Shopify' }, { status: 500 });
    }
}

/**
 * Endpoint para actualizar/acciones de pedidos en Shopify.
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, id, data } = body;

        switch (action) {
            case 'edit':
                // PUT /orders/{id}.json
                return NextResponse.json({ success: true, message: `Pedido ${id} editado en Shopify` });
            case 'cancel':
                // POST /orders/{id}/cancel.json
                return NextResponse.json({ success: true, message: `Pedido ${id} cancelado en Shopify` });
            case 'fulfill':
                // POST /orders/{id}/fulfillments.json
                return NextResponse.json({ success: true, message: `Fulfillment creado para pedido ${id} en Shopify` });
            default:
                return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al ejecutar acción en Shopify' }, { status: 500 });
    }
}
