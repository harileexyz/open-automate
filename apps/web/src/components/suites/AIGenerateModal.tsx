
import { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { Wand2, AlertCircle } from 'lucide-react';
import { useTestCaseMutations } from '@/lib/hooks/useTestCases';
import toast from 'react-hot-toast';

interface AIGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    suiteId?: string; // Optional: if generated from within a suite context
}

export function AIGenerateModal({ isOpen, onClose, projectId, suiteId }: AIGenerateModalProps) {
    const [url, setUrl] = useState('');
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { createTestCase } = useTestCaseMutations();

    const handleGenerate = async () => {
        if (!url) {
            setError('Please enter a valid URL');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Call AI Generation API
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, instructions }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate test case');
            }

            const { data: generatedData } = await response.json();

            // 2. Create Draft Test Case
            await createTestCase({
                projectId,
                suiteIds: suiteId ? [suiteId] : [],
                name: generatedData.name,
                description: generatedData.description,
                steps: generatedData.steps,
                priority: 'medium',
                tags: ['ai-generated'],
                // status: 'draft' is default in hook
            });

            toast.success('Draft test case generated successfully!');
            onClose();
            setUrl('');
            setInstructions('');
        } catch (err) {
            console.error('Generation Error:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Test Case with AI"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !url}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate Draft
                            </>
                        )}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                        Feature URL <span className="text-red-400">*</span>
                    </label>
                    <Input
                        placeholder="https://example.com/login"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                        We'll analyze this page to identify interactive elements and user flows.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                        Instructions (Optional)
                    </label>
                    <textarea
                        className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm placeholder:text-gray-600 resize-none"
                        placeholder="e.g. Test successful login flow with valid credentials"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
