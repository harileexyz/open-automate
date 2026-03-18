'use client';
// Client component page; Next.js revalidate must only be used in server components.

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    useProject,
    useTestRun,
    useTestCaseMutations,
    useProjectVariables
} from '@/lib/hooks';
import { useAuth } from '@/lib/firebase';
import { canEditProject } from '@/lib/project-permissions';
import { useProjectContext } from '@/components/layout/ProjectProvider';
import { Card, Button, Input, Badge, Modal, ConfirmModal, Select as UISelect } from '@/components/ui';
import { StepEditor } from '@/components/forms/StepEditor';
import { TestCaseList } from '@/components/test-cases/TestCaseList';
import dynamic from 'next/dynamic';
const TestCaseModals = dynamic(
    () => import('@/components/test-cases/TestCaseModals').then(m => m.TestCaseModals),
    { ssr: false }
);
import {
    ChevronRight,
    Plus,
    FileCheck,
    Search,
    Pencil,
    Trash2,
    Copy,
    Play,
    Layers,
    X,
    Activity,
    ExternalLink,
    CheckSquare,
    FolderInput,
    AlertCircle,
    Info,
    Terminal,
    ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { TestCase, TestStep } from '@/lib/hooks';

const PRIORITIES = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
] as const;

export default function TestCasesPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params.projectId as string;
    const suiteFilterParam = searchParams.get('suite');
    const { project } = useProject(projectId);
    const { user } = useAuth();
    const { suites, testCases, loadingCases, loadingSuites } = useProjectContext();
    const contextLoading = loadingCases || loadingSuites;
    const { createTestCase, updateTestCase, deleteTestCase, duplicateTestCase, bulkDeleteTestCases, batchMoveToSuite, loading: mutationLoading } = useTestCaseMutations();
    const { queueTestRun } = useTestRun();
    const { variables } = useProjectVariables(projectId);
    const isOwner = canEditProject(project, user);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(suiteFilterParam);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    // Modal states
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null);
    const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [testCaseToDelete, setTestCaseToDelete] = useState<string | null>(null);
    const [runModalOpen, setRunModalOpen] = useState(false);
    const [testCaseToRun, setTestCaseToRun] = useState<string | null>(null);
    const [recordVideo, setRecordVideo] = useState(false);

    // Batch operations state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
    const [batchMoveModalOpen, setBatchMoveModalOpen] = useState(false);
    const [moveTargetSuiteId, setMoveTargetSuiteId] = useState<string>('');

    const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});

    const handleRunTestClick = (testCaseId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can run tests');
            return;
        }
        setTestCaseToRun(testCaseId);
        setRunModalOpen(true);
    };

    const confirmRunTest = async () => {
        if (!testCaseToRun) return;
        const id = testCaseToRun;
        setRunModalOpen(false);
        setTestCaseToRun(null);

        setRunningTests(prev => ({ ...prev, [id]: true }));
        try {
            await queueTestRun(projectId, id, undefined, { recordVideo });
        } finally {
            setRunningTests(prev => ({ ...prev, [id]: false }));
        }
    };

    const resetState = () => {
        setSelectedTestCase(null);
        setModalMode(null);
    };

    const openViewModal = (testCase: TestCase) => {
        setSelectedTestCase(testCase);
        setModalMode('view');
    };

    const openEditModal = (testCase: TestCase) => {
        if (!isOwner) return;
        setSelectedTestCase(testCase);
        setModalMode('edit');
    };

    const openCreateModal = () => {
        if (!isOwner) return;
        setSelectedTestCase(null);
        setModalMode('create');
    };

    const filteredTestCases = testCases.filter((tc) => {
        if (tc.status === 'draft') return false; // Hide drafts from the main list
        const matchesSearch =
            tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tc.testId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tc.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = !priorityFilter || tc.priority === priorityFilter;
        const effectiveSuiteIds: string[] = tc.suiteIds || ((tc as any).suiteId ? [(tc as any).suiteId] : []);
        const matchesSelectedSuite = !selectedSuiteId || effectiveSuiteIds.includes(selectedSuiteId);
        const matchesUrlFilter = !suiteFilterParam || effectiveSuiteIds.includes(suiteFilterParam);
        return matchesSearch && matchesPriority && matchesSelectedSuite && matchesUrlFilter;
    });

    const handleDelete = async () => {
        if (!testCaseToDelete) return;
        try {
            await deleteTestCase(testCaseToDelete);
            toast.success('Test case deleted');
            setDeleteModalOpen(false);
            setTestCaseToDelete(null);
        } catch (error) { toast.error('Failed to delete test case'); }
    };

    const handleDuplicate = async (testCaseId: string) => {
        try {
            await duplicateTestCase(testCaseId);
            toast.success('Test case duplicated');
        } catch (error) { toast.error('Failed to duplicate test case'); }
    };

    // Batch operation handlers
    // Removed duplicate earlier batch handlers in favor of consolidated versions below

    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectedIds(new Set());
        }
        setSelectionMode(!selectionMode);
    };

    // Batch handlers
    const handleBatchDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        try {
            await bulkDeleteTestCases(ids);
            toast.success(`Deleted ${ids.length} test case(s)`);
            setSelectedIds(new Set());
            setBatchDeleteModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete selected test cases');
        }
    };

    const handleBatchMove = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0 || !moveTargetSuiteId) return;
        try {
            await batchMoveToSuite(ids, moveTargetSuiteId);
            toast.success(`Moved ${ids.length} test case(s) to selected suite`);
            setSelectedIds(new Set());
            setMoveTargetSuiteId('');
            setBatchMoveModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to move selected test cases');
        }
    };

    // These functions are now handled internally by TestCaseModals or TestCaseList
    // const addTag = () => {
    //     const tag = tagInput.trim().toLowerCase();
    //     if (tag && !formTags.includes(tag)) {
    //         setFormTags([...formTags, tag]);
    //         setTagInput('');
    //     }
    // };

    // const removeTag = (tag: string) => { setFormTags(formTags.filter((t) => t !== tag)); };

    // getSuiteName and getPriorityBadge are used by TestCaseList, so they should remain.
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

    if (contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">Projects</Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-white transition-colors">{project?.name || 'Project'}</Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white">Test Cases</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Test Cases</h1>
                    <p className="text-gray-400 text-sm">{filteredTestCases.length} total cases</p>
                </div>
                <div className="flex gap-2">
                    {isOwner && (
                        <>
                            <Button
                                variant={selectionMode ? "primary" : "outline"}
                                size="sm"
                                onClick={toggleSelectionMode}
                            >
                                <CheckSquare className="w-4 h-4 mr-1.5" />
                                {selectionMode ? 'Exit Select' : 'Select'}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={openCreateModal}>
                                <Plus className="w-4 h-4 mr-1.5" /> New Case
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filtering */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search by name, ID or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
                <UISelect
                    value={selectedSuiteId || ''}
                    onChange={(e) => setSelectedSuiteId(e.target.value || null)}
                    options={[{ label: 'All Suites', value: '' }, ...suites.map(s => ({ label: s.name, value: s.id }))]}
                    className="h-9 text-xs"
                />
                <UISelect
                    value={priorityFilter || ''}
                    onChange={(e) => setPriorityFilter(e.target.value || null)}
                    options={[{ label: 'All Priorities', value: '' }, ...PRIORITIES.map(p => ({ label: p.label, value: p.value }))]}
                    className="h-9 text-xs"
                />
            </div>

            {/* Batch Action Bar */}
            {isOwner && selectionMode && selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                    <span className="text-sm text-violet-300 font-medium">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchMoveModalOpen(true)}
                        className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                    >
                        <FolderInput className="w-4 h-4 mr-1.5" /> Move to Suite
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchDeleteModalOpen(true)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                    </Button>
                </div>
            )}

            {/* Compact List */}
            {testCases.length === 0 ? (
                <Card className="py-20 text-center bg-gray-900/20 border-dashed">
                    <FileCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No test cases yet</h3>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">Start by creating your first automated test case.</p>
                    {isOwner && <Button onClick={openCreateModal}>Create First Case</Button>}
                </Card>
            ) : (
                <TestCaseList
                    testCases={filteredTestCases}
                    suites={suites}
                    onRun={handleRunTestClick}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDuplicate={handleDuplicate}
                    onDelete={(id) => {
                        setTestCaseToDelete(id);
                        setDeleteModalOpen(true);
                    }}
                    runningTests={runningTests}
                    selectionEnabled={isOwner && selectionMode}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    canRun={isOwner}
                    canMutate={isOwner}
                />
            )}

            {/* Reusable Modals */}
            {isOwner && <TestCaseModals
                mode={modalMode}
                testCase={selectedTestCase}
                projectId={projectId}
                suites={suites}
                variables={variables}
                onClose={resetState}
            />}

            <ConfirmModal
                isOpen={isOwner && deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setTestCaseToDelete(null); }}
                onConfirm={handleDelete}
                title="Delete Test Case"
                description="Permanent action. Continue?"
                confirmText="Delete"
                loading={mutationLoading}
            />

            {/* Batch Delete Modal */}
            <ConfirmModal
                isOpen={isOwner && batchDeleteModalOpen}
                onClose={() => setBatchDeleteModalOpen(false)}
                onConfirm={handleBatchDelete}
                title="Delete Selected Test Cases"
                description={`You are about to delete ${selectedIds.size} test cases. This action cannot be undone.`}
                confirmText="Delete All"
                loading={mutationLoading}
            />

            {/* Batch Move Modal */}
            <Modal
                isOpen={isOwner && batchMoveModalOpen}
                onClose={() => { setBatchMoveModalOpen(false); setMoveTargetSuiteId(''); }}
                title="Move to Suite"
            >
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">
                        Move {selectedIds.size} test case(s) to a different suite.
                    </p>
                    <UISelect
                        value={moveTargetSuiteId}
                        onChange={(e) => setMoveTargetSuiteId(e.target.value)}
                        options={[
                            { label: 'Select a suite...', value: '' },
                            ...suites.map(s => ({ label: s.name, value: s.id }))
                        ]}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setBatchMoveModalOpen(false); setMoveTargetSuiteId(''); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBatchMove}
                            disabled={!moveTargetSuiteId}
                            loading={mutationLoading}
                        >
                            Move
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Run Options Modal */}
            <Modal
                isOpen={isOwner && runModalOpen}
                onClose={() => { setRunModalOpen(false); setTestCaseToRun(null); }}
                title="Run Options"
            >
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">
                        Configure execution settings for this test run. Playwright execution traces are generated automatically.
                    </p>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors">
                        <div className="flex items-center h-5">
                            <input
                                type="checkbox"
                                checked={recordVideo}
                                onChange={(e) => setRecordVideo(e.target.checked)}
                                className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">Enable Video Recording</h4>
                            <p className="text-xs text-gray-400">Records a viewable video of the entire execution (slightly increases time).</p>
                        </div>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setRunModalOpen(false); setTestCaseToRun(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRunTest}>
                            <Play className="w-4 h-4 mr-1.5" /> Start Execution
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
