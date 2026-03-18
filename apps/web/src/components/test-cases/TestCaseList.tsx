'use client';

import { Play, Pencil, Copy, Trash2, X, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { TestCase, TestSuite } from '@/lib/hooks';

interface TestCaseListProps {
    testCases: TestCase[];
    suites: TestSuite[];
    onRun: (id: string) => void;
    onView: (tc: TestCase) => void;
    onEdit: (tc: TestCase) => void;
    onDuplicate?: (id: string) => void;
    onDelete?: (id: string) => void;
    onRemove?: (id: string) => void;
    runningTests?: Record<string, boolean>;
    showSuiteColumn?: boolean;
    // Batch selection props
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    selectionEnabled?: boolean;
    canRun?: boolean;
    canMutate?: boolean;
}

export function TestCaseList({
    testCases,
    suites,
    onRun,
    onView,
    onEdit,
    onDuplicate,
    onDelete,
    onRemove,
    runningTests = {},
    showSuiteColumn = true,
    selectedIds = new Set(),
    onSelectionChange,
    selectionEnabled = false,
    canRun = true,
    canMutate = true,
}: TestCaseListProps) {
    const allSelected = testCases.length > 0 && testCases.every(tc => selectedIds.has(tc.id));
    const someSelected = testCases.some(tc => selectedIds.has(tc.id));

    const toggleAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(testCases.map(tc => tc.id)));
        }
    };

    const toggleOne = (id: string) => {
        if (!onSelectionChange) return;
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onSelectionChange(newSet);
    };
    const getSuiteName = (ids: string[] | string | undefined) => {
        if (!ids) return '-';
        const idArray = Array.isArray(ids) ? ids : [ids];
        if (idArray.length === 0) return '-';
        const names = idArray.map(id => suites.find(s => s.id === id)?.name).filter(Boolean);
        return names.length > 0 ? names.join(', ') : '-';
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return <Badge variant="danger" className="text-[10px] px-1.5 py-0">Critical</Badge>;
            case 'high': return <Badge variant="warning" className="text-[10px] px-1.5 py-0">High</Badge>;
            case 'medium': return <Badge variant="info" className="text-[10px] px-1.5 py-0">Medium</Badge>;
            default: return <Badge variant="default" className="text-[10px] px-1.5 py-0">Low</Badge>;
        }
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className={`grid ${selectionEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-4 px-4 py-2 border-b border-gray-800 bg-gray-800/30 text-[10px] font-bold text-gray-500 uppercase tracking-wider`}>
                {selectionEnabled && (
                    <div className="col-span-1 flex items-center">
                        <button
                            onClick={toggleAll}
                            className="text-gray-400 hover:text-violet-400 transition-colors"
                        >
                            {allSelected ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : someSelected ? (
                                <MinusSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}
                <div className="col-span-1">ID</div>
                <div className={showSuiteColumn ? "col-span-4" : "col-span-5"}>Test Case Name</div>
                {showSuiteColumn && <div className="col-span-2">Suite</div>}
                <div className="col-span-1">Priority</div>
                <div className="col-span-1 text-center">Steps</div>
                <div className={selectionEnabled ? "col-span-2 text-right" : "col-span-3 text-right"}>Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800">
                {testCases.map((tc) => {
                    const isSelected = selectedIds.has(tc.id);
                    return (
                        <div
                            key={tc.id}
                            className={`grid ${selectionEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-4 px-4 py-2 items-center hover:bg-gray-800/40 transition-colors group text-sm ${isSelected ? 'bg-violet-500/10' : ''}`}
                        >
                            {selectionEnabled && (
                                <div className="col-span-1 flex items-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleOne(tc.id); }}
                                        className="text-gray-400 hover:text-violet-400 transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-4 h-4 text-violet-400" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            )}
                            <div className="col-span-1 font-mono text-[10px] text-violet-400 font-bold">
                                {tc.testId || tc.id.substring(0, 4)}
                            </div>
                            <div
                                className={`${showSuiteColumn ? "col-span-4" : "col-span-5"} font-medium text-gray-200 truncate cursor-pointer hover:text-violet-400`}
                                onClick={() => onView(tc)}
                            >
                                {tc.name}
                            </div>
                            {showSuiteColumn && (
                                <div className="col-span-2 text-xs text-gray-500 truncate">
                                    {getSuiteName(tc.suiteIds)}
                                </div>
                            )}
                            <div className="col-span-1">
                                {getPriorityBadge(tc.priority)}
                            </div>
                            <div className="col-span-1 text-center">
                                <span className="text-xs text-gray-500">{tc.steps?.length || 0}</span>
                            </div>
                            <div className={`${selectionEnabled ? 'col-span-2' : 'col-span-3'} flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={(e) => { e.stopPropagation(); onRun(tc.id); }}
                                    loading={runningTests[tc.id]}
                                    disabled={!canRun}
                                >
                                    <Play className="w-3 h-3 mr-1" /> Run
                                </Button>
                                {canMutate && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onEdit(tc); }}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                {canMutate && onDuplicate && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onDuplicate(tc.id); }}>
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                {canMutate && onRemove && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-orange-500/50 hover:text-orange-400"
                                        onClick={(e) => { e.stopPropagation(); onRemove(tc.id); }}
                                        title="Remove from suite"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                {canMutate && onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-500/50 hover:text-red-400"
                                        onClick={(e) => { e.stopPropagation(); onDelete(tc.id); }}
                                        title="Delete test case"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
