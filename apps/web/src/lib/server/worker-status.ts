import { adminDb } from '@/lib/firebase/admin';

const WORKER_STATUS_DOC = 'worker-status/test-run-worker';
const WORKER_HEALTH_WINDOW_MS = 30 * 1000;

export async function updateWorkerHeartbeat(
    workerId: string,
    state: 'idle' | 'claiming' | 'running',
    runId?: string | null,
    metadata?: {
        activeRunCount?: number;
        runIds?: string[];
        concurrencyLimit?: number;
    }
) {
    await adminDb.doc(WORKER_STATUS_DOC).set(
        {
            workerId,
            state,
            runId: runId || null,
            runIds: metadata?.runIds || (runId ? [runId] : []),
            activeRunCount: metadata?.activeRunCount ?? (runId ? 1 : 0),
            concurrencyLimit: metadata?.concurrencyLimit ?? 1,
            heartbeatAt: new Date(),
            updatedAt: new Date(),
        },
        { merge: true }
    );
}

export async function getWorkerStatus() {
    const snapshot = await adminDb.doc(WORKER_STATUS_DOC).get();
    if (!snapshot.exists) {
        return {
            online: false,
            state: 'offline',
            runId: null,
            workerId: null,
            heartbeatAt: null,
            stale: true,
        };
    }

    const data = snapshot.data() as {
        workerId?: string;
        state?: 'idle' | 'claiming' | 'running';
        runId?: string | null;
        runIds?: string[];
        activeRunCount?: number;
        concurrencyLimit?: number;
        heartbeatAt?: FirebaseFirestore.Timestamp;
    };

    const heartbeatAt = data.heartbeatAt?.toDate?.() || null;
    const ageMs = heartbeatAt ? Date.now() - heartbeatAt.getTime() : Number.POSITIVE_INFINITY;
    const stale = ageMs > WORKER_HEALTH_WINDOW_MS;

    return {
        online: !stale,
        state: stale ? 'offline' : data.state || 'idle',
        runId: data.runId || null,
        runIds: data.runIds || [],
        activeRunCount: data.activeRunCount || 0,
        concurrencyLimit: data.concurrencyLimit || 1,
        workerId: data.workerId || null,
        heartbeatAt: heartbeatAt ? heartbeatAt.toISOString() : null,
        stale,
    };
}
