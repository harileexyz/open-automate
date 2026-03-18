import { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui';
import { useTestRuns } from '@/lib/hooks';
import { PieChart, CheckCircle, XCircle } from 'lucide-react';

interface PassRateWidgetProps {
    projectId: string;
}

export function PassRateWidget({ projectId }: PassRateWidgetProps) {
    const { testRuns, loading } = useTestRuns(projectId);

    const stats = useMemo(() => {
        if (!testRuns.length) return null;

        const completedRuns = testRuns.filter(r => r.status === 'completed' || r.status === 'failed');
        if (!completedRuns.length) return null;

        const passed = completedRuns.filter(r => r.status === 'completed').length;
        const total = completedRuns.length;
        const rate = Math.round((passed / total) * 100);

        return {
            passed,
            failed: total - passed,
            total,
            rate
        };
    }, [testRuns]);

    const getRateColor = (rate: number) => {
        if (rate >= 90) return 'text-emerald-400';
        if (rate >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRingColor = (rate: number) => {
        if (rate >= 90) return 'stroke-emerald-500';
        if (rate >= 70) return 'stroke-yellow-500';
        return 'stroke-red-500';
    };

    if (loading) {
        return (
            <Card className="h-full min-h-[200px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className="h-48 flex flex-col items-center justify-center text-center p-6">
                <PieChart className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No sufficient data</p>
                <p className="text-xs text-gray-600">Run some tests to see pass rates</p>
            </Card>
        );
    }

    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (stats.rate / 100) * circumference;

    return (
        <Card>
            <CardHeader
                title="Pass Rate"
                description="Based on all completed runs"
            />

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between px-2 py-4 gap-6">
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center">
                    <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                            className="text-gray-800"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                        <circle
                            className={`${getRingColor(stats.rate)} transition-all duration-1000 ease-out`}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-3xl font-bold ${getRateColor(stats.rate)}`}>
                            {stats.rate}%
                        </span>
                    </div>
                </div>

                {/* Legend / details */}
                <div className="flex-1 pl-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Passed</span>
                        </div>
                        <span className="font-medium text-white">{stats.passed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Failed</span>
                        </div>
                        <span className="font-medium text-white">{stats.failed}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                        <span>Total Runs</span>
                        <span>{stats.total}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
