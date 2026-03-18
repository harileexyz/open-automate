import { NextResponse } from 'next/server';
import { getServerEnvStatus } from '@/lib/server/env';
import { getWorkerStatus } from '@/lib/server/worker-status';

export async function GET() {
    const envStatus = getServerEnvStatus();
    const workerStatus = await getWorkerStatus();

    return NextResponse.json(
        {
            status: envStatus.ok && workerStatus.online ? 'ok' : 'degraded',
            checks: {
                env: envStatus,
                worker: workerStatus,
            },
            timestamp: new Date().toISOString(),
        },
        { status: envStatus.ok && workerStatus.online ? 200 : 503 }
    );
}
