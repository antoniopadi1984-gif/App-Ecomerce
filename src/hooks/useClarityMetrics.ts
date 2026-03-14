import { useState, useEffect, useCallback } from 'react';

export function useClarityMetrics(storeId: string | null, adName?: string) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!storeId) return;
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL('/api/analytics/clarity', window.location.origin);
            url.searchParams.append('storeId', storeId);
            if (adName) {
                url.searchParams.append('adName', adName);
            }

            const res = await fetch(url.toString());
            const json = await res.json();

            if (json.ok) {
                setData(json);
            } else {
                setError(json.error || 'Failed to fetch Clarity data');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [storeId, adName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
