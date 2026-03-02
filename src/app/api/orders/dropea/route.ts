import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder endpoint para listar pedidos de Dropea.
 * Pendiente de documentación de la API oficial.
 */
export async function GET(req: NextRequest) {
    try {
        return NextResponse.json({ success: true, message: 'Endpoint de Dropea preparado (esperando doc oficial)' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al conectar con Dropea' }, { status: 500 });
    }
}

/**
 * Placeholder endpoint para actualizar pedidos de Dropea.
 */
export async function PUT(req: NextRequest) {
    try {
        return NextResponse.json({ success: true, message: 'Acciones de Dropea preparadas (esperando doc oficial)' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al ejecutar acción en Dropea' }, { status: 500 });
    }
}
