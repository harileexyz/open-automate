'use client';

import React from 'react';
import {
    GripVertical,
    Trash2,
    Plus,
    ChevronUp,
    ChevronDown,
    Compass,
    MousePointer2,
    Type,
    Clock,
    ShieldCheck,
    Camera,
    Type as TypeIcon,
    ListFilter,
    CheckSquare,
    Square,
    Pointer,
    ExternalLink
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { clsx } from 'clsx';
import type { TestStep, TestAction, ProjectVariable, AssertionType } from '@/lib/hooks';

// Assertion type options for the assert action
const ASSERTION_TYPES: { value: AssertionType; label: string; needsSelector: boolean; description: string }[] = [
    { value: 'visible', label: 'Is Visible', needsSelector: true, description: 'Element is visible on page' },
    { value: 'hidden', label: 'Is Hidden', needsSelector: true, description: 'Element is hidden/not visible' },
    { value: 'exists', label: 'Exists', needsSelector: true, description: 'Element exists in DOM' },
    { value: 'notExists', label: 'Not Exists', needsSelector: true, description: 'Element does not exist' },
    { value: 'text', label: 'Text Content', needsSelector: true, description: 'Element has specific text' },
    { value: 'value', label: 'Input Value', needsSelector: true, description: 'Input has specific value' },
    { value: 'url', label: 'URL', needsSelector: false, description: 'Page URL matches' },
    { value: 'title', label: 'Page Title', needsSelector: false, description: 'Page title matches' },
    { value: 'attribute', label: 'Attribute', needsSelector: true, description: 'Element attribute matches' },
];

interface StepEditorProps {
    steps: TestStep[];
    onChange: (steps: TestStep[]) => void;
    variables?: ProjectVariable[];
}

// Helper icon for Close/Clear since XCircle was used above but not imported correctly
const XCircle = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
);

const TEST_ACTIONS: {
    value: TestAction;
    label: string;
    icon: React.ReactNode;
    needsSelector?: boolean;
    needsValue?: boolean;
    needsAssertion?: boolean;
    description: string;
}[] = [
        {
            value: 'navigate',
            label: 'Navigate',
            icon: <Compass className="w-4 h-4" />,
            needsValue: true,
            description: 'Go to a specific URL'
        },
        {
            value: 'click',
            label: 'Click',
            icon: <MousePointer2 className="w-4 h-4" />,
            needsSelector: true,
            description: 'Click on a page element'
        },
        {
            value: 'type',
            label: 'Type',
            icon: <TypeIcon className="w-4 h-4" />,
            needsSelector: true,
            needsValue: true,
            description: 'Input text into a field'
        },
        {
            value: 'clear',
            label: 'Clear',
            icon: <XCircle className="w-4 h-4" />,
            needsSelector: true,
            description: 'Clear an input field'
        },
        {
            value: 'select',
            label: 'Select',
            icon: <ListFilter className="w-4 h-4" />,
            needsSelector: true,
            needsValue: true,
            description: 'Choose an option from a dropdown'
        },
        {
            value: 'check',
            label: 'Check',
            icon: <CheckSquare className="w-4 h-4" />,
            needsSelector: true,
            description: 'Check a checkbox or radio button'
        },
        {
            value: 'uncheck',
            label: 'Uncheck',
            icon: <Square className="w-4 h-4" />,
            needsSelector: true,
            description: 'Uncheck a checkbox'
        },
        {
            value: 'hover',
            label: 'Hover',
            icon: <Pointer className="w-4 h-4" />,
            needsSelector: true,
            description: 'Hover mouse over an element'
        },
        {
            value: 'wait',
            label: 'Wait',
            icon: <Clock className="w-4 h-4" />,
            needsValue: true,
            description: 'Pause execution (in ms)'
        },
        {
            value: 'assert',
            label: 'Assert',
            icon: <ShieldCheck className="w-4 h-4" />,
            needsSelector: true,
            needsValue: true,
            needsAssertion: true,
            description: 'Verify page state or element'
        },
        {
            value: 'screenshot',
            label: 'Screenshot',
            icon: <Camera className="w-4 h-4" />,
            description: 'Capture a screen image'
        },
    ];

export function StepEditor({ steps, onChange, variables = [] }: StepEditorProps) {
    const addStep = () => {
        const newStep: TestStep = {
            id: crypto.randomUUID(),
            order: steps.length,
            action: 'click',
            selector: '',
            description: '',
        };
        onChange([...steps, newStep]);
    };

    const updateStep = (id: string, updates: Partial<TestStep>) => {
        onChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        onChange(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;

        const newSteps = [...steps];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
        onChange(newSteps.map((s, i) => ({ ...s, order: i })));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">Test Steps</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addStep} className="h-8">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Step
                </Button>
            </div>

            {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-gray-900/40 border border-dashed border-gray-800">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-sm">No steps defined yet.</p>
                    <p className="text-gray-600 text-xs mt-1 text-center">Add steps to describe the interactive process for this test case.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const actionConfig = TEST_ACTIONS.find(a => a.value === step.action);

                        return (
                            <div
                                key={step.id}
                                className="group relative flex items-start gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-violet-500/30 transition-all duration-200"
                            >
                                {/* Step Number & Drag Handle (Visual only for now) */}
                                <div className="flex flex-col items-center gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => moveStep(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-[10px] font-bold text-gray-400">
                                        {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => moveStep(index, 'down')}
                                        disabled={index === steps.length - 1}
                                        className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-4">
                                    {/* Phase 1: Manual Action & Expected Result (Primary for both) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Manual Action / Instruction</label>
                                            <textarea
                                                placeholder="e.g., Click the 'Sign In' button on the top right"
                                                value={step.manualAction || ''}
                                                onChange={(e) => updateStep(step.id, { manualAction: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:border-violet-500 min-h-[60px] resize-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Expected Result</label>
                                            <textarea
                                                placeholder="e.g., The login modal should appear"
                                                value={step.expectedResult || ''}
                                                onChange={(e) => updateStep(step.id, { expectedResult: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:border-emerald-500/50 min-h-[60px] resize-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Phase 2: Automation Details (Secondary layer) */}
                                    <div className="pt-2 border-t border-gray-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-[1px] flex-1 bg-gray-800/50" />
                                            <span className="text-[9px] uppercase font-bold text-gray-600 tracking-wider">Automation Details</span>
                                            <div className="h-[1px] flex-1 bg-gray-800/50" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                            {/* Action Selector */}
                                            <div className="sm:col-span-3">
                                                <label className="text-[9px] text-gray-500 ml-1 mb-1 block">Strategy</label>
                                                <Select
                                                    options={TEST_ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                                                    key={step.id + '-action'}
                                                    value={step.action}
                                                    onChange={(e) => updateStep(step.id, { action: e.target.value as TestAction })}
                                                    className="!py-1.5 !text-[13px]"
                                                />
                                            </div>

                                            {/* Conditional Automation Fields */}
                                            <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {/* Assertion Type Dropdown - only show for assert action */}
                                                {actionConfig?.needsAssertion && (
                                                    <div>
                                                        <label className="text-[9px] text-gray-500 ml-1 mb-1 block">Assertion Type</label>
                                                        <Select
                                                            options={ASSERTION_TYPES.map(a => ({ label: a.label, value: a.value }))}
                                                            key={step.id + '-assertion-type'}
                                                            value={step.assertionType || 'visible'}
                                                            onChange={(e) => updateStep(step.id, { assertionType: e.target.value as AssertionType })}
                                                            className="!py-1.5 !text-[13px]"
                                                        />
                                                    </div>
                                                )}
                                                {/* Selector field - show for actions that need it, but for assert, only if the assertion type needs it */}
                                                {actionConfig?.needsSelector && (
                                                    step.action !== 'assert' || ASSERTION_TYPES.find(a => a.value === (step.assertionType || 'visible'))?.needsSelector
                                                ) && (
                                                        <div>
                                                            <label className="text-[9px] text-gray-500 ml-1 mb-1 block">Selector</label>
                                                            <Input
                                                                placeholder="#login-btn"
                                                                value={step.selector || ''}
                                                                onChange={(e) => updateStep(step.id, { selector: e.target.value })}
                                                                className="!py-1.5 !text-[13px]"
                                                            />
                                                        </div>
                                                    )}
                                                {/* Expected Value field - for assert actions that need comparison */}
                                                {step.action === 'assert' && ['text', 'value', 'url', 'title', 'attribute'].includes(step.assertionType || '') && (
                                                    <div className="relative">
                                                        <label className="text-[9px] text-gray-500 ml-1 mb-1 block">Expected Value</label>
                                                        <div className="relative group/input">
                                                            <Input
                                                                placeholder="Expected text or value"
                                                                value={step.expectedValue || ''}
                                                                onChange={(e) => updateStep(step.id, { expectedValue: e.target.value })}
                                                                className="!py-1.5 !text-[13px] pr-8"
                                                            />
                                                            {/* Variable picker for expected value */}
                                                            {variables.length > 0 && (
                                                                <div className="absolute right-1 top-1 bottom-1">
                                                                    <select
                                                                        className="h-full w-5 opacity-0 absolute inset-0 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            if (e.target.value) {
                                                                                updateStep(step.id, { expectedValue: (step.expectedValue || '') + e.target.value });
                                                                            }
                                                                        }}
                                                                        value=""
                                                                    >
                                                                        <option value="">Variables</option>
                                                                        {variables.map(v => (
                                                                            <option key={v.id} value={`{{${v.key}}}`}>{v.key}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="h-full px-1 flex items-center justify-center text-gray-500 pointer-events-none">
                                                                        <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded px-1">{'{ }'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Value field - for non-assert actions that need it */}
                                                {actionConfig?.needsValue && step.action !== 'assert' && (
                                                    <div className="relative">
                                                        <label className="text-[9px] text-gray-500 ml-1 mb-1 block">Value / URL</label>
                                                        <div className="relative group/input">
                                                            <Input
                                                                placeholder={
                                                                    step.action === 'navigate' ? 'URL' :
                                                                        step.action === 'wait' ? 'ms' :
                                                                            'Value'
                                                                }
                                                                value={step.value || ''}
                                                                onChange={(e) => updateStep(step.id, { value: e.target.value })}
                                                                className="!py-1.5 !text-[13px] pr-8"
                                                            />
                                                            {/* Live Filtering Dropdown */}
                                                            {step.value && variables.some(v => v.key.toLowerCase().includes(step.value!.toLowerCase()) || step.value!.includes('{{')) && !variables.some(v => `{{${v.key}}}` === step.value) && (
                                                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-xl overflow-hidden max-h-32 overflow-y-auto">
                                                                    {variables.filter(v => v.key.toLowerCase().includes(step.value!.replace(/[{}]/g, '').toLowerCase())).map(v => (
                                                                        <button
                                                                            key={v.id}
                                                                            type="button"
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-violet-500/20 hover:text-white flex items-center justify-between group/item"
                                                                            onClick={() => updateStep(step.id, { value: `{{${v.key}}}` })}
                                                                        >
                                                                            <span className="font-mono">{v.key}</span>
                                                                            <span className="text-[10px] text-gray-500 group-hover/item:text-gray-400">{v.isSecret ? '••••' : v.value}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Fallback Icon Trigger */}
                                                            {variables.length > 0 && (
                                                                <div className="absolute right-1 top-1 bottom-1">
                                                                    <select
                                                                        className="h-full w-5 opacity-0 absolute inset-0 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            if (e.target.value) {
                                                                                updateStep(step.id, { value: (step.value || '') + e.target.value });
                                                                            }
                                                                        }}
                                                                        value=""
                                                                    >
                                                                        <option value="">Variables</option>
                                                                        {variables.map(v => (
                                                                            <option key={v.id} value={`{{${v.key}}}`}>{v.key}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="h-full px-1 flex items-center justify-center text-gray-500 pointer-events-none">
                                                                        <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded px-1">{'{ }'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => removeStep(step.id)}
                                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {steps.length > 0 && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={addStep}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/20 text-gray-400 hover:text-white hover:bg-gray-800/40 transition-all text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Insert new step at the end
                    </button>
                </div>
            )}
        </div>
    );
}
