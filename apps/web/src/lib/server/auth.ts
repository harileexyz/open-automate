import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
export { getProjectIdFromArtifactPath, getProjectIdFromArtifactSource } from './artifact-paths';

function getBearerToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length);
    }

    return req.nextUrl.searchParams.get('authToken');
}

export async function requireAuthenticatedUser(req: NextRequest) {
    const token = getBearerToken(req);
    if (!token) {
        throw new Error('Authentication token is required');
    }

    return adminAuth.verifyIdToken(token);
}

export async function requireProjectAccess(req: NextRequest, projectId: string, options?: { ownerOnly?: boolean }) {
    const decodedToken = await requireAuthenticatedUser(req);
    const projectSnap = await adminDb.collection('projects').doc(projectId).get();

    if (!projectSnap.exists) {
        throw new Error('Project not found');
    }

    const project = projectSnap.data() as { ownerId: string; members?: string[] };
    const isOwner = project.ownerId === decodedToken.uid;
    const isMember = isOwner || (project.members || []).includes(decodedToken.uid);

    if (options?.ownerOnly) {
        if (!isOwner) {
            throw new Error('Owner access required');
        }
    } else if (!isMember) {
        throw new Error('Project access denied');
    }

    return {
        decodedToken,
        project,
        isOwner,
    };
}
