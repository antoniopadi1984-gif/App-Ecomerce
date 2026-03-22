/**
 * POST /api/admin/reset-creative-library
 * Elimina todos los assets creativos de la BD para un storeId.
 * NO toca Google Drive (los archivos originales se conservan).
 * Body: { storeId, confirm: 'RESET' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { storeId, productId, confirm } = await req.json();
        if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });
        if (confirm !== 'RESET') return NextResponse.json({ error: 'Envía confirm:"RESET" para confirmar la acción destructiva' }, { status: 400 });

        const where: any = { storeId };
        if (productId) where.productId = productId;

        const count = await (prisma as any).creativeAsset.count({ where });
        const deleted = await (prisma as any).creativeAsset.deleteMany({ where });

        return NextResponse.json({
            success: true,
            message: `${deleted.count} de ${count} assets eliminados de la BD`,
            note: 'Los archivos en Google Drive NO se han modificado'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
