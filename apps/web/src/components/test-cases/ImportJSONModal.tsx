'use client';

import { useState, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import { FileJson, AlertCircle, CheckCircle2, Copy, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useTestCaseMutations, TestStep } from '@/lib/hooks/useTestCases';
import { CHATGPT_PROMPT, CLAUDE_PROMPT, EXAMPLE_OUTPUT, MULTI_TEST_EXAMPLE } from '@/lib/utils/aiPromptTemplates';
import toast from 'react-hot-toast';

interface ImportJSONModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    suiteId?: string;
}

interface ValidationError {
    path: string;
    message: string;
}

// Local type for validated test cases from API (steps don't have IDs yet)
interface ValidatedTestCase {
    projectId: string;
    suiteId?: string;
    name: string;
    description?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    tags?: string[];
    steps?: Array<{
        order?: number;
        action: string;
        selector?: string;
        selectorType?: string;
        value?: string;
        description?: string;
        timeout?: number;
        optional?: boolean;
        screenshot?: boolean;
        assertionType?: string;
        expectedValue?: string;
        operator?: string;
    }>;
}

interface ValidatedResponse {
    success: boolean;
    error?: string;
    validationErrors?: ValidationError[];
    data?: {
        validatedTestCases: ValidatedTestCase[];
        totalInput: number;
        totalValid: number;
        warnings: ValidationError[];
    };
}

type ViewMode = 'paste' | 'preview' | 'help';

// Helper to generate unique IDs
function generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ImportJSONModal({ isOpen, onClose, projectId, suiteId }: ImportJSONModalProps) {
    const [jsonInput, setJsonInput] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('paste');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [validatedTestCases, setValidatedTestCases] = useState<ValidatedTestCase[]>([]);
    const [expandedHelp, setExpandedHelp] = useState<'chatgpt' | 'claude' | 'example' | null>(null);

    const { createTestCase } = useTestCaseMutations();

    const resetState = useCallback(() => {
        setJsonInput('');
        setViewMode('paste');
        setLoading(false);
        setValidating(false);
        setErrors([]);
        setValidatedTestCases([]);
        setExpandedHelp(null);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleValidate = async () => {
        if (!jsonInput.trim()) {
            setErrors([{ path: 'root', message: 'Please paste your JSON test cases' }]);
            return;
        }

        try {
            setValidating(true);
            setErrors([]);

            // First, try to parse JSON locally
            let parsedJson;
            try {
                parsedJson = JSON.parse(jsonInput);
            } catch {
                setErrors([{ path: 'root', message: 'Invalid JSON syntax. Please check your JSON format.' }]);
                return;
            }

            // Build request body - handle root-level arrays
            let requestBody: Record<string, unknown>;
            if (Array.isArray(parsedJson)) {
                // Root-level array of test cases
                requestBody = {
                    projectId,
                    suiteId,
                    testCases: parsedJson
                };
            } else {
                // Object format (single test case or wrapped format)
                requestBody = {
                    projectId,
                    suiteId,
                    ...parsedJson
                };
            }

            // Call API for validation
            const response = await fetch('/api/import/json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const result: ValidatedResponse = await response.json();

            if (!result.success) {
                setErrors(result.validationErrors || [{ path: 'root', message: result.error || 'Validation failed' }]);
                return;
            }

            // Success - show preview
            setValidatedTestCases(result.data?.validatedTestCases || []);
            if (result.data?.warnings && result.data.warnings.length > 0) {
                setErrors(result.data.warnings);
            }
            setViewMode('preview');

        } catch (err) {
            console.error('Validation Error:', err);
            setErrors([{ path: 'root', message: err instanceof Error ? err.message : 'An unexpected error occurred' }]);
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        if (validatedTestCases.length === 0) return;

        try {
            setLoading(true);

            // Create each test case as draft
            for (const testCase of validatedTestCases) {
                // Transform steps to include IDs and filter out undefined values
                const stepsWithIds: TestStep[] = (testCase.steps || []).map((step, index) => {
                    // Build step object, only including defined values
                    const stepObj: TestStep = {
                        id: generateStepId(),
                        order: step.order || index + 1,
                        action: step.action as TestStep['action'],
                    };

                    // Only add optional fields if they have values
                    if (step.selector) stepObj.selector = step.selector;
                    if (step.selectorType) stepObj.selectorType = step.selectorType as TestStep['selectorType'];
                    if (step.value) stepObj.value = step.value;
                    if (step.description) stepObj.description = step.description;
                    if (step.timeout !== undefined) stepObj.timeout = step.timeout;
                    if (step.optional !== undefined) stepObj.optional = step.optional;
                    if (step.screenshot !== undefined) stepObj.screenshot = step.screenshot;
                    if (step.assertionType) stepObj.assertionType = step.assertionType as TestStep['assertionType'];
                    if (step.expectedValue) stepObj.expectedValue = step.expectedValue;
                    if (step.operator) stepObj.operator = step.operator as TestStep['operator'];

                    return stepObj;
                });

                await createTestCase({
                    projectId,
                    suiteIds: suiteId ? [suiteId] : [],
                    name: testCase.name,
                    description: testCase.description || '',
                    steps: stepsWithIds,
                    priority: testCase.priority || 'medium',
                    tags: [...(testCase.tags || []), 'ai-imported'],
                });
            }

            toast.success(`Successfully imported ${validatedTestCases.length} test case(s) as drafts!`);
            handleClose();

        } catch (err) {
            console.error('Import Error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to import test cases');
        } finally {
            setLoading(false);
        }
    };


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const renderPasteView = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                        Paste JSON from External AI
                    </label>
                    <button
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        onClick={() => setViewMode('help')}
                    >
                        <HelpCircle className="w-3 h-3" />
                        How to generate?
                    </button>
                </div>
                <textarea
                    className="w-full h-64 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-mono placeholder:text-gray-600 resize-none"
                    placeholder={`Paste your JSON here. Example:\n${JSON.stringify(EXAMPLE_OUTPUT, null, 2).slice(0, 300)}...`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    disabled={validating}
                    spellCheck={false}
                />
            </div>

            {errors.length > 0 && (
                <div className="space-y-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Validation Errors
                    </div>
                    <ul className="text-xs text-red-300 space-y-1 ml-6 list-disc">
                        {errors.slice(0, 5).map((err, i) => (
                            <li key={i}>
                                <span className="font-mono text-red-400">{err.path}</span>: {err.message}
                            </li>
                        ))}
                        {errors.length > 5 && (
                            <li className="text-gray-400">...and {errors.length - 5} more errors</li>
                        )}
                    </ul>
                </div>
            )}

            <div className="text-xs text-gray-500 p-3 bg-gray-800/50 rounded-md">
                <p><strong>Supported formats:</strong></p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Single test case with "name" and "steps"</li>
                    <li>Multiple test cases with "testCases" array</li>
                    <li>Flexible field names (selector/element/locator, value/text/input)</li>
                </ul>
            </div>
        </div>
    );

    const renderPreviewView = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p>Validation successful! {validatedTestCases.length} test case(s) ready to import.</p>
            </div>

            {errors.length > 0 && (
                <div className="text-xs text-yellow-400 p-2 bg-yellow-500/10 rounded-md">
                    <strong>Warnings:</strong> {errors.length} non-critical issue(s) auto-corrected.
                </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
                {validatedTestCases.map((tc, i) => (
                    <div key={i} className="p-3 bg-gray-800 border border-gray-700 rounded-md">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-white">{tc.name}</h4>
                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                                {tc.steps?.length || 0} steps
                            </span>
                        </div>
                        {tc.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tc.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(tc.steps || []).slice(0, 4).map((step, j) => (
                                <span key={j} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">
                                    {step.action}
                                </span>
                            ))}
                            {(tc.steps?.length || 0) > 4 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-gray-500">
                                    +{(tc.steps?.length || 0) - 4} more
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400">
                Test cases will be imported as <span className="text-violet-400 font-medium">drafts</span>.
                You can review and approve them before running.
            </p>
        </div>
    );

    const renderHelpView = () => (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <button
                className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                onClick={() => setViewMode('paste')}
            >
                ← Back to paste
            </button>

            <div className="space-y-3">
                {/* ChatGPT Prompt */}
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors"
                        onClick={() => setExpandedHelp(expandedHelp === 'chatgpt' ? null : 'chatgpt')}
                    >
                        <span className="font-medium text-sm">📝 ChatGPT Prompt</span>
                        {expandedHelp === 'chatgpt' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedHelp === 'chatgpt' && (
                        <div className="p-3 bg-gray-900 space-y-2">
                            <p className="text-xs text-gray-400">Copy this prompt and paste it into ChatGPT:</p>
                            <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                                {CHATGPT_PROMPT}
                            </pre>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(CHATGPT_PROMPT)}
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                            </Button>
                        </div>
                    )}
                </div>

                {/* Claude Prompt */}
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors"
                        onClick={() => setExpandedHelp(expandedHelp === 'claude' ? null : 'claude')}
                    >
                        <span className="font-medium text-sm">🤖 Claude Prompt</span>
                        {expandedHelp === 'claude' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedHelp === 'claude' && (
                        <div className="p-3 bg-gray-900 space-y-2">
                            <p className="text-xs text-gray-400">Copy this prompt and paste it into Claude:</p>
                            <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                                {CLAUDE_PROMPT}
                            </pre>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(CLAUDE_PROMPT)}
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                            </Button>
                        </div>
                    )}
                </div>

                {/* Example Output */}
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors"
                        onClick={() => setExpandedHelp(expandedHelp === 'example' ? null : 'example')}
                    >
                        <span className="font-medium text-sm">📋 Example JSON Format</span>
                        {expandedHelp === 'example' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedHelp === 'example' && (
                        <div className="p-3 bg-gray-900 space-y-2">
                            <p className="text-xs text-gray-400">Single test case example:</p>
                            <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto max-h-40">
                                {JSON.stringify(EXAMPLE_OUTPUT, null, 2)}
                            </pre>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(EXAMPLE_OUTPUT, null, 2))}
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" /> Copy Example
                            </Button>
                            <p className="text-xs text-gray-400 mt-3">Multiple test cases example:</p>
                            <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto max-h-40">
                                {JSON.stringify(MULTI_TEST_EXAMPLE, null, 2)}
                            </pre>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(MULTI_TEST_EXAMPLE, null, 2))}
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" /> Copy Multi-Test Example
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-violet-400" />
                    <span>Import Test Cases from External AI</span>
                </div>
            }
            footer={
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {viewMode === 'preview' && `${validatedTestCases.length} test(s) to import`}
                    </div>
                    <div className="flex gap-2">
                        {viewMode === 'preview' && (
                            <Button variant="ghost" onClick={() => setViewMode('paste')} disabled={loading}>
                                Back
                            </Button>
                        )}
                        <Button variant="ghost" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        {viewMode === 'paste' && (
                            <Button
                                onClick={handleValidate}
                                disabled={validating || !jsonInput.trim()}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {validating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Validating...
                                    </>
                                ) : (
                                    'Validate & Preview'
                                )}
                            </Button>
                        )}
                        {viewMode === 'preview' && (
                            <Button
                                onClick={handleImport}
                                disabled={loading || validatedTestCases.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <FileJson className="w-4 h-4 mr-2" />
                                        Import as Drafts
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {viewMode === 'paste' && renderPasteView()}
            {viewMode === 'preview' && renderPreviewView()}
            {viewMode === 'help' && renderHelpView()}
        </Modal>
    );
}
