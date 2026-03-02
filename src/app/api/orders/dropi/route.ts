import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder endpoint para listar pedidos de Dropi.
 * Pendiente de documentación de la API oficial.
 */
export async function GET(req: NextRequest) {
    try {
        return NextResponse.json({ success: true, message: 'Endpoint de Dropi preparado (esperando doc oficial)' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al conectar con Dropi' }, { status: 500 });
    }
}

/**
 * Placeholder endpoint para actualizar pedidos de Dropi.
 */
export async function PUT(req: NextRequest) {
    try {
        return NextResponse.json({ success: true, message: 'Acciones de Dropi preparadas (esperando doc oficial)' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al ejecutar acción en Dropi' }, { status: 500 });
    }
}
