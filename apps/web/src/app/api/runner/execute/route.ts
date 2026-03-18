import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { markStaleRunsFailed } from '@/lib/runner/server-executor';
import { requireAuthenticatedUser } from '@/lib/server/auth';

function resetRunResults(results?: any[]) {
    if (!Array.isArray(results)) {
        return undefined;
    }

    return results.map((result: any) => ({
        testCaseId: result.testCaseId,
        name: result.name,
        status: 'queued',
        logs: [],
        consoleLogs: [],
        error: null,
        videoPath: null,
        tracePath: null,
        videoUrl: null,
        traceUrl: null,
        startedAt: null,
        completedAt: null,
    }));
}

function cancelRunResults(results?: any[]) {
    if (!Array.isArray(results)) {
        return undefined;
    }

    return results.map((result: any) => ({
        ...result,
        status: ['completed', 'failed', 'cancelled'].includes(result.status) ? result.status : 'cancelled',
        completedAt: result.completedAt || new Date(),
    }));
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await requireAuthenticatedUser(req);
        const { runId, action = 'requeue' } = await req.json();

        if (!runId) {
            return NextResponse.json({ error: 'runId is required' }, { status: 400 });
        }

        if (!['requeue', 'cancel'].includes(action)) {
            return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
        }

        const runRef = adminDb.collection('testRuns').doc(runId);
        const runSnap = await runRef.get();
        if (!runSnap.exists) {
            return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        }

        const runData = runSnap.data() as { projectId: string; status: string; triggeredBy: string };
        const projectSnap = await adminDb.collection('projects').doc(runData.projectId).get();
        const project = projectSnap.data() as { ownerId: string } | undefined;

        if (!project || project.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: 'Only project owners can trigger execution' }, { status: 403 });
        }

        if (action === 'cancel') {
            if (runData.status === 'cancelled') {
                return NextResponse.json({
                    success: true,
                    message: 'Run is already cancelled',
                });
            }

            if (!['queued', 'starting', 'running'].includes(runData.status)) {
                return NextResponse.json({ error: `Run cannot be cancelled from status ${runData.status}` }, { status: 409 });
            }

            if (runData.status === 'queued') {
                await runRef.update({
                    status: 'cancelled',
                    updatedAt: new Date(),
                    completedAt: new Date(),
                    cancelRequestedAt: new Date(),
                    cancelRequestedBy: decodedToken.uid,
                    claimedAt: null,
                    heartbeatAt: null,
                    workerId: null,
                    leaseId: null,
                    ...(cancelRunResults((runData as any).results) ? { results: cancelRunResults((runData as any).results) } : {}),
                });
            } else {
                await runRef.update({
                    cancelRequestedAt: new Date(),
                    cancelRequestedBy: decodedToken.uid,
                    updatedAt: new Date(),
                });
            }

            console.log(`[API] Cancellation requested for run ${runId}`);

            return NextResponse.json({
                success: true,
                message: runData.status === 'queued'
                    ? 'Queued run cancelled'
                    : 'Cancellation requested. The worker will stop the run shortly.',
            });
        }

        if (!['queued', 'failed', 'cancelled'].includes(runData.status)) {
            return NextResponse.json({ error: `Run cannot be queued from status ${runData.status}` }, { status: 409 });
        }

        await markStaleRunsFailed(runData.projectId);
        const resetResults = resetRunResults((runData as any).results);

        await runRef.update({
            status: 'queued',
            updatedAt: new Date(),
            lastAttemptAt: new Date(),
            heartbeatAt: null,
            claimedAt: null,
            workerId: null,
            leaseId: null,
            startedAt: null,
            completedAt: null,
            error: null,
            logs: [],
            consoleLogs: [],
            videoPath: null,
            tracePath: null,
            videoUrl: null,
            traceUrl: null,
            cancelRequestedAt: null,
            cancelRequestedBy: null,
            ...(resetResults ? { results: resetResults } : {}),
        });

        console.log(`[API] Re-queued run ${runId} for worker pickup`);

        return NextResponse.json({
            success: true,
            message: 'Run queued for worker pickup'
        });

    } catch (error: any) {
        console.error('[API] Error triggering executor:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
