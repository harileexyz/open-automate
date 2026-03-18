'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProject, useProjectMutations } from '@/lib/hooks';
import { useAuth } from '@/lib/firebase';
import { canEditProject } from '@/lib/project-permissions';
import { useProjectContext } from '@/components/layout/ProjectProvider';
import { Card, CardHeader, Button, Input, Badge, ConfirmModal } from '@/components/ui';
import {
    ArrowLeft,
    FolderKanban,
    Globe,
    Settings,
    Layers,
    FileCheck,
    Play,
    Plus,
    Trash2,
    ExternalLink,
    Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RecentRunsWidget } from '@/components/dashboard/RecentRunsWidget';
import { PassRateWidget } from '@/components/dashboard/PassRateWidget';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const { project, loading } = useProject(projectId);
    const { user } = useAuth();
    const { updateProject, deleteProject, loading: mutationLoading } = useProjectMutations();
    const { suites, testCases } = useProjectContext();
    const validTestCases = testCases.filter(tc => tc.status !== 'draft');
    const isOwner = canEditProject(project, user);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Update form when project loads
    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
            setBaseUrl(project.baseUrl);
        }
    }, [project]);

    const handleSave = async () => {
        try {
            await updateProject(projectId, {
                name: name.trim(),
                description: description.trim(),
                baseUrl: baseUrl.trim(),
            });
            toast.success('Project updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update project');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProject(projectId);
            toast.success('Project deleted');
            router.push('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
                <p className="text-gray-400 mb-4">This project may have been deleted</p>
                <Link href="/projects">
                    <Button variant="outline">Back to Projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Link */}
            <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
            </Link>

            {/* Project Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                        <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        {isEditing ? (
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-xl font-bold mb-2"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                        )}
                        <div className="flex items-center gap-2 text-gray-400 mt-1">
                            <Globe className="w-4 h-4" />
                            {isEditing ? (
                                <Input
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    className="text-sm"
                                />
                            ) : (
                                <a
                                    href={project.baseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-violet-400 transition-colors flex items-center gap-1"
                                >
                                    {project.baseUrl}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isOwner && isEditing ? (
                        <>
                            <Button onClick={handleSave} loading={mutationLoading}>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </>
                    ) : isOwner ? (
                        <>
                            <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                <Settings className="w-4 h-4" />
                                Edit
                            </Button>
                            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        </>
                    ) : (
                        <span className="text-xs text-gray-500">Viewer access</span>
                    )}
                </div>
            </div>

            {/* Description */}
            {isEditing ? (
                <Card padding="sm">
                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 min-h-[100px] resize-none"
                        placeholder="Describe your project..."
                    />
                </Card>
            ) : (
                project.description && (
                    <p className="text-gray-400">{project.description}</p>
                )
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Layers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{suites.length}</p>
                            <p className="text-sm text-gray-400">Test Suites</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                            <FileCheck className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{validTestCases.length}</p>
                            <p className="text-sm text-gray-400">Test Cases</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Play className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-sm text-gray-400">Test Runs</p>
                        </div>
                    </div>
                </Card>
            </div>
            {/* Dashboard Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions (Moved here) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Test Suites */}
                        <Card>
                            <CardHeader
                                title="Test Suites"
                                description={`${suites.length} suite${suites.length !== 1 ? 's' : ''}`}
                                action={
                                    isOwner ? (
                                        <Link href={`/projects/${projectId}/suites`}>
                                            <Button size="sm">
                                                <Plus className="w-4 h-4" />
                                                Add Suite
                                            </Button>
                                        </Link>
                                    ) : undefined
                                }
                            />

                            {suites.length === 0 ? (
                                <div className="text-center py-8">
                                    <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No test suites yet</p>
                                    <Link href={`/projects/${projectId}/suites`}>
                                        <Button variant="ghost" size="sm" className="mt-2">
                                            Create your first suite
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {suites.slice(0, 5).map((suite) => (
                                        <Link
                                            key={suite.id}
                                            href={`/projects/${projectId}/suites?selected=${suite.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Layers className="w-4 h-4 text-gray-500" />
                                                <span className="text-white">{suite.name}</span>
                                            </div>
                                            {suite.tags.length > 0 && (
                                                <div className="flex gap-1">
                                                    {suite.tags.slice(0, 2).map((tag) => (
                                                        <Badge key={tag} variant="default">{tag}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                    {suites.length > 5 && (
                                        <Link href={`/projects/${projectId}/suites`}>
                                            <Button variant="ghost" size="sm" className="w-full">
                                                View all {suites.length} suites
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Test Cases */}
                        <Card>
                            <CardHeader
                                title="Test Cases"
                                description={`${validTestCases.length} test case${validTestCases.length !== 1 ? 's' : ''}`}
                                action={
                                    <Link href={`/projects/${projectId}/test-cases`}>
                                        <Button size="sm">
                                            <Plus className="w-4 h-4" />
                                            Add Test
                                        </Button>
                                    </Link>
                                }
                            />

                            {validTestCases.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No test cases yet</p>
                                    <Link href={`/projects/${projectId}/test-cases`}>
                                        <Button variant="ghost" size="sm" className="mt-2">
                                            Create your first test
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {validTestCases.slice(0, 5).map((tc) => (
                                        <Link
                                            key={tc.id}
                                            href={`/projects/${projectId}/test-cases?selected=${tc.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileCheck className="w-4 h-4 text-gray-500" />
                                                <span className="text-white">{tc.name}</span>
                                            </div>
                                            <Badge
                                                variant={
                                                    tc.priority === 'critical' ? 'danger' :
                                                        tc.priority === 'high' ? 'warning' :
                                                            tc.priority === 'medium' ? 'info' : 'default'
                                                }
                                            >
                                                {tc.priority}
                                            </Badge>
                                        </Link>
                                    ))}
                                    {validTestCases.length > 5 && (
                                        <Link href={`/projects/${projectId}/test-cases`}>
                                            <Button variant="ghost" size="sm" className="w-full">
                                                View all {validTestCases.length} test cases
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6">
                    <PassRateWidget projectId={projectId} />
                    <RecentRunsWidget projectId={projectId} />
                </div>
            </div>

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Project"
                description="Are you sure you want to delete this project? This will also delete all test suites, test cases, and results. This action cannot be undone."
                confirmText="Delete Project"
                loading={mutationLoading}
            />
        </div>
    );
}
