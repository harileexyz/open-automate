'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProject, useTestRunDetails, useTestCase } from '@/lib/hooks';
import { auth } from '@/lib/firebase';
import { Card, Badge, Button } from '@/components/ui';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    Terminal,
    Calendar,
    Globe,
    Cpu,
    ExternalLink,
    AlertCircle,
    Info,
    Layers,
    ChevronDown,
    ChevronUp,
    Camera,
    Video,
    Archive,
    RefreshCw,
    Square
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useState } from 'react';

function getArtifactAccessUrl(options: {
    path?: string | null;
    source?: string | null;
    filename?: string;
    download?: boolean;
    authToken?: string;
}) {
    const params = new URLSearchParams();
    if (options.path) params.set('path', options.path);
    if (options.source) params.set('source', options.source);
    if (options.filename) params.set('filename', options.filename);
    if (options.download) params.set('download', '1');
    if (options.authToken) params.set('authToken', options.authToken);
    return `/api/artifacts/access?${params.toString()}`;
}

function getTraceViewerUrl(tracePath?: string | null, traceUrl?: string | null, authToken?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (tracePath) params.set('path', tracePath);
    if (traceUrl) params.set('source', traceUrl);
    if (authToken) params.set('authToken', authToken);
    const proxiedTraceUrl = `${origin}/api/traces/view?${params.toString()}`;
    return `https://trace.playwright.dev/?trace=${encodeURIComponent(proxiedTraceUrl)}`;
}

export default function TestRunDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const runId = params.runId as string;

    const { project } = useProject(projectId);
    const { run, loading: runLoading } = useTestRunDetails(runId);

    // For single test runs
    const { testCase, loading: testCaseLoading } = useTestCase(run?.type !== 'suite' ? (run?.testCaseId || null) : null);

    const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<'cancel' | 'requeue' | null>(null);

    const openArtifact = async (options: {
        path?: string | null;
        source?: string | null;
        filename?: string;
        download?: boolean;
        traceViewer?: boolean;
    }) => {
        try {
            const authToken = await auth.currentUser?.getIdToken();
            if (!authToken) {
                toast.error('You need to be signed in to access artifacts');
                return;
            }

            const targetUrl = options.traceViewer
                ? getTraceViewerUrl(options.path, options.source, authToken)
                : getArtifactAccessUrl({
                    path: options.path,
                    source: options.source,
                    filename: options.filename,
                    download: options.download,
                    authToken,
                });

            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error(error);
            toast.error('Failed to open artifact');
        }
    };

    const loading = runLoading || (run?.type !== 'suite' && testCaseLoading);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!run) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2">Run Not Found</h2>
                <p className="text-gray-400 mb-6">The test run you are looking for does not exist or has been deleted.</p>
                <Link href={`/projects/${projectId}/test-runs`}>
                    <Button variant="outline">Back to Test Runs</Button>
                </Link>
            </div>
        );
    }

    const formatDuration = (ms?: number) => {
        if (!ms && ms !== 0) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'failed': return 'danger';
            case 'starting': return 'warning';
            case 'running': return 'info';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string, size = "w-4 h-4") => {
        switch (status) {
            case 'completed': return <CheckCircle className={`${size} text-emerald-500`} />;
            case 'failed': return <XCircle className={`${size} text-red-500`} />;
            case 'starting': return <Clock className={`${size} text-yellow-400 animate-pulse`} />;
            case 'running': return <Activity className={`${size} text-blue-400 animate-spin`} />;
            default: return <Clock className={`${size} text-gray-500`} />;
        }
    };

    const isSuite = run.type === 'suite';
    const isOwner = !!project && auth.currentUser?.uid === project.ownerId;
    const canCancel = isOwner && ['queued', 'starting', 'running'].includes(run.status);
    const canRequeue = isOwner && ['failed', 'cancelled'].includes(run.status);

    const manageRun = async (action: 'cancel' | 'requeue') => {
        try {
            setActionLoading(action);
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

    // Stats
    const totalItems = isSuite ? (run.results?.length || 0) : (run.logs?.length || 0);
    const passedItems = isSuite
        ? (run.results?.filter(r => r.status === 'completed').length || 0)
        : (run.logs?.filter(l => l.status === 'passed').length || 0);
    const failedItems = isSuite
        ? (run.results?.filter(r => r.status === 'failed').length || 0)
        : (run.logs?.filter(l => l.status === 'failed').length || 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header / Breadcrumbs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">Projects</Link>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                    <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-white transition-colors">{project?.name || 'Project'}</Link>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                    <Link href={`/projects/${projectId}/test-runs`} className="text-gray-400 hover:text-white transition-colors">Test Runs</Link>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                    <span className="text-white truncate max-w-[200px]">{run.name}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={getStatusVariant(run.status)} className="uppercase tracking-widest text-[10px] px-2.5 py-1">
                                {run.status}
                            </Badge>
                            <h1 className="text-2xl font-bold text-white tracking-tight">{run.name}</h1>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 text-[11px] mt-2">
                            <span className="flex items-center gap-1.5 font-mono">
                                <Terminal className="w-3.5 h-3.5" />
                                {run.id}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {run.createdAt?.seconds ? format(new Date(run.createdAt.seconds * 1000), 'MMM d, yyyy HH:mm') : 'Just now'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                Triggered by {run.triggeredBy}
                            </span>
                            {run.cancelRequestedAt && run.status !== 'cancelled' && (
                                <span className="flex items-center gap-1.5 text-amber-400">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Cancellation requested
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canCancel && (
                            <Button
                                size="sm"
                                variant="danger"
                                loading={actionLoading === 'cancel'}
                                onClick={() => void manageRun('cancel')}
                            >
                                <Square className="w-4 h-4 mr-1.5" />
                                {run.status === 'queued' ? 'Cancel Run' : 'Request Cancel'}
                            </Button>
                        )}
                        {canRequeue && (
                            <Button
                                size="sm"
                                variant="outline"
                                loading={actionLoading === 'requeue'}
                                onClick={() => void manageRun('requeue')}
                                className="border-gray-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                Re-queue
                            </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => router.back()}>
                            <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
                        </Button>
                        <Button size="sm" onClick={() => window.print()} variant="outline" className="border-gray-700">
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Run Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-gray-800/50 bg-gray-900/30">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">{isSuite ? 'Suite Name' : 'Test Case'}</p>
                    <h3 className="font-semibold text-white truncate text-sm">
                        {isSuite ? (run.name?.split(' - ')[0] || 'Suite') : (testCase?.name || 'Loading...')}
                    </h3>
                </Card>
                <Card className="p-4 border-gray-800/50 bg-gray-900/30">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Environment</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                            < Globe className="w-3.5 h-3.5 text-violet-400" />
                            Local
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                            <Cpu className="w-3.5 h-3.5 text-violet-400" />
                            Chrome
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-gray-800/50 bg-gray-900/30">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Duration</p>
                    <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                        <Clock className="w-4 h-4 text-violet-400" />
                        {run.startedAt && run.completedAt
                            ? formatDuration(run.completedAt.toMillis() - run.startedAt.toMillis())
                            : run.startedAt ? 'Running...' : '-'}
                    </div>
                </Card>
                <Card className="p-4 border-gray-800/50 bg-gray-900/30">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">{isSuite ? 'Test Case Stats' : 'Step Stats'}</p>
                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">{totalItems}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Total</p>
                        </div>
                        <div className="w-px h-6 bg-gray-800" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-emerald-400">{passedItems}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Passed</p>
                        </div>
                        <div className="w-px h-6 bg-gray-800" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-red-400">{failedItems}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Failed</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {isSuite ? 'Suite Execution' : 'Step Execution'}
                            {run.status === 'running' && <Activity className="w-4 h-4 text-violet-400 animate-pulse" />}
                        </h2>
                    </div>

                    {isSuite ? (
                        /* Suite Specific View */
                        <div className="space-y-2">
                            {!run.results || run.results.length === 0 ? (
                                <Card className="p-12 text-center bg-gray-900/20 border-dashed border-gray-800">
                                    <Layers className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-400 italic">No test results found for this suite.</p>
                                </Card>
                            ) : (
                                run.results.map((result, idx) => (
                                    <Card key={result.testCaseId} className="p-0 overflow-hidden border-gray-800">
                                        <div
                                            className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors ${expandedCaseId === result.testCaseId ? 'bg-gray-800/30' : ''}`}
                                            onClick={() => setExpandedCaseId(expandedCaseId === result.testCaseId ? null : result.testCaseId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(result.status)}
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-200">{result.name}</h4>
                                                    <p className="text-[10px] text-gray-500 font-mono">{result.testCaseId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] text-gray-500">
                                                    {result.logs?.length || 0} steps
                                                </span>
                                                <div className="text-gray-600">
                                                    {expandedCaseId === result.testCaseId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedCaseId === result.testCaseId && (
                                            <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-3">
                                                {(result.tracePath || result.traceUrl || result.videoPath || result.videoUrl) && (
                                                    <div className="flex gap-3 mb-2">
                                                        {(result.tracePath || result.traceUrl) && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openArtifact({ path: result.tracePath, source: result.traceUrl, traceViewer: true })}
                                                                    className="inline-flex items-center gap-1.5 text-[10px] text-violet-400 hover:text-white"
                                                                >
                                                                    <Archive className="w-3 h-3" /> View Trace
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openArtifact({
                                                                        path: result.tracePath,
                                                                        source: result.traceUrl,
                                                                        filename: `trace-${run.id}-${result.testCaseId}.zip`,
                                                                        download: true,
                                                                    })}
                                                                    className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white"
                                                                >
                                                                    Download
                                                                </button>
                                                            </>
                                                        )}
                                                        {(result.videoPath || result.videoUrl) && (
                                                            <button type="button" onClick={() => openArtifact({ path: result.videoPath, source: result.videoUrl, filename: `video-${run.id}-${result.testCaseId}.webm` })} className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-white">
                                                                <Video className="w-3 h-3" /> Watch Video
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {!result.logs || result.logs.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic px-4">No steps recorded yet.</p>
                                                ) : (
                                                    result.logs.map((log, lIdx) => (
                                                        <div key={lIdx} className="flex gap-3 items-start text-xs border-b border-gray-800/50 pb-2 last:border-0">
                                                            <div className={`mt-0.5 p-1 rounded ${log.status === 'passed' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                                {log.status === 'passed' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-gray-300 uppercase tracking-tight text-[10px]">{log.action}</span>
                                                                    <span className="text-[10px] text-gray-500 font-mono">{formatDuration(log.duration)}</span>
                                                                </div>
                                                                <p className="text-gray-400 mt-0.5 line-clamp-1 truncate">{log.selector || 'Action'}</p>
                                                                {log.error && <p className="text-[10px] text-red-400 mt-1 bg-red-400/5 p-1.5 rounded border border-red-400/10">{log.error}</p>}
                                                                {(log.screenshotPath || log.screenshotUrl) && (
                                                                    <div className="mt-2">
                                                                        <button type="button" onClick={() => openArtifact({ path: log.screenshotPath, source: log.screenshotUrl, filename: `screenshot-${run.id}-${result.testCaseId}.png` })} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded border border-gray-700 text-[10px] text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                                                                            <Camera className="w-3 h-3" /> View Screenshot
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}

                                                {/* Suite Result Console Logs */}
                                                {result.consoleLogs && result.consoleLogs.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-800/50">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                            <Terminal className="w-3 h-3" /> Console Output
                                                        </p>
                                                        <div className="bg-black/30 rounded border border-gray-800/50 p-2 font-mono text-[10px] max-h-[150px] overflow-y-auto">
                                                            {result.consoleLogs.map((log: any, idx: number) => (
                                                                <div key={idx} className="flex gap-2 mb-0.5">
                                                                    <span className={`shrink-0 ${log.type === 'error' ? 'text-red-400' :
                                                                        log.type === 'warning' ? 'text-yellow-400' :
                                                                            'text-gray-500'
                                                                        }`}>
                                                                        [{log.type}]
                                                                    </span>
                                                                    <span className="text-gray-300 break-all">{log.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Single Test Case View (Existing Logic) */
                        <>
                            {/* Artifacts Header */}
                            {(run.tracePath || run.traceUrl || run.videoPath || run.videoUrl) && (
                                <div className="flex gap-3 mb-4">
                                    {(run.tracePath || run.traceUrl) && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openArtifact({ path: run.tracePath, source: run.traceUrl, traceViewer: true })}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-white rounded border border-violet-500/20 text-xs font-medium transition-colors"
                                            >
                                                <Archive className="w-3.5 h-3.5" /> View Trace
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openArtifact({
                                                    path: run.tracePath,
                                                    source: run.traceUrl,
                                                    filename: `trace-${run.id}.zip`,
                                                    download: true,
                                                })}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-gray-700 text-xs font-medium transition-colors"
                                            >
                                                Download Trace
                                            </button>
                                        </>
                                    )}
                                    {(run.videoPath || run.videoUrl) && (
                                        <button type="button" onClick={() => openArtifact({ path: run.videoPath, source: run.videoUrl, filename: `video-${run.id}.webm` })} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-white rounded border border-blue-500/20 text-xs font-medium transition-colors">
                                            <Video className="w-3.5 h-3.5" /> Watch Video
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                {!run.logs || run.logs.length === 0 ? (
                                    <Card className="p-12 text-center bg-gray-900/20 border-dashed border-gray-800">
                                        <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-400 italic">No execution logs found yet.</p>
                                    </Card>
                                ) : (
                                    run.logs.map((log, idx) => (
                                        <Card key={idx} className={`p-3 bg-gray-900/20 border-gray-800 border-l-4 ${log.status === 'passed' ? 'border-l-emerald-500' : log.status === 'failed' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                                            <div className="flex gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${log.status === 'passed' ? 'border-emerald-500/30 text-emerald-400' : log.status === 'failed' ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-white uppercase text-[10px] tracking-wider">{log.action}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-mono">{formatDuration(log.duration)}</span>
                                                            {getStatusIcon(log.status, "w-3.5 h-3.5")}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{log.selector || 'Step Action'}</p>
                                                    {log.error && <p className="text-xs text-red-400 mt-2 bg-red-400/5 p-2 rounded border border-red-400/10 font-mono">{log.error}</p>}
                                                    {(log.screenshotPath || log.screenshotUrl) && (
                                                        <div className="mt-2">
                                                            <button type="button" onClick={() => openArtifact({ path: log.screenshotPath, source: log.screenshotUrl, filename: `screenshot-${run.id}.png` })} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 rounded border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                                                                <Camera className="w-3.5 h-3.5" /> View Screenshot
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Single Run Console Logs */}
                            {run.consoleLogs && run.consoleLogs.length > 0 && (
                                <div className="mt-8 space-y-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-violet-400" />
                                        Console Output
                                    </h3>
                                    <Card className="bg-gray-950 border-gray-800 font-mono text-xs p-0 overflow-hidden">
                                        <div className="p-2 bg-gray-900/50 border-b border-gray-800 text-[10px] text-gray-500 flex justify-between">
                                            <span>Terminal Output</span>
                                            <span>{run.consoleLogs.length} entries</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-3 space-y-1">
                                            {run.consoleLogs.map((log: any, idx: number) => (
                                                <div key={idx} className="flex gap-3 text-[11px] group hover:bg-white/5 p-0.5 rounded px-2 -mx-2">
                                                    <span className="text-gray-600 select-none shrink-0 w-[50px] text-right">
                                                        {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : '--:--'}
                                                    </span>
                                                    <div className="flex-1 break-all flex gap-2">
                                                        <span className={`uppercase font-bold text-[9px] w-[35px] shrink-0 ${log.type === 'error' ? 'text-red-400' :
                                                            log.type === 'warning' ? 'text-yellow-400' :
                                                                'text-gray-500'
                                                            }`}>
                                                            {log.type}
                                                        </span>
                                                        <span className={`${log.type === 'error' ? 'text-red-300' :
                                                            log.type === 'warning' ? 'text-yellow-200' :
                                                                'text-gray-300'
                                                            }`}>
                                                            {log.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {run.status === 'failed' && run.error && (
                        <Card className="border-red-500/30 bg-red-500/5 p-4">
                            <h3 className="text-red-400 font-bold text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Fail Reason
                            </h3>
                            <p className="text-[11px] text-red-200 font-mono bg-black/40 p-2 rounded border border-red-900/30">
                                {run.error}
                            </p>
                        </Card>
                    )}

                    <Card className="bg-gray-900/20 divide-y divide-gray-800">
                        <div className="p-4">
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-violet-400" /> Metadata
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Triggered By</p>
                                    <p className="text-xs text-gray-300 truncate">{run.triggeredBy}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Browser</p>
                                    <p className="text-xs text-gray-300">Google Chrome (Headless: true)</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <Button
                                className="w-full text-xs"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Report link copied');
                                }}
                            >
                                Copy Report Link
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
