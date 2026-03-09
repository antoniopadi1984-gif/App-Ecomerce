import { NextRequest, NextResponse } from 'next/server';
import { processInbox } from '@/lib/services/drive-service';

export const maxDuration = 120; // 2 minutes

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, storeId } = body;

        if (!productId || !storeId) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const result = await processInbox(productId, storeId);

        return NextResponse.json(result);

    } catch (err: any) {
        console.error('[API /inbox/process]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
