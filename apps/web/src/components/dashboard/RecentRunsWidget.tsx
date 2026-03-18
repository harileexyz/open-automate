import Link from 'next/link';
import { Card, CardHeader, Button, Badge } from '@/components/ui';
import { Activity, Clock, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useTestRuns } from '@/lib/hooks';
import { formatDistanceToNow } from 'date-fns';

interface RecentRunsWidgetProps {
    projectId: string;
}

export function RecentRunsWidget({ projectId }: RecentRunsWidgetProps) {
    const { testRuns, loading } = useTestRuns(projectId);
    const recentRuns = testRuns.slice(0, 5); // Show last 5 runs

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
            case 'running': return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader
                title="Recent Test Runs"
                description="Latest execution results"
                action={
                    <Link href={`/projects/${projectId}/test-runs`}>
                        <Button size="sm" variant="outline">
                            View All
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </Link>
                }
            />

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
            ) : recentRuns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-900/20 rounded-lg border border-dashed border-gray-800 m-4 mt-0">
                    <Activity className="w-8 h-8 text-gray-700 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No runs executed yet</p>
                    <p className="text-xs text-gray-600 max-w-[180px] mt-1">
                        Run your first test from the Test Cases page
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="divide-y divide-gray-800/50">
                        {recentRuns.map((run) => (
                            <Link
                                key={run.id}
                                href={`/projects/${projectId}/test-runs/${run.id}`}
                                className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-1.5 rounded-md bg-gray-950 border border-gray-800 ${run.status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                                        run.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : ''
                                        }`}>
                                        {getStatusIcon(run.status)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate group-hover:text-violet-400 transition-colors">
                                            {run.name || 'Untitled Run'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>
                                                {run.createdAt?.seconds
                                                    ? formatDistanceToNow(new Date(run.createdAt.seconds * 1000), { addSuffix: true })
                                                    : 'Just now'}
                                            </span>
                                            {run.type === 'suite' && (
                                                <Badge variant="info" className="text-[9px] px-1 py-0 h-4 min-w-[36px]">SUITE</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pl-2">
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
