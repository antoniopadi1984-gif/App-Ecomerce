"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoRefreshOptions {
    /** Interval in milliseconds (default: 30000 = 30 seconds) */
    interval?: number;
    /** Whether auto-refresh is enabled (default: true) */
    enabled?: boolean;
    /** Pause refresh when tab is not visible (default: true) */
    pauseOnHidden?: boolean;
    /** Callback for immediate execution on mount (default: false) */
    immediate?: boolean;
}

/**
 * Hook for automatic data refresh with visibility awareness
 * SSR-safe: only runs on client
 */
export function useAutoRefresh(
    callback: () => void | Promise<void>,
    options: UseAutoRefreshOptions = {}
) {
    const {
        interval = 30000,
        enabled = true,
        pauseOnHidden = true,
        immediate = false
    } = options;

    const savedCallback = useRef(callback);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update ref when callback changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const startInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            savedCallback.current();
        }, interval);
    }, [interval]);

    const stopInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        // SSR guard - only run on client
        if (typeof window === 'undefined') return;

        if (!enabled) {
            stopInterval();
            return;
        }

        // Execute immediately if requested
        if (immediate) {
            savedCallback.current();
        }

        startInterval();

        // Handle visibility change (only on client)
        const handleVisibilityChange = () => {
            if (pauseOnHidden) {
                if (document.hidden) {
                    stopInterval();
                } else {
                    // Refresh immediately when tab becomes visible
                    savedCallback.current();
                    startInterval();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopInterval();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [enabled, pauseOnHidden, immediate, startInterval, stopInterval]);

    return {
        start: startInterval,
        stop: stopInterval,
        refresh: () => savedCallback.current()
    };
}

