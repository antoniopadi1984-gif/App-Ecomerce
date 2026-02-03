/**
 * Simple in-memory cache for API responses
 * Reduces repeated DB/API calls for frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Get cached data if valid, otherwise return null
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cache with TTL in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number = 30000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs
        });
    }

    /**
     * Invalidate a specific key or pattern
     */
    invalidate(keyOrPattern: string): void {
        if (keyOrPattern.includes("*")) {
            const pattern = new RegExp(keyOrPattern.replace("*", ".*"));
            for (const key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.delete(keyOrPattern);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get or set with async factory
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlMs: number = 30000
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await factory();
        this.set(key, data, ttlMs);
        return data;
    }
}

// Singleton instance
export const apiCache = new MemoryCache();

// Cache key generators
export const CacheKeys = {
    monthlyAccounting: (storeId: string, month: number, year: number) =>
        `accounting:${storeId}:${month}:${year}`,
    dailySnapshot: (storeId: string, date: string) =>
        `snapshot:${storeId}:${date}`,
    marketingPerformance: (storeId: string, period: string, level: string) =>
        `marketing:${storeId}:${period}:${level}`,
    orders: (storeId: string, status?: string) =>
        `orders:${storeId}:${status || 'all'}`,
    threshold: (storeId: string) =>
        `threshold:${storeId}`
};
