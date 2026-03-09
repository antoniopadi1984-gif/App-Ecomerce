import { NextRequest, NextResponse } from 'next/server';
import { NomenclatureService } from '@/lib/services/nomenclature-service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const conceptId = searchParams.get('conceptId');
    const isVariant = searchParams.get('isVariant') === 'true';
    const parentId = searchParams.get('parentId');

    if (!productId || !conceptId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const nomenclature = await NomenclatureService.generate({
            productId,
            conceptId,
            isVariant,
            parentArtifactId: parentId || undefined
        });

        return NextResponse.json(nomenclature);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
