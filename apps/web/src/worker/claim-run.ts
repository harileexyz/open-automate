import { randomUUID } from 'crypto';

export interface FirestoreLike {
    collection: (name: string) => {
        where: (field: string, op: string, value: string) => {
            limit: (count: number) => unknown;
        };
    };
    runTransaction: <T>(fn: (transaction: {
        get: (query: unknown) => Promise<{
            empty: boolean;
            docs: Array<{
                id: string;
                data: () => { status?: string };
                ref: unknown;
            }>;
        }>;
        update: (ref: unknown, data: Record<string, unknown>) => void;
    }) => Promise<T>) => Promise<T>;
}

export async function claimNextQueuedRun(
    db: FirestoreLike,
    workerId: string,
    leaseFactory: () => string = () => randomUUID()
) {
    const queuedQuery = db
        .collection('testRuns')
        .where('status', '==', 'queued')
        .limit(1);

    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(queuedQuery);
        if (snapshot.empty) {
            return null;
        }

        const nextRun = snapshot.docs[0];
        const data = nextRun.data();
        if (data.status !== 'queued') {
            return null;
        }

        const now = new Date();
        const leaseId = leaseFactory();

        transaction.update(nextRun.ref, {
            status: 'starting',
            workerId,
            leaseId,
            claimedAt: now,
            lastAttemptAt: now,
            heartbeatAt: now,
            updatedAt: now,
        });

        return {
            runId: nextRun.id,
            leaseId,
        };
    });
}
