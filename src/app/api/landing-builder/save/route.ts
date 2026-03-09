import { NextRequest, NextResponse } from 'next/server';
import { saveLandingProject } from '@/lib/services/drive-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, storeId, type, version, content } = body;

        if (!productId || !storeId || !type || !content) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const result = await saveLandingProject(productId, storeId, type, version || 1, content);
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
