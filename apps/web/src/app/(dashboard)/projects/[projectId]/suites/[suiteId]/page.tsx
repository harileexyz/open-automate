'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTestSuite, useTestCaseMutations, useTestRun, useProjectVariables, useProject } from '@/lib/hooks';
import { useAuth } from '@/lib/firebase';
import { canEditProject } from '@/lib/project-permissions';
import { useProjectContext } from '@/components/layout/ProjectProvider';
import type { TestCase } from '@/lib/hooks';
import { Card, Button, Input, Badge, Modal, ConfirmModal } from '@/components/ui';
import { TestCaseList } from '@/components/test-cases/TestCaseList';
import { TestCaseModals } from '@/components/test-cases/TestCaseModals';
import { DraftReviewList } from '@/components/test-cases/DraftReviewList';
import { ImportJSONModal } from '@/components/test-cases/ImportJSONModal';
import {
    ArrowLeft,
    Play,
    Plus,
    Trash2,
    Search,
    FileText,
    CheckCircle2,
    X,
    MoreHorizontal,
    Wand2,
    FileJson
} from 'lucide-react';
import { AIGenerateModal } from '@/components/suites/AIGenerateModal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function TestSuiteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const suiteId = params.suiteId as string;

    // Data Fetching
    const { suite, loading: suiteLoading } = useTestSuite(suiteId);
    const { project } = useProject(projectId);
    const { user } = useAuth();
    const isOwner = canEditProject(project, user);
    
    // Fetch ALL cases and suites from context
    const { testCases: allTestCases, suites, loadingCases } = useProjectContext();
    
    // Filter cases JUST for this suite
    const suiteTestCases = allTestCases.filter((tc) => tc.suiteIds?.includes(suiteId));

    // Mutations
    const { addToSuite, removeFromSuite, loading: mutationLoading, deleteTestCase, duplicateTestCase } = useTestCaseMutations();
    const { queueSuiteRun, queueTestRun, loading: runLoading } = useTestRun();
    const { variables } = useProjectVariables(projectId);
    const { updateTestCase } = useTestCaseMutations();


    // State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCasesToAdd, setSelectedCasesToAdd] = useState<string[]>([]);
    const [isRunningSuite, setIsRunningSuite] = useState(false);

    // Modal states for test cases
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null);
    const [selectedTestCase, setSelectedTestCase] = useState<any>(null);
    const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [testCaseToDelete, setTestCaseToDelete] = useState<string | null>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'drafts'>('active');

    // Run Modal States
    const [runModalOpen, setRunModalOpen] = useState(false);
    const [testCaseToRun, setTestCaseToRun] = useState<string | null>(null);
    const [runSuiteFlag, setRunSuiteFlag] = useState(false);
    const [recordVideo, setRecordVideo] = useState(false);

    // Separate drafts from active cases
    const draftTestCases = suiteTestCases.filter(tc => tc.status === 'draft');
    const activeTestCases = suiteTestCases.filter(tc => tc.status !== 'draft');

    // Filter available cases (those NOT in this suite)
    const availableTestCases = allTestCases.filter(
        tc => !tc.suiteIds?.includes(suiteId)
    ).filter(
        tc => tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tc.testId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddCases = async () => {
        if (!isOwner) {
            toast.error('Only project owners can manage suites');
            return;
        }
        if (selectedCasesToAdd.length === 0) return;

        try {
            await addToSuite(selectedCasesToAdd, suiteId);
            toast.success(`Added ${selectedCasesToAdd.length} test cases to suite`);
            setIsAddModalOpen(false);
            setSelectedCasesToAdd([]);
        } catch (error) {
            toast.error('Failed to add test cases');
        }
    };

    const handleRemoveCase = async (testCaseId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can manage suites');
            return;
        }
        try {
            await removeFromSuite([testCaseId], suiteId);
            toast.success('Removed test case from suite');
        } catch (error) {
            toast.error('Failed to remove test case');
        }
    };

    const handleRunTestClick = (testCaseId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can run tests');
            return;
        }
        setTestCaseToRun(testCaseId);
        setRunSuiteFlag(false);
        setRunModalOpen(true);
    };

    const handleDelete = async () => {
        if (!isOwner) {
            toast.error('Only project owners can manage test cases');
            return;
        }
        if (!testCaseToDelete) return;
        try {
            await deleteTestCase(testCaseToDelete);
            toast.success('Test case deleted');
            setDeleteModalOpen(false);
            setTestCaseToDelete(null);
        } catch (error) { toast.error('Failed to delete test case'); }
    };

    const handleDuplicate = async (testCaseId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can manage test cases');
            return;
        }
        try {
            await duplicateTestCase(testCaseId);
            toast.success('Test case duplicated');
        } catch (error) { toast.error('Failed to duplicate test case'); }
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

    const handleConfirmDraft = async (testCase: TestCase) => {
        if (!isOwner) {
            toast.error('Only project owners can approve drafts');
            return;
        }
        try {
            await updateTestCase(testCase.id, { status: 'active' });
            toast.success('Test case approved and made active');
        } catch (error) {
            toast.error('Failed to approve test case');
        }
    };


    const handleRunSuiteClick = () => {
        if (activeTestCases.length === 0) {
            toast.error('No active test cases in this suite');
            return;
        }
        if (!isOwner) {
            toast.error('Only project owners can run suites');
            return;
        }
        setRunSuiteFlag(true);
        setTestCaseToRun(null);
        setRunModalOpen(true);
    };

    const confirmRun = async () => {
        setRunModalOpen(false);
        if (runSuiteFlag) {
            setIsRunningSuite(true);
            try {
                await queueSuiteRun(
                    projectId,
                    suiteId,
                    suite?.name || 'Suite',
                    activeTestCases.map(tc => ({ id: tc.id, name: tc.name })),
                    { recordVideo }
                );
            } catch (error) {
                toast.error('Failed to queue suite run');
            } finally {
                setIsRunningSuite(false);
            }
        } else if (testCaseToRun) {
            const id = testCaseToRun;
            setRunningTests(prev => ({ ...prev, [id]: true }));
            try {
                await queueTestRun(projectId, id, undefined, { recordVideo });
            } finally {
                setRunningTests(prev => ({ ...prev, [id]: false }));
            }
        }
        setTestCaseToRun(null);
        setRunSuiteFlag(false);
    };

    const toggleCaseSelection = (id: string) => {
        setSelectedCasesToAdd(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    if (suiteLoading || loadingCases) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!suite) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h3 className="text-xl font-semibold text-white mb-2">Suite not found</h3>
                <Link href={`/projects/${projectId}/suites`}>
                    <Button variant="secondary">Go back to Suites</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link href={`/projects/${projectId}/suites`} className="text-gray-400 hover:text-white transition-colors">
                    Test Suites
                </Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">{suite.name}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{suite.name}</h1>
                    {suite.description && (
                        <p className="text-gray-400 mb-4 max-w-2xl">{suite.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                        {suite.tags.map(tag => (
                            <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isOwner ? (
                        <>
                            <Button
                                variant="outline"
                                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                onClick={() => setIsAIModalOpen(true)}
                            >
                                <Wand2 className="w-4 h-4 mr-2" />
                                AI Generate
                            </Button>
                            <Button
                                variant="outline"
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => setIsImportModalOpen(true)}
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                Import JSON
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Test Cases
                            </Button>
                            <Button
                                onClick={handleRunSuiteClick}
                                disabled={activeTestCases.length === 0 || isRunningSuite}
                                loading={isRunningSuite}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Play className="w-4 h-4 mr-2 fill-current" />
                                Run Suite
                            </Button>
                        </>
                    ) : (
                        <span className="text-xs text-gray-500">Viewer access</span>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-800">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'active'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            Active Test Cases
                            <Badge variant="default" className={`text-xs ${activeTab === 'active' ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                                {activeTestCases.length}
                            </Badge>
                        </span>
                        {activeTab === 'active' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('drafts')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'drafts'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            Drafts
                            {draftTestCases.length > 0 && (
                                <Badge variant="default" className={`text-xs ${activeTab === 'drafts' ? 'bg-amber-600' : 'bg-amber-600/50'}`}>
                                    {draftTestCases.length}
                                </Badge>
                            )}
                        </span>
                        {activeTab === 'drafts' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {/* Active Test Cases Tab */}
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeTestCases.length === 0 ? (
                            <Card className="py-12 border-dashed">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <h3 className="text-gray-300 font-medium mb-1">No active test cases</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {draftTestCases.length > 0
                                            ? 'Review and approve drafts to make them active'
                                            : 'Add existing test cases or import from AI'}
                                    </p>
                                    <div className="flex gap-2">
                                        {draftTestCases.length > 0 ? (
                                            <Button variant="secondary" onClick={() => setActiveTab('drafts')}>
                                                Review Drafts ({draftTestCases.length})
                                            </Button>
                                        ) : (
                                            isOwner && <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                                                Add Test Cases
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <TestCaseList
                                testCases={activeTestCases}
                                suites={suites}
                                onRun={handleRunTestClick}
                                onView={openViewModal}
                                onEdit={openEditModal}
                                onDuplicate={handleDuplicate}
                                onRemove={handleRemoveCase}
                                onDelete={(id) => {
                                    setTestCaseToDelete(id);
                                    setDeleteModalOpen(true);
                                }}
                                runningTests={runningTests}
                                showSuiteColumn={false}
                                canRun={isOwner}
                                canMutate={isOwner}
                            />
                        )}
                    </div>
                )}

                {/* Drafts Tab */}
                {activeTab === 'drafts' && (
                    <div className="space-y-4">
                        {draftTestCases.length === 0 ? (
                            <Card className="py-12 border-dashed">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <h3 className="text-gray-300 font-medium mb-1">No draft test cases</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        AI-generated or imported tests will appear here for review
                                    </p>
                                    {isOwner && (
                                        <Button
                                            variant="outline"
                                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                            onClick={() => setIsImportModalOpen(true)}
                                        >
                                            <FileJson className="w-4 h-4 mr-2" />
                                            Import from AI
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <DraftReviewList
                                drafts={draftTestCases}
                                onConfirm={handleConfirmDraft}
                                onDiscard={(id) => {
                                    setTestCaseToDelete(id);
                                    setDeleteModalOpen(true);
                                }}
                                onEdit={openEditModal}
                                onView={openViewModal}
                                canMutate={isOwner}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Add Test Cases Modal */}
            <Modal
                isOpen={isOwner && isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSelectedCasesToAdd([]);
                    setSearchQuery('');
                }}
                title="Add Test Cases to Suite"
                description="Select test cases to move into this suite."
            >
                <div className="space-y-4 max-h-[60vh] flex flex-col">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search test cases..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] border border-gray-800 rounded-lg p-2">
                        {availableTestCases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                                <p>No available test cases found.</p>
                            </div>
                        ) : (
                            availableTestCases.map(tc => {
                                const isSelected = selectedCasesToAdd.includes(tc.id);
                                return (
                                    <button
                                        key={tc.id}
                                        onClick={() => toggleCaseSelection(tc.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected
                                            ? 'bg-violet-500/10 border-violet-500/50'
                                            : 'bg-gray-800/30 border-transparent hover:bg-gray-800/80 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-200">{tc.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{tc.testId}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-800 flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCases}
                            disabled={selectedCasesToAdd.length === 0}
                            loading={mutationLoading}
                        >
                            Add {selectedCasesToAdd.length} Cases
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reusable Modals */}
            {isOwner && <TestCaseModals
                mode={modalMode}
                testCase={selectedTestCase}
                projectId={projectId}
                suites={suites}
                variables={variables}
                onClose={() => setModalMode(null)}
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

            {isOwner && <AIGenerateModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                projectId={projectId}
                suiteId={suiteId}
            />}

            {isOwner && <ImportJSONModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                projectId={projectId}
                suiteId={suiteId}
            />}

            {/* Run Options Modal */}
            <Modal
                isOpen={isOwner && runModalOpen}
                onClose={() => { setRunModalOpen(false); setTestCaseToRun(null); setRunSuiteFlag(false); }}
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
                        <Button variant="outline" onClick={() => { setRunModalOpen(false); setTestCaseToRun(null); setRunSuiteFlag(false); }}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRun}>
                            <Play className="w-4 h-4 mr-1.5" /> Start Execution
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
