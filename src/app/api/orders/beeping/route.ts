import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace with environment variables
const BEEPING_API_URL = 'https://app.gobeeping.com/api';

/**
 * Endpoint para listar pedidos de Beeping.
 * GET /api/get_orders
 */
export async function GET(req: NextRequest) {
    try {
        // Implementar fetching de datos a Beeping
        // const res = await fetch(`${BEEPING_API_URL}/get_orders`, {
        //     headers: { Authorization: `Basic ${btoa('user:pass')}` }
        // });
        // const data = await res.json();

        return NextResponse.json({ success: true, message: 'Endpoint de Beeping preparado para listar pedidos' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al conectar con Beeping' }, { status: 500 });
    }
}

/**
 * Endpoint para actualizar/acciones de pedidos de Beeping.
 * Dependiendo del cuerpo/tipo de acción, se dirige a los distintos endpoints (PUT, cancelar, enviar).
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, id, data } = body;

        switch (action) {
            case 'edit':
                // PUT /api/order/{external_id}
                return NextResponse.json({ success: true, message: `Pedido ${id} editado` });
            case 'mark_to_send':
                // PUT /api/order/mark-to-send/{id}
                return NextResponse.json({ success: true, message: `Pedido ${id} marcado para enviar` });
            case 'cancel':
                // PUT /api/order/cancel/{id}
                return NextResponse.json({ success: true, message: `Pedido ${id} cancelado` });
            default:
                return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al ejecutar acción en Beeping' }, { status: 500 });
    }
}
