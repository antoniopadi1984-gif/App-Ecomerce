import { useState, useEffect, useCallback } from 'react';

export interface CreativePerformanceItem {
    id: string;
    name: string;
    concept: string;
    conceptName: string;
    traffic: string;
    awareness: number | null;
    awarenessName: string;
    angle: string;
    hookScore: number;
    driveUrl: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    roas: number;
    hookRate: number;
    holdRate: number;
    cpa: number;
    conversions: number;
    metaStatus: string;
    verdict: 'ESCALAR' | 'MANTENER' | 'ITERAR' | 'PAUSAR' | 'SIN_DATOS';
}

export function useCreativePerformance(storeId: string | null, productId: string | null) {
    const [data, setData] = useState<CreativePerformanceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!storeId) return;
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL('/api/analytics/creative-performance', window.location.origin);
            url.searchParams.append('storeId', storeId);
            if (productId && productId !== 'GLOBAL') {
                url.searchParams.append('productId', productId);
            }

            const res = await fetch(url.toString());
            const json = await res.json();

            if (json.ok) {
                setData(json.table);
            } else {
                setError(json.error || 'Failed to fetch performance data');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [storeId, productId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
