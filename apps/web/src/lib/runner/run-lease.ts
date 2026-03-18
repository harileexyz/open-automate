export interface RunLease {
    workerId: string;
    leaseId: string;
}

export interface LeaseOwnedRun {
    workerId?: string | null;
    leaseId?: string | null;
    status?: string;
    heartbeatAt?: { toMillis?: () => number } | null;
    startedAt?: { toMillis?: () => number } | null;
    [key: string]: unknown;
}

export function assertLeaseOwnership(runData: LeaseOwnedRun, lease: RunLease, allowedStatuses?: string[]) {
    if (runData.workerId !== lease.workerId || runData.leaseId !== lease.leaseId) {
        throw new Error('Run lease is no longer owned by this worker');
    }

    if (allowedStatuses && runData.status && !allowedStatuses.includes(runData.status)) {
        throw new Error(`Run lease is not writable from status ${runData.status}`);
    }

    return runData;
}

export function isRunStale(runData: LeaseOwnedRun, cutoffMs: number) {
    const heartbeatMs = runData.heartbeatAt?.toMillis?.() || runData.startedAt?.toMillis?.() || 0;
    return heartbeatMs > 0 && heartbeatMs < cutoffMs;
}
