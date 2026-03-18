'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProject, useTestRuns } from '@/lib/hooks';
import { auth } from '@/lib/firebase';
import { Card, Badge, Button } from '@/components/ui';
import { ChevronRight, ChevronDown, Play, CheckCircle, XCircle, Clock, Activity, Terminal, Layers, FileText, ExternalLink, Square, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function TestRunsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { project } = useProject(projectId);
    const { testRuns, loading } = useTestRuns(projectId);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const manageRun = async (runId: string, action: 'cancel' | 'requeue') => {
        try {
            setActionLoading(`${action}:${runId}`);
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                toast.error('You need to be signed in');
                return;
            }

            const response = await fetch('/api/runner/execute', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ runId, action }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || `Failed to ${action} run`);
            }

            toast.success(payload.message || (action === 'cancel' ? 'Run cancellation requested' : 'Run queued again'));
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || `Failed to ${action} run`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-400 bg-emerald-400/10';
            case 'failed': return 'text-red-400 bg-red-400/10';
            case 'running': return 'text-blue-400 bg-blue-400/10 animate-pulse';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'failed': return <XCircle className="w-4 h-4" />;
            case 'running': return <Activity className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
                    Projects
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-white transition-colors">
                    {project?.name || 'Project'}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white">Test Runs</span>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Test Runs</h1>
                    <p className="text-gray-400 text-sm">Execution history and results</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading runs...</p>
                </div>
            ) : testRuns.length === 0 ? (
                <Card className="py-20 text-center bg-gray-900/20 border-dashed">
                    <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No runs yet</h3>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">
                        Execute your first test case to see detailed results and analytics here
                    </p>
                    <Link href={`/projects/${projectId}/test-cases`}>
                        <Button>Go to Test Cases</Button>
                    </Link>
                </Card>
            ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800 bg-gray-800/30 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1">Status</div>
                        <div className="col-span-5">Run Name / Target</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Time</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-800">
                        {testRuns.map((run) => (
                            <ExpandableRunRow
                                key={run.id}
                                run={run}
                                projectId={projectId}
                                isOwner={!!project && auth.currentUser?.uid === project.ownerId}
                                actionLoading={actionLoading}
                                onManageRun={manageRun}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ExpandableRunRow({
    run,
    projectId,
    isOwner,
    actionLoading,
    onManageRun,
    getStatusColor,
    getStatusIcon,
}: {
    run: any;
    projectId: string;
    isOwner: boolean;
    actionLoading: string | null;
    onManageRun: (runId: string, action: 'cancel' | 'requeue') => Promise<void>;
    getStatusColor: any;
    getStatusIcon: any;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const canCancel = isOwner && ['queued', 'starting', 'running'].includes(run.status);
    const canRequeue = isOwner && ['failed', 'cancelled'].includes(run.status);

    // Get summary of logs/steps
    const totalSteps = run.type === 'suite'
        ? run.results?.reduce((acc: number, r: any) => acc + (r.logs?.length || 0), 0) || 0
        : (run.logs?.length || 0);

    const failedSteps = run.type === 'suite'
        ? run.results?.reduce((acc: number, r: any) => acc + (r.logs?.filter((l: any) => l.status === 'failed').length || 0), 0) || 0
        : (run.logs?.filter((l: any) => l.status === 'failed').length || 0);

    return (
        <div className="group bg-gray-900/20 hover:bg-gray-800/40 transition-colors">
            <div
                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="col-span-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(run.status)}`}>
                        {getStatusIcon(run.status)}
                    </div>
                </div>

                <div className="col-span-5 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 group-hover:text-violet-400 transition-colors truncate flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        {run.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                            {run.type === 'suite' ? `${run.testCaseIds?.length || 0} cases, ${totalSteps} steps` : `${run.testCaseId} • ${totalSteps} steps`}
                        </span>
                        {failedSteps > 0 && (
                            <span className="text-[10px] text-red-400 truncate flex-1 font-bold">
                                {failedSteps} failures
                            </span>
                        )}
                        {run.error && (
                            <span className="text-[10px] text-red-400 truncate flex-1">— {run.error}</span>
                        )}
                    </div>
                </div>

                <div className="col-span-2">
                    {run.type === 'suite' ? (
                        <Badge variant="info" className="text-[10px] px-1.5 py-0">Suite</Badge>
                    ) : (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Case</Badge>
                    )}
                </div>

                <div className="col-span-2">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400">
                            {run.createdAt?.seconds ? formatDistanceToNow(new Date(run.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                        </span>
                    </div>
                </div>

                <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                        {canCancel && (
                            <Button
                                size="sm"
                                variant="ghost"
                                loading={actionLoading === `cancel:${run.id}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void onManageRun(run.id, 'cancel');
                                }}
                                className="px-2 py-1 text-[11px] text-red-300 hover:text-white"
                            >
                                <Square className="w-3 h-3" />
                            </Button>
                        )}
                        {canRequeue && (
                            <Button
                                size="sm"
                                variant="ghost"
                                loading={actionLoading === `requeue:${run.id}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void onManageRun(run.id, 'requeue');
                                }}
                                className="px-2 py-1 text-[11px] text-cyan-300 hover:text-white"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </Button>
                        )}
                        <Link
                            href={`/projects/${projectId}/test-runs/${run.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-violet-400 p-1 rounded hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all"
                        >
                            Full Report
                            <ExternalLink className="w-3 h-3 translate-y-[0.5px]" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Expanded Content: Mini Logs Wrapper */}
            {isExpanded && (
                <div className="px-4 pb-4 pl-14">
                    <div className="bg-black/30 rounded border border-gray-800/50 p-3 text-xs max-h-[300px] overflow-y-auto">
                        {run.type === 'suite' ? (
                            <div className="space-y-4">
                                {run.results?.map((res: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                                            {getStatusIcon(res.status, "w-3 h-3")}
                                            <span className="font-bold text-gray-300">{res.name}</span>
                                            <span className="text-[10px] text-gray-500 ml-auto">{res.status}</span>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {res.logs?.map((log: any, lIdx: number) => (
                                                <MiniLogItem key={lIdx} log={log} />
                                            ))}
                                            {(!res.logs || res.logs.length === 0) && <p className="text-[10px] text-gray-600 italic">No steps executed yet.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {run.logs?.map((log: any, lIdx: number) => (
                                    <MiniLogItem key={lIdx} log={log} />
                                ))}
                                {(!run.logs || run.logs.length === 0) && <p className="text-[10px] text-gray-600 italic">No steps executed yet. Queued...</p>}
                            </div>
                        )}

                        {/* Show Console Logs preview if any */}
                        {run.consoleLogs && run.consoleLogs.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-800/50">
                                <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                                    <Terminal className="w-3 h-3" /> Latest Console Activity
                                </p>
                                <div className="font-mono text-[10px] text-gray-400">
                                    {run.consoleLogs.slice(-3).map((l: any, i: number) => (
                                        <div key={i} className="truncate line-clamp-1 opacity-70">
                                            <span className={l.type === 'error' ? 'text-red-400' : 'text-gray-500'}>[{l.type}]</span> {l.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MiniLogItem({ log }: { log: any }) {
    return (
        <div className="flex gap-2 items-center">
            <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'passed' ? 'bg-emerald-500' :
                    log.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500 animate-pulse'
                }`} />
            <span className="uppercase text-[9px] font-bold text-gray-500 w-12 shrink-0">{log.action}</span>
            <span className={`text-gray-300 truncate max-w-[300px] ${log.status === 'failed' ? 'text-red-300' : ''}`}>
                {log.selector || 'Action'}
            </span>
            {log.error && <span className="text-[9px] text-red-400 bg-red-400/10 px-1 rounded truncate flex-1">{log.error}</span>}
            <span className="text-[9px] text-gray-600 font-mono ml-auto">
                {log.duration ? `${log.duration}ms` : ''}
            </span>
        </div>
    );
}
