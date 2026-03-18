import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireAuthenticatedUser = vi.fn();
const markStaleRunsFailed = vi.fn();
const runGet = vi.fn();
const runUpdate = vi.fn();
const projectGet = vi.fn();

vi.mock('@/lib/server/auth', () => ({
    requireAuthenticatedUser,
}));

vi.mock('@/lib/runner/server-executor', () => ({
    markStaleRunsFailed,
}));

vi.mock('@/lib/firebase/admin', () => ({
    adminDb: {
        collection: (name: string) => {
            if (name === 'testRuns') {
                return {
                    doc: () => ({
                        get: runGet,
                        update: runUpdate,
                    }),
                };
            }

            if (name === 'projects') {
                return {
                    doc: () => ({
                        get: projectGet,
                    }),
                };
            }

            throw new Error(`Unexpected collection ${name}`);
        },
    },
}));

describe('POST /api/runner/execute', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('re-queues a failed run for an owner', async () => {
        requireAuthenticatedUser.mockResolvedValue({ uid: 'owner-1' });
        runGet.mockResolvedValue({
            exists: true,
            data: () => ({
                projectId: 'project-1',
                status: 'failed',
                results: [{ testCaseId: 'tc-1', name: 'Login', status: 'failed' }],
            }),
        });
        projectGet.mockResolvedValue({
            data: () => ({ ownerId: 'owner-1' }),
        });

        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/runner/execute', {
            method: 'POST',
            body: JSON.stringify({ runId: 'run-1' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await POST(request as any);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(markStaleRunsFailed).toHaveBeenCalledWith('project-1');
        expect(runUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'queued',
            workerId: null,
            leaseId: null,
            logs: [],
        }));
    });

    it('cancels a queued run for an owner', async () => {
        requireAuthenticatedUser.mockResolvedValue({ uid: 'owner-1' });
        runGet.mockResolvedValue({
            exists: true,
            data: () => ({
                projectId: 'project-1',
                status: 'queued',
                results: [{ testCaseId: 'tc-1', name: 'Login', status: 'queued' }],
            }),
        });
        projectGet.mockResolvedValue({
            data: () => ({ ownerId: 'owner-1' }),
        });

        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/runner/execute', {
            method: 'POST',
            body: JSON.stringify({ runId: 'run-1', action: 'cancel' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await POST(request as any);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(runUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'cancelled',
            workerId: null,
            leaseId: null,
        }));
    });

    it('requests cancellation for a running run', async () => {
        requireAuthenticatedUser.mockResolvedValue({ uid: 'owner-1' });
        runGet.mockResolvedValue({
            exists: true,
            data: () => ({
                projectId: 'project-1',
                status: 'running',
            }),
        });
        projectGet.mockResolvedValue({
            data: () => ({ ownerId: 'owner-1' }),
        });

        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/runner/execute', {
            method: 'POST',
            body: JSON.stringify({ runId: 'run-1', action: 'cancel' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await POST(request as any);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(runUpdate).toHaveBeenCalledWith(expect.objectContaining({
            cancelRequestedAt: expect.any(Date),
            cancelRequestedBy: 'owner-1',
        }));
    });

    it('rejects a viewer re-queue attempt', async () => {
        requireAuthenticatedUser.mockResolvedValue({ uid: 'viewer-1' });
        runGet.mockResolvedValue({
            exists: true,
            data: () => ({
                projectId: 'project-1',
                status: 'failed',
            }),
        });
        projectGet.mockResolvedValue({
            data: () => ({ ownerId: 'owner-1' }),
        });

        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/runner/execute', {
            method: 'POST',
            body: JSON.stringify({ runId: 'run-1' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await POST(request as any);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Only project owners');
        expect(runUpdate).not.toHaveBeenCalled();
    });

    it('rejects cancelling a completed run', async () => {
        requireAuthenticatedUser.mockResolvedValue({ uid: 'owner-1' });
        runGet.mockResolvedValue({
            exists: true,
            data: () => ({
                projectId: 'project-1',
                status: 'completed',
            }),
        });
        projectGet.mockResolvedValue({
            data: () => ({ ownerId: 'owner-1' }),
        });

        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/runner/execute', {
            method: 'POST',
            body: JSON.stringify({ runId: 'run-1', action: 'cancel' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await POST(request as any);
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error).toContain('cannot be cancelled');
        expect(runUpdate).not.toHaveBeenCalled();
    });
});
