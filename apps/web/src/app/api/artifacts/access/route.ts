import { NextRequest, NextResponse } from 'next/server';
import { resolveArtifactUrl } from '@/lib/server/artifacts';
import { getProjectIdFromArtifactPath, getProjectIdFromArtifactSource, requireProjectAccess } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const path = req.nextUrl.searchParams.get('path');
    const source = req.nextUrl.searchParams.get('source');
    const filename = req.nextUrl.searchParams.get('filename') || undefined;
    const download = req.nextUrl.searchParams.get('download') === '1';

    try {
        const projectId = path ? getProjectIdFromArtifactPath(path) : source ? getProjectIdFromArtifactSource(source) : null;
        if (!projectId) {
            throw new Error('Unable to resolve artifact project');
        }

        await requireProjectAccess(req, projectId);

        const url = await resolveArtifactUrl({
            path,
            source,
            downloadName: filename,
            asAttachment: download,
        });

        return NextResponse.redirect(url);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to resolve artifact' },
            { status: 400 }
        );
    }
}
