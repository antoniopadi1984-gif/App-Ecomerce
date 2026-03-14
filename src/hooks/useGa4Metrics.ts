import { useState, useEffect, useCallback } from 'react';

export function useGa4Metrics(startDate?: string, endDate?: string) {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL('/api/analytics/ga4', window.location.origin);
            if (startDate) url.searchParams.append('startDate', startDate);
            if (endDate) url.searchParams.append('endDate', endDate);

            const res = await fetch(url.toString());
            const json = await res.json();

            if (json.ok) {
                setMetrics(json.metrics);
            } else {
                setError(json.error || 'Failed to fetch GA4 metrics');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { metrics, isLoading, error, refetch: fetchData };
}
