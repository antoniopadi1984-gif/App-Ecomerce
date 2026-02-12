import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                researchSources: true,
                researchRuns: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                searchQueries: {
                    include: { results: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                evidenceChunks: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                researchProjects: {
                    include: {
                        versions: {
                            include: {
                                outputs: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 10
                        }
                    }
                },
                competitorLinks: true,
                knowledgeNodes: {
                    include: {
                        outgoingLinks: true
                    }
                },
                maturity: true
            }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        const formattedData = {
            ...product,
            nodes: (product as any).knowledgeNodes?.map((n: any) => ({
                ...n,
                content: JSON.parse(n.contentJson || '{}')
            })) || [],
            links: (product as any).knowledgeNodes?.flatMap((n: any) => n.outgoingLinks) || [],
            maturity: (product as any).maturity ? JSON.parse((product as any).maturity.scoresJson) : null
        };

        return NextResponse.json({
            success: true,
            data: formattedData
        });
    } catch (error: any) {
        console.error('[API] Error fetching research data:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch research details' },
            { status: 500 }
        );
    }
}
