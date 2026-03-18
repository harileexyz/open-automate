'use client';

import { useEffect, useState } from 'react';

interface HealthPayload {
    status: 'ok' | 'degraded';
    checks: {
        env: {
            ok: boolean;
            missing: string[];
        };
        worker: {
            online: boolean;
            state: 'idle' | 'claiming' | 'running' | 'offline';
            runId: string | null;
            runIds: string[];
            activeRunCount: number;
            concurrencyLimit: number;
            workerId: string | null;
            heartbeatAt: string | null;
            stale: boolean;
        };
    };
    timestamp: string;
}

export function useHealthStatus() {
    const [health, setHealth] = useState<HealthPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await fetch('/api/health', { cache: 'no-store' });
                const payload = await response.json();
                if (!cancelled) {
                    setHealth(payload);
                }
            } catch (error) {
                if (!cancelled) {
                    setHealth(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();
        const interval = window.setInterval(() => {
            void load();
        }, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    return { health, loading };
}
