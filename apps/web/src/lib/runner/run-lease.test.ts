import { describe, expect, it } from 'vitest';
import { assertLeaseOwnership, isRunStale } from './run-lease';

describe('run lease ownership', () => {
    it('accepts a matching worker and lease id', () => {
        const run = assertLeaseOwnership(
            { workerId: 'worker-1', leaseId: 'lease-1', status: 'running', type: 'suite' },
            { workerId: 'worker-1', leaseId: 'lease-1' },
            ['running']
        );

        expect(run.status).toBe('running');
        expect(run.type).toBe('suite');
    });

    it('rejects a mismatched lease owner', () => {
        expect(() =>
            assertLeaseOwnership(
                { workerId: 'worker-1', leaseId: 'lease-1', status: 'running' },
                { workerId: 'worker-2', leaseId: 'lease-1' },
                ['running']
            )
        ).toThrow('Run lease is no longer owned by this worker');
    });

    it('rejects writes from a disallowed status', () => {
        expect(() =>
            assertLeaseOwnership(
                { workerId: 'worker-1', leaseId: 'lease-1', status: 'completed' },
                { workerId: 'worker-1', leaseId: 'lease-1' },
                ['running']
            )
        ).toThrow('Run lease is not writable from status completed');
    });
});

describe('stale run detection', () => {
    it('marks runs stale from heartbeat time', () => {
        expect(
            isRunStale(
                {
                    heartbeatAt: { toMillis: () => 1000 },
                },
                2000
            )
        ).toBe(true);
    });

    it('falls back to startedAt when heartbeat is missing', () => {
        expect(
            isRunStale(
                {
                    startedAt: { toMillis: () => 1000 },
                },
                2000
            )
        ).toBe(true);
    });

    it('does not mark fresh runs stale', () => {
        expect(
            isRunStale(
                {
                    heartbeatAt: { toMillis: () => 5000 },
                },
                2000
            )
        ).toBe(false);
    });
});
