import { NextRequest, NextResponse } from 'next/server';
import { ConceptAgentService } from '@/lib/services/concept-agent-service';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
    try {
        const { productId, storeId } = await req.json();

        if (!productId || !storeId) {
            return NextResponse.json({ success: false, error: 'Missing productId or storeId' }, { status: 400 });
        }

        console.log(`[ConceptAgentAPI] Triggering concept generation for product: ${productId}`);

        // This is a background task, but we'll await it here for the internal fetch call
        // The product route calls this without awaiting the fetch response usually, but we want it to run.
        const result = await ConceptAgentService.generateConcepts(productId, storeId);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ConceptAgentAPI] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
