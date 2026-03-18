import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const requireProjectAccess = vi.fn();
const getProjectIdFromArtifactPath = vi.fn();
const getProjectIdFromArtifactSource = vi.fn();
const resolveArtifactUrl = vi.fn();

vi.mock('@/lib/server/auth', () => ({
    requireProjectAccess,
    getProjectIdFromArtifactPath,
    getProjectIdFromArtifactSource,
}));

vi.mock('@/lib/server/artifacts', () => ({
    resolveArtifactUrl,
}));

describe('GET /api/artifacts/access', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('resolves a path for an authorized user', async () => {
        getProjectIdFromArtifactPath.mockReturnValue('project-1');
        requireProjectAccess.mockResolvedValue({ isOwner: true });
        resolveArtifactUrl.mockResolvedValue('https://signed.example.com/file.zip');

        const { GET } = await import('./route');
        const request = new NextRequest('http://localhost/api/artifacts/access?path=traces/project-1/run-1/test.zip');

        const response = await GET(request as any);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://signed.example.com/file.zip');
        expect(requireProjectAccess).toHaveBeenCalled();
    });

    it('returns an error for an unauthorized user', async () => {
        getProjectIdFromArtifactPath.mockReturnValue('project-1');
        requireProjectAccess.mockRejectedValue(new Error('Project access denied'));

        const { GET } = await import('./route');
        const request = new NextRequest('http://localhost/api/artifacts/access?path=traces/project-1/run-1/test.zip');

        const response = await GET(request as any);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Project access denied');
        expect(resolveArtifactUrl).not.toHaveBeenCalled();
    });
});
