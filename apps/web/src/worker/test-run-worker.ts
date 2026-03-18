import { randomUUID } from 'crypto';
import { adminDb } from '../lib/firebase/admin';
import { executeTestRun, markStaleRunsFailed } from '../lib/runner/server-executor';
import { assertServerEnv } from '../lib/server/env';
import { updateWorkerHeartbeat } from '../lib/server/worker-status';
import { claimNextQueuedRun } from './claim-run';

const POLL_INTERVAL_MS = 5000;
const workerId = process.env.OPENAUTOMATE_WORKER_ID || `worker-${randomUUID()}`;
const concurrencyLimit = Math.max(1, Number.parseInt(process.env.OPENAUTOMATE_WORKER_CONCURRENCY || '1', 10) || 1);
const activeRuns = new Map<string, Promise<void>>();

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getActiveRunIds() {
    return Array.from(activeRuns.keys());
}

async function heartbeat(state: 'idle' | 'claiming' | 'running') {
    const runIds = getActiveRunIds();
    await updateWorkerHeartbeat(workerId, state, runIds[0] || null, {
        activeRunCount: runIds.length,
        runIds,
        concurrencyLimit,
    });
}

function startRun(runId: string, leaseId: string) {
    const task = executeTestRun(runId, { workerId, leaseId })
        .catch((error) => {
            console.error(`[Worker ${workerId}] run ${runId} failed`, error);
        })
        .finally(() => {
            activeRuns.delete(runId);
        });

    activeRuns.set(runId, task);
}

async function runLoop() {
    assertServerEnv('Worker startup');
    console.log(`[Worker ${workerId}] started with concurrency ${concurrencyLimit}`);

    while (true) {
        try {
            await markStaleRunsFailed();
            let claimedAnyRun = false;

            while (activeRuns.size < concurrencyLimit) {
                await heartbeat(activeRuns.size > 0 ? 'running' : 'claiming');
                const claimedRun = await claimNextQueuedRun(adminDb as any, workerId);

                if (!claimedRun) {
                    break;
                }

                claimedAnyRun = true;
                const { runId, leaseId } = claimedRun;
                console.log(`[Worker ${workerId}] claimed run ${runId}`);
                startRun(runId, leaseId);
            }

            await heartbeat(activeRuns.size > 0 ? 'running' : 'idle');

            if (!claimedAnyRun && activeRuns.size === 0) {
                await sleep(POLL_INTERVAL_MS);
                continue;
            }

            await sleep(activeRuns.size > 0 ? 1000 : POLL_INTERVAL_MS);
        } catch (error) {
            console.error(`[Worker ${workerId}] loop error`, error);
            await heartbeat(activeRuns.size > 0 ? 'running' : 'idle');
            await sleep(POLL_INTERVAL_MS);
        }
    }
}

let shuttingDown = false;

async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Worker ${workerId}] received ${signal}, shutting down`);
    process.exit(0);
}

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

void runLoop();
