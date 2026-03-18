
import { Button, Badge } from '@/components/ui';
import { TestCase } from '@/lib/hooks/useTestCases';
import {
    CheckCircle2,
    XCircle,
    Pencil,
    Eye,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface DraftReviewListProps {
    drafts: TestCase[];
    onConfirm: (testCase: TestCase) => void;
    onDiscard: (testCaseId: string) => void;
    onEdit: (testCase: TestCase) => void;
    onView: (testCase: TestCase) => void;
    canMutate?: boolean;
}

export function DraftReviewList({
    drafts,
    onConfirm,
    onDiscard,
    onEdit,
    onView,
    canMutate = true,
}: DraftReviewListProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (drafts.length === 0) return null;

    return (
        <div className="border border-violet-500/30 bg-violet-500/5 rounded-xl overflow-hidden mb-8">
            <div
                className="flex items-center justify-between px-4 py-3 bg-violet-500/10 cursor-pointer hover:bg-violet-500/15 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-violet-100 uppercase tracking-wider">
                        AI Drafts for Review
                    </h3>
                    <Badge variant="info" className="ml-1 bg-violet-500/20 text-violet-300 border-violet-500/30">
                        {drafts.length}
                    </Badge>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-violet-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-violet-400" />
                )}
            </div>

            {isExpanded && (
                <div className="divide-y divide-violet-500/10">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-violet-500/5 transition-colors">
                            <div className="col-span-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-200">{draft.name}</span>
                                    {draft.tags?.includes('ai-generated') && (
                                        <Badge className="bg-violet-500/20 text-violet-300 text-[10px] px-1.5 h-4">
                                            AI
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 truncate pr-4">
                                    {draft.description || 'No description'}
                                </p>
                                <div className="mt-1 flex gap-2">
                                    <span className="text-[10px] text-gray-500 bg-gray-900/50 px-1.5 rounded">
                                        {draft.steps.length} steps
                                    </span>
                                </div>
                            </div>

                            <div className="col-span-4 flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onView(draft)}
                                    title="View details"
                                >
                                    <Eye className="w-4 h-4 text-gray-400" />
                                </Button>
                                {canMutate && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onEdit(draft)}
                                            title="Edit steps"
                                        >
                                            <Pencil className="w-4 h-4 text-gray-400" />
                                        </Button>
                                        <div className="w-px h-4 bg-gray-700 mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                            onClick={() => onDiscard(draft.id)}
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Discard
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => onConfirm(draft)}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
