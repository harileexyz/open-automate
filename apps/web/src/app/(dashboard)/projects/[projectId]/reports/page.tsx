'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTestRuns, useProject } from '@/lib/hooks';
import { useProjectContext } from '@/components/layout/ProjectProvider';
import { Card, CardHeader, Badge } from '@/components/ui';
import { PassRateWidget } from '@/components/dashboard/PassRateWidget';
import { RecentRunsWidget } from '@/components/dashboard/RecentRunsWidget';
import {
    BarChart3,
    Activity,
    Layers,
    FileCheck,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui';

export default function ReportsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const { project } = useProject(projectId);
    const { testRuns, loading: runsLoading } = useTestRuns(projectId);
    const { suites, testCases, loadingCases, loadingSuites } = useProjectContext();

    const loading = runsLoading || loadingCases || loadingSuites;

    // Active items
    const activeTestCases = useMemo(() => testCases.filter(tc => tc.status !== 'draft'), [testCases]);

    // Aggregations
    const stats = useMemo(() => {
        if (!testRuns.length) return null;

        const completedRuns = testRuns.filter(r => r.status === 'completed' || r.status === 'failed');
        const passedRuns = completedRuns.filter(r => r.status === 'completed').length;
        const failedRuns = completedRuns.filter(r => r.status === 'failed').length;
        const totalRuns = testRuns.length;
        const passRate = completedRuns.length > 0 ? Math.round((passedRuns / completedRuns.length) * 100) : 0;

        // Processing individual test results for slow/flaky metrics
        let testCaseStats: Record<string, { runs: number; failures: number; totalDuration: number; name: string }> = {};

        completedRuns.forEach(run => {
            if (run.type === 'suite' && run.results) {
                run.results.forEach(res => {
                    if (!testCaseStats[res.testCaseId]) {
                        testCaseStats[res.testCaseId] = { runs: 0, failures: 0, totalDuration: 0, name: res.name };
                    }
                    testCaseStats[res.testCaseId].runs += 1;
                    if (res.status === 'failed') testCaseStats[res.testCaseId].failures += 1;
                    if (res.startedAt && res.completedAt) {
                        try {
                            const duration = res.completedAt.toMillis() - res.startedAt.toMillis();
                            if (duration > 0) testCaseStats[res.testCaseId].totalDuration += duration;
                        } catch (e) {
                            // handle missing toMillis gracefully
                        }
                    }
                });
            } else if (run.type === 'test-case' && run.testCaseId) {
                 if (!testCaseStats[run.testCaseId]) {
                    testCaseStats[run.testCaseId] = { runs: 0, failures: 0, totalDuration: 0, name: run.name || 'Unknown' };
                 }
                 testCaseStats[run.testCaseId].runs += 1;
                 if (run.status === 'failed') testCaseStats[run.testCaseId].failures += 1;
                 if (run.startedAt && run.completedAt) {
                     try {
                         const duration = run.completedAt.toMillis() - run.startedAt.toMillis();
                         if (duration > 0) testCaseStats[run.testCaseId].totalDuration += duration;
                     } catch (e) {}
                 }
            }
        });

        // Determine slow and flaky tests
        const testCaseArray = Object.values(testCaseStats).filter(t => t.runs > 0);
        
        // Flaky tests: highest failure rate (failures / runs)
        const flakyTests = [...testCaseArray]
            .filter(t => t.failures > 0)
            .map(t => ({ ...t, failureRate: Math.round((t.failures / t.runs) * 100) }))
            .sort((a, b) => b.failureRate - a.failureRate)
            .slice(0, 5);

        // Slowests tests: highest average duration
        const slowTests = [...testCaseArray]
            .filter(t => t.totalDuration > 0)
            .map(t => ({ ...t, avgDuration: t.totalDuration / t.runs }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 5);

        return {
            totalRuns,
            completedRuns: completedRuns.length,
            passedRuns,
            failedRuns,
            passRate,
            flakyTests,
            slowTests
        };
    }, [testRuns]);

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const exportRuns = (formatType: 'json' | 'csv') => {
        const baseName = `${project?.name || 'project'}-reports-${new Date().toISOString().slice(0, 10)}`;

        if (formatType === 'json') {
            const blob = new Blob([JSON.stringify(testRuns, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${baseName}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            return;
        }

        const rows = [
            ['Run ID', 'Name', 'Type', 'Status', 'Triggered By', 'Created At', 'Started At', 'Completed At'],
            ...testRuns.map((run) => [
                run.id,
                run.name || '',
                run.type,
                run.status,
                run.triggeredBy,
                run.createdAt?.toDate?.()?.toISOString?.() || '',
                run.startedAt?.toDate?.()?.toISOString?.() || '',
                run.completedAt?.toDate?.()?.toISOString?.() || '',
            ]),
        ];

        const csv = rows
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${baseName}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-violet-400" />
                            Analytics & Reports
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Track the health and performance of your test automation in project {project?.name || ''}.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportRuns('json')}>
                            Export JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportRuns('csv')}>
                            Export CSV
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Scorecard Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-500/20 rounded-xl">
                            <Activity className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stats?.totalRuns || 0}</p>
                            <p className="text-sm text-gray-400">Total Executions</p>
                        </div>
                    </div>
                </Card>
                <Card className="flex flex-col relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-3 rounded-xl ${
                            stats?.passRate && stats.passRate >= 90 ? 'bg-emerald-500/20' : 
                            stats?.passRate && stats.passRate >= 70 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                            <Zap className={`w-6 h-6 ${
                                stats?.passRate && stats.passRate >= 90 ? 'text-emerald-400' : 
                                stats?.passRate && stats.passRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                            }`} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stats?.passRate || 0}%</p>
                            <p className="text-sm text-gray-400">Overall Pass Rate</p>
                        </div>
                    </div>
                </Card>
                <Card className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <FileCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{activeTestCases.length}</p>
                            <p className="text-sm text-gray-400">Active Test Cases</p>
                        </div>
                    </div>
                </Card>
                <Card className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-500/20 rounded-xl">
                            <Layers className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{suites.length}</p>
                            <p className="text-sm text-gray-400">Test Suites</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Recent Runs & Flaky Tests */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Test Execution Timeline */}
                    <Card>
                        <CardHeader 
                            title="Execution History" 
                            description="Historical timeline of your recent test runs."
                        />
                        {testRuns.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No test runs recorded yet.</p>
                            </div>
                        ) : (
                            <div className="mt-4 pb-2">
                                <div className="flex items-end h-32 gap-1.5 overflow-x-auto px-1 pb-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                    {testRuns.slice().reverse().map((run) => (
                                        <div key={run.id} className="group relative flex-col justify-end min-w-[32px] w-full max-w-[40px] hidden sm:flex">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 text-xs rounded-md p-2 w-[160px] pointer-events-none z-10 shadow-xl">
                                                <p className="font-semibold text-white truncate">{run.name}</p>
                                                <div className="mt-1 flex items-center justify-between text-gray-400">
                                                    <span>Status:</span>
                                                    <span className={run.status === 'completed' ? 'text-emerald-400' : run.status === 'failed' ? 'text-red-400' : 'text-blue-400'}>{run.status}</span>
                                                </div>
                                                <div className="text-gray-500 mt-1">{format(run.createdAt?.toMillis ? run.createdAt.toMillis() : Date.now(), 'MMM d, HH:mm')}</div>
                                            </div>
                                            {/* Bar Line */}
                                            <div 
                                                className={`w-full rounded-sm transition-all duration-300 group-hover:brightness-125 ${
                                                    run.status === 'completed' ? 'bg-emerald-500/80 hover:bg-emerald-400' : 
                                                    run.status === 'failed' ? 'bg-red-500/80 hover:bg-red-400' : 
                                                    'bg-blue-500/60 hover:bg-blue-400'
                                                }`}
                                                style={{ height: run.status === 'completed' ? '100%' : run.status === 'failed' ? '60%' : '80%' }}
                                            />
                                        </div>
                                    ))}
                                    {/* Mobile Fallback visualization */}
                                    <div className="sm:hidden w-full flex text-sm text-gray-500 italic py-8 justify-center">
                                        Please view on larger screen for execution charts
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                                    <span>Older</span>
                                    <span>Newer</span>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Flaky Tests */}
                        <Card>
                            <CardHeader title="Flakiest Tests" description="Tests failing most frequently" />
                            {!stats?.flakyTests?.length ? (
                                <div className="text-center py-6 text-gray-500 text-sm italic">
                                    No failing tests recorded yet
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2">
                                    {stats.flakyTests.map(test => (
                                        <div key={test.name} className="flex flex-col p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-sm font-medium text-gray-200 truncate pr-2 max-w-[200px]">{test.name}</h4>
                                                <Badge variant="danger" className="text-xs shrink-0">{test.failureRate}% fail rate</Badge>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Failures: <span className="text-red-400">{test.failures}</span> / {test.runs} runs</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Slowest Tests */}
                        <Card>
                            <CardHeader title="Slowest Tests" description="Tests taking the longest" />
                            {!stats?.slowTests?.length ? (
                                <div className="text-center py-6 text-gray-500 text-sm italic">
                                    No completed tests with duration recorded
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2">
                                    {stats.slowTests.map(test => (
                                        <div key={test.name} className="flex flex-col p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-sm font-medium text-gray-200 truncate pr-2 max-w-[180px]">{test.name}</h4>
                                                <Badge variant="warning" className="text-xs shrink-0 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDuration(test.avgDuration)}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Average duration across {test.runs} run(s)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <PassRateWidget projectId={projectId} />
                    <RecentRunsWidget projectId={projectId} />
                </div>
            </div>
        </div>
    );
}
