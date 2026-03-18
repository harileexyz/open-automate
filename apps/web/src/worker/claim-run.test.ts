import { describe, expect, it, vi } from 'vitest';
import { claimNextQueuedRun } from './claim-run';

describe('claimNextQueuedRun', () => {
    it('returns null when no queued runs exist', async () => {
        const db = {
            collection: () => ({
                where: () => ({
                    limit: () => ({}),
                }),
            }),
            runTransaction: async (fn: any) =>
                fn({
                    get: async () => ({ empty: true, docs: [] }),
                    update: vi.fn(),
                }),
        };

        await expect(claimNextQueuedRun(db as any, 'worker-1', () => 'lease-1')).resolves.toBeNull();
    });

    it('claims a queued run and writes ownership fields', async () => {
        const update = vi.fn();
        const db = {
            collection: () => ({
                where: () => ({
                    limit: () => ({}),
                }),
            }),
            runTransaction: async (fn: any) =>
                fn({
                    get: async () => ({
                        empty: false,
                        docs: [
                            {
                                id: 'run-1',
                                data: () => ({ status: 'queued' }),
                                ref: 'run-ref',
                            },
                        ],
                    }),
                    update,
                }),
        };

        const result = await claimNextQueuedRun(db as any, 'worker-1', () => 'lease-1');

        expect(result).toEqual({ runId: 'run-1', leaseId: 'lease-1' });
        expect(update).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenCalledWith(
            'run-ref',
            expect.objectContaining({
                status: 'starting',
                workerId: 'worker-1',
                leaseId: 'lease-1',
            })
        );
    });

    it('does not claim a run that changed status before update', async () => {
        const update = vi.fn();
        const db = {
            collection: () => ({
                where: () => ({
                    limit: () => ({}),
                }),
            }),
            runTransaction: async (fn: any) =>
                fn({
                    get: async () => ({
                        empty: false,
                        docs: [
                            {
                                id: 'run-1',
                                data: () => ({ status: 'running' }),
                                ref: 'run-ref',
                            },
                        ],
                    }),
                    update,
                }),
        };

        const result = await claimNextQueuedRun(db as any, 'worker-1', () => 'lease-1');

        expect(result).toBeNull();
        expect(update).not.toHaveBeenCalled();
    });
});
