'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProject, useTestSuiteMutations } from '@/lib/hooks';
import { useAuth } from '@/lib/firebase';
import { canEditProject } from '@/lib/project-permissions';
import { useProjectContext } from '@/components/layout/ProjectProvider';
import { Card, Button, Input, Badge, Modal, ConfirmModal } from '@/components/ui';
import {
    Layers,
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    FileCheck,
    X,
    FolderKanban,
    Activity,
    Info,
    Calendar,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { TestSuite } from '@/lib/hooks';
import { AIGenerateModal } from '@/components/suites/AIGenerateModal';
import { Wand2 } from 'lucide-react';

export default function TestSuitesPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const { project } = useProject(projectId);
    const { user } = useAuth();
    const { suites, testCases, loadingSuites } = useProjectContext();
    const loading = loadingSuites;
    const { createTestSuite, updateTestSuite, deleteTestSuite, reorderSuites, loading: mutationLoading } = useTestSuiteMutations();
    const isOwner = canEditProject(project, user);

    const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [suiteToDelete, setSuiteToDelete] = useState<string | null>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formTags, setFormTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormTags([]);
        setTagInput('');
    };

    const openEditModal = (suite: TestSuite) => {
        setSelectedSuite(suite);
        setFormName(suite.name);
        setFormDescription(suite.description || '');
        setFormTags(suite.tags);
        setIsEditModalOpen(true);
    };

    const handleCreate = async () => {
        if (!formName.trim()) { toast.error('Suite name is required'); return; }
        if (!isOwner) { toast.error('Only project owners can manage suites'); return; }
        try {
            await createTestSuite({ projectId, name: formName.trim(), description: formDescription.trim(), tags: formTags });
            toast.success('Test suite created');
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) { toast.error('Failed to create test suite'); }
    };

    const handleUpdate = async () => {
        if (!selectedSuite || !formName.trim()) return;
        if (!isOwner) { toast.error('Only project owners can manage suites'); return; }
        try {
            await updateTestSuite(selectedSuite.id, { name: formName.trim(), description: formDescription.trim(), tags: formTags });
            toast.success('Test suite updated');
            setIsEditModalOpen(false);
            setSelectedSuite(null);
            resetForm();
        } catch (error) { toast.error('Failed to update test suite'); }
    };

    const handleDelete = async () => {
        if (!suiteToDelete) return;
        if (!isOwner) { toast.error('Only project owners can manage suites'); return; }
        try {
            await deleteTestSuite(suiteToDelete);
            toast.success('Test suite deleted');
            setDeleteModalOpen(false);
            setSuiteToDelete(null);
        } catch (error) { toast.error('Failed to delete test suite'); }
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formTags.includes(tag)) {
            setFormTags([...formTags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => { setFormTags(formTags.filter((t) => t !== tag)); };

    const moveSuite = async (suiteId: string, direction: 'up' | 'down') => {
        if (!isOwner) {
            toast.error('Only project owners can reorder suites');
            return;
        }

        const currentIndex = suites.findIndex((suite) => suite.id === suiteId);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= suites.length) {
            return;
        }

        const reordered = [...suites];
        const [movedSuite] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, movedSuite);

        try {
            await reorderSuites(reordered.map((suite, index) => ({ id: suite.id, order: index })));
            toast.success('Suite order updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update suite order');
        }
    };

    const getTestCaseCount = (suiteId: string) => {
        return testCases.filter((tc) => tc.suiteIds?.includes(suiteId)).length;
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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">Projects</Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-white transition-colors">{project?.name || 'Project'}</Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white">Test Suites</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Test Suites</h1>
                    <p className="text-gray-400 text-sm">{suites.length} total suites</p>
                </div>
                <div className="flex gap-2">
                    {isOwner && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                onClick={() => setIsAIModalOpen(true)}
                            >
                                <Wand2 className="w-4 h-4 mr-1.5" /> AI Generate
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1.5" /> New Suite
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Compact List */}
            {suites.length === 0 ? (
                <Card className="py-20 text-center bg-gray-900/20 border-dashed">
                    <Layers className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No suites yet</h3>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">Group your tests by feature or module.</p>
                    {isOwner && <Button onClick={() => setIsCreateModalOpen(true)}>Create First Suite</Button>}
                </Card>
            ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-800 bg-gray-800/30 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-5">Suite Name</div>
                        <div className="col-span-2 text-center">Test Cases</div>
                        <div className="col-span-2">Tags</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-800">
                        {suites.map((suite) => (
                            <div
                                key={suite.id}
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-gray-800/40 transition-colors group text-sm"
                            >
                                <div className="col-span-5">
                                    <Link
                                        href={`/projects/${projectId}/suites/${suite.id}`}
                                        className="font-medium text-gray-200 hover:text-violet-400 transition-colors block truncate"
                                    >
                                        {suite.name}
                                    </Link>
                                    {suite.description && (
                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{suite.description}</p>
                                    )}
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">
                                        <FileCheck className="w-3 h-3" /> {getTestCaseCount(suite.id)}
                                    </span>
                                </div>
                                <div className="col-span-2 truncate flex gap-1">
                                    {suite.tags.slice(0, 2).map(tag => (
                                        <Badge key={tag} variant="default" className="text-[9px] px-1.5 h-4">{tag}</Badge>
                                    ))}
                                    {suite.tags.length > 2 && <span className="text-[10px] text-gray-600">+{suite.tags.length - 2}</span>}
                                </div>
                                <div className="col-span-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/projects/${projectId}/suites/${suite.id}`}>
                                            <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] border-violet-500/20 text-violet-400 hover:bg-violet-500/10">
                                                Open Suite
                                            </Button>
                                        </Link>
                                        {isOwner && (
                                            <>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveSuite(suite.id, 'up')} disabled={mutationLoading || suites[0]?.id === suite.id}>
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveSuite(suite.id, 'down')} disabled={mutationLoading || suites[suites.length - 1]?.id === suite.id}>
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditModal(suite)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500/50 hover:text-red-400" onClick={() => {
                                                setSuiteToDelete(suite.id);
                                                setDeleteModalOpen(true);
                                            }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={isOwner && (isCreateModalOpen || isEditModalOpen)}
                onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); setSelectedSuite(null); resetForm(); }}
                title={isEditModalOpen ? 'Edit Test Suite' : 'Create Test Suite'}
            >
                <div className="space-y-4">
                    <Input label="Suite Name" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Authentication" className="h-9" />
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            value={formDescription}
                            onChange={e => setFormDescription(e.target.value)}
                            placeholder="Briefly describe what this suite covers..."
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 min-h-[80px] focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tags</label>
                        <div className="flex gap-2">
                            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className="h-9" />
                            <Button variant="secondary" size="sm" onClick={addTag} className="h-9">Add</Button>
                        </div>
                        <div className="flex gap-1.5 mt-2 flex-wrap min-h-[24px]">
                            {formTags.map(tag => (
                                <Badge key={tag} variant="info" className="text-[10px]">
                                    {tag}
                                    <X className="w-2.5 h-2.5 ml-1 cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-800">
                        <Button className="flex-1 h-9" loading={mutationLoading} onClick={isEditModalOpen ? handleUpdate : handleCreate}>
                            {isEditModalOpen ? 'Save Changes' : 'Create Suite'}
                        </Button>
                        <Button variant="outline" className="h-9" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isOwner && deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setSuiteToDelete(null); }}
                onConfirm={handleDelete}
                title="Delete Test Suite"
                description="Permanent action. Continue?"
                confirmText="Delete"
                loading={mutationLoading}
            />

            <AIGenerateModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                projectId={projectId}
            />
        </div>
    );
}
