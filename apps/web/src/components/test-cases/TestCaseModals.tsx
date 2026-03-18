'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Badge, Select as UISelect } from '@/components/ui';
import { StepEditor } from '@/components/forms/StepEditor';
import { Pencil, Layers, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TestCase, TestStep, TestSuite } from '@/lib/hooks';
import { useTestCaseMutations } from '@/lib/hooks';

interface TestCaseModalsProps {
    mode: 'view' | 'edit' | 'create' | null;
    testCase: TestCase | null;
    projectId: string;
    suites: TestSuite[];
    variables: any[];
    onClose: () => void;
    onSuccess?: () => void;
}

const PRIORITIES = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
] as const;

export function TestCaseModals({
    mode,
    testCase,
    projectId,
    suites,
    variables,
    onClose,
    onSuccess
}: TestCaseModalsProps) {
    const { createTestCase, updateTestCase, loading: mutationLoading } = useTestCaseMutations();

    const [formTestId, setFormTestId] = useState('');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formSuiteIds, setFormSuiteIds] = useState<string[]>([]);
    const [formPriority, setFormPriority] = useState<TestCase['priority']>('medium');
    const [formTags, setFormTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [formSteps, setFormSteps] = useState<TestStep[]>([]);

    useEffect(() => {
        if (testCase && (mode === 'edit' || mode === 'view')) {
            setFormTestId(testCase.testId || '');
            setFormName(testCase.name);
            setFormDescription(testCase.description || '');
            setFormSuiteIds(testCase.suiteIds || ((testCase as any).suiteId ? [(testCase as any).suiteId] : []));
            setFormPriority(testCase.priority);
            setFormTags(testCase.tags || []);
            setFormSteps(testCase.steps || []);
        } else if (mode === 'create') {
            setFormTestId('');
            setFormName('');
            setFormDescription('');
            setFormSuiteIds(suites[0]?.id ? [suites[0].id] : []);
            setFormPriority('medium');
            setFormTags([]);
            setFormSteps([]);
        }
    }, [testCase, mode, suites]);

    const handleCreate = async () => {
        if (!formName.trim()) { toast.error('Test case name is required'); return; }
        try {
            await createTestCase({
                projectId,
                suiteIds: formSuiteIds,
                testId: formTestId.trim() || undefined,
                name: formName.trim(),
                description: formDescription.trim(),
                priority: formPriority,
                tags: formTags,
                steps: formSteps,
            });
            toast.success('Test case created');
            onSuccess?.();
            onClose();
        } catch (error) { toast.error('Failed to create test case'); }
    };

    const handleUpdate = async () => {
        if (!testCase || !formName.trim()) return;
        try {
            await updateTestCase(testCase.id, {
                testId: formTestId.trim(),
                name: formName.trim(),
                description: formDescription.trim(),
                suiteIds: formSuiteIds,
                priority: formPriority,
                tags: formTags,
                steps: formSteps,
            });
            toast.success('Test case updated');
            onSuccess?.();
            onClose();
        } catch (error) { toast.error('Failed to update test case'); }
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formTags.includes(tag)) {
            setFormTags([...formTags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => { setFormTags(formTags.filter((t) => t !== tag)); };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return <Badge variant="danger" className="text-[10px] px-1.5 py-0">Critical</Badge>;
            case 'high': return <Badge variant="warning" className="text-[10px] px-1.5 py-0">High</Badge>;
            case 'medium': return <Badge variant="info" className="text-[10px] px-1.5 py-0">Medium</Badge>;
            default: return <Badge variant="default" className="text-[10px] px-1.5 py-0">Low</Badge>;
        }
    };

    const getSuiteNames = (ids: string[]) => {
        return ids.map(id => suites.find(s => s.id === id)?.name).filter(Boolean).join(', ') || '-';
    };

    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const isCreate = mode === 'create';

    if (!mode) return null;

    return (
        <Modal
            isOpen={!!mode}
            onClose={onClose}
            title={isView ? formName : isEdit ? 'Edit Test Case' : 'Create Test Case'}
            size="xl"
        >
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {isView ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 bg-gray-900/40 p-3 rounded-lg border border-gray-800">
                            <div className="space-y-0.5">
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Priority</p>
                                {getPriorityBadge(formPriority)}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Suites</p>
                                <p className="text-xs text-gray-300">{getSuiteNames(formSuiteIds)}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">ID</p>
                                <p className="text-xs text-violet-400 font-mono font-bold">{formTestId || '-'}</p>
                            </div>
                        </div>

                        {formDescription && (
                            <p className="text-xs text-gray-400 leading-relaxed bg-gray-800/20 p-2.5 rounded border border-gray-800/50">
                                {formDescription}
                            </p>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                <Layers className="w-3 h-3" /> Test Steps ({formSteps.length})
                            </h4>
                            <div className="space-y-2">
                                {formSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 text-xs border-b border-gray-800/30 pb-2 last:border-0 group/step">
                                        <div className="w-5 h-5 rounded bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-400 shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-300 uppercase text-[9px] tracking-wide">{step.action}</span>
                                                {step.optional && <Badge variant="default" className="text-[8px] h-3.5">Optional</Badge>}
                                            </div>
                                            <p className="text-gray-200 mt-1 font-medium">{step.manualAction}</p>
                                            <div className="flex items-center gap-2 mt-1.5 opacity-60 group-hover/step:opacity-100 transition-opacity">
                                                {step.selector && <span className="text-[10px] bg-gray-950 px-1.5 py-0.5 rounded font-mono text-violet-400 border border-gray-800 truncate max-w-[200px]">{step.selector}</span>}
                                                {step.value && <span className="text-[10px] bg-gray-950 px-1.5 py-0.5 rounded font-mono text-emerald-400 border border-gray-800 truncate max-w-[200px]">{step.value}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800 flex gap-2">
                            <Button className="flex-1 h-9" size="sm" onClick={() => {
                                // This is a bit tricky if we want to change mode. 
                                // Ideally the parent should handle it.
                                // For now, let's just use successes.
                            }}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit Case
                            </Button>
                            <Button variant="secondary" className="h-9" size="sm" onClick={onClose}>Close</Button>
                        </div>
                    </div>
                ) : (
                    /* Edit / Create Form */
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Test ID (Optional)" value={formTestId} onChange={e => setFormTestId(e.target.value)} placeholder="e.g. TC-001" className="h-9" />
                            <UISelect label="Priority" value={formPriority} onChange={e => setFormPriority(e.target.value as any)} options={PRIORITIES.map(p => ({ label: p.label, value: p.value }))} className="h-9" />
                        </div>
                        <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} required className="h-9" />
                        <div className="grid grid-cols-2 gap-4">
                            <UISelect label="Main Suite" value={formSuiteIds[0] || ''} onChange={e => setFormSuiteIds(e.target.value ? [e.target.value] : [])} options={[{ label: 'Select...', value: '' }, ...suites.map(s => ({ label: s.name, value: s.id }))]} className="h-9" />
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tags</label>
                                <div className="flex gap-2">
                                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Press Enter" className="h-9" />
                                    <Button variant="secondary" size="sm" onClick={addTag} className="h-9">Add</Button>
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {formTags.map(tag => (
                                        <Badge key={tag} variant="info" className="text-[10px] group">
                                            {tag}
                                            <X className="w-2.5 h-2.5 ml-1 cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Description</label>
                            <textarea
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 min-h-[60px] focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        <StepEditor steps={formSteps} onChange={setFormSteps} variables={variables} />

                        <div className="flex gap-3 pt-4 border-t border-gray-800">
                            <Button className="flex-1 h-9" loading={mutationLoading} onClick={isEdit ? handleUpdate : handleCreate}>
                                {isEdit ? 'Save Changes' : 'Create Case'}
                            </Button>
                            <Button variant="outline" className="h-9" onClick={onClose}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
