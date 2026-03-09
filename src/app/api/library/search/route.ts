import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';

export async function POST(request: NextRequest) {
    try {
        const { query, productId, storeId } = await request.json();

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        // 1. Fetch available assets for this product
        const assets = await (prisma as any).creativeAsset.findMany({
            where: { productId, semanticDescription: { not: null } },
            select: { id: true, name: true, semanticDescription: true, type: true, thumbnailUrl: true }
        });

        const avatarAssets = await (prisma as any).avatarAsset.findMany({
            where: { productId, semanticDescription: { not: null } },
            select: { id: true, type: true, semanticDescription: true, url: true }
        });

        const landings = await (prisma as any).landingProject.findMany({
            where: { productId, semanticDescription: { not: null } },
            select: { id: true, name: true, semanticDescription: true }
        });

        const scripts = await (prisma as any).scriptLibrary.findMany({
            where: { productId, semanticDescription: { not: null } },
            select: { id: true, framework: true, semanticDescription: true }
        });

        // Combine all items into a search search pool
        const allItems = [
            ...assets.map((a: any) => ({ ...a, category: 'CREATIVE', label: a.name })),
            ...avatarAssets.map((a: any) => ({ ...a, category: 'AVATAR_ASSET', label: `Avatar ${a.type}` })),
            ...landings.map((l: any) => ({ ...l, category: 'LANDING', label: l.name })),
            ...scripts.map((s: any) => ({ ...s, category: 'SCRIPT', label: `Script ${s.framework}` }))
        ];

        if (allItems.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // 2. Perform Semantic Search using Gemini to rank results
        // We provide the descriptions to Gemini and ask for the best matches.
        const pool = allItems.map(i => ({ id: i.id, desc: i.semanticDescription })).slice(0, 50); // Limit pool for context window

        const prompt = `Actúa como un motor de búsqueda semántica avanzado.
        CONSULTA DEL USUARIO: "${query}"

        A continuación tienes una lista de activos de marketing con sus descripciones semánticas (ID | DESCRIPCIÓN):
        ${pool.map(p => `${p.id} | ${p.desc}`).join('\n')}

        TAREA:
        1. Analiza cuáles de estos activos coinciden mejor con la intención de búsqueda del usuario.
        2. Clasifícalos por relevancia semántica.
        3. Devuelve los IDs en un array JSON, de más relevante a menos relevante.
        4. Solo incluye los que tengan una coincidencia razonable.

        RESPUESTA: Devuelve ÚNICAMENTE el array JSON de IDs. Ejemplo: ["id1", "id2", ...]`;

        const rankingResponse = await agentDispatcher.dispatch({
            role: 'research-lab',
            prompt,
            jsonSchema: true,
            model: 'gemini-3.1-flash-lite-preview'
        });

        let orderedIds: string[] = [];
        try {
            const cleanText = rankingResponse.text.replace(/```json|```/g, '').trim();
            orderedIds = JSON.parse(cleanText);
        } catch (e) {
            console.error("[SemanticSearch] Failed to parse AI ranking:", e);
            // Fallback: simple text search on the description
            const searchTerms = query.toLowerCase().split(' ');
            orderedIds = allItems
                .filter(i => searchTerms.some((term: string) => i.semanticDescription.toLowerCase().includes(term)))
                .map(i => i.id);
        }

        const results = orderedIds
            .map(id => allItems.find(i => i.id === id))
            .filter(Boolean);

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("[Semantic Search API] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
