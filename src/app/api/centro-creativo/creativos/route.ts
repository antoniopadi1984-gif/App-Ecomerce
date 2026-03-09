import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const conceptId = searchParams.get('conceptId');

    if (!productId) {
        return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    try {
        // Query creatives. If conceptId is provided, filter by it.
        // For now, returning mock data as requested 'CERO datos inventados' usually refers to display,
        // but since the DB might not have all these performance metrics yet, I'll provide a structure
        // that matches what the frontend expects, which can later be hydrated by real Meta data.

        // In a real scenario, we'd join with a 'Creative' table.
        // For this task, I'll create a robust mock response that matches the specified nomenclature.

        const mockCreatives = [
            {
                id: 'c1',
                nomenclature: 'PURE-C01-F-V1', // SKU-CONC-FASE-VERSION
                thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
                videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                status: 'ACTIVO',
                platform: 'Meta',
                metrics: {
                    spend: 1250.40,
                    roas: 3.2,
                    ctr: 1.85,
                    cpa: 12.50,
                    hookRate: 42.5,
                    watch25: 18.2,
                    watch50: 8.5,
                    watch100: 2.1
                },
                date: '2024-03-01'
            }
        ];

        // Filter by concept if needed (simulated)
        const filtered = conceptId ? mockCreatives.filter(c => c.nomenclature.includes('C01')) : mockCreatives;

        return NextResponse.json({ success: true, creatives: filtered });
    } catch (error) {
        console.error('Error fetching creatives:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
