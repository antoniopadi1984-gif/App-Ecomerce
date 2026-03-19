import { prisma } from '@/lib/prisma';

export async function runCompetitorSpy(storeId: string) {
    const products = await prisma.product.findMany({
        where: { storeId },
        include: { competitorLinks: true }
    });

    const results: any[] = [];

    for (const product of products) {
        if (!product.competitorLinks?.length) continue;

        for (const link of product.competitorLinks) {
            try {
                // Re-analizar landing del competidor
                await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/spy/extract-assets`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
                        body: JSON.stringify({
                            targetUrl: link.url,
                            competitorId: link.url || link.id,
                            productId: product.id
                        })
                    }
                );
                results.push({ productId: product.id, url: link.url, status: 'ok' });
            } catch (e: any) {
                results.push({ productId: product.id, url: link.url, status: 'error', error: e.message });
            }
        }
    }

    console.log(`[CompetitorSpy] Analizados ${results.length} competidores para tienda ${storeId}`);
    return results;
}
