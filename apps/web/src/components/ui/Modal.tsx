'use client';

import { Fragment, ReactNode } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div
                        className={clsx(
                            'relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-800',
                            'transform transition-all duration-300',
                            'animate-in fade-in zoom-in-95',
                            {
                                'max-w-sm w-full': size === 'sm',
                                'max-w-md w-full': size === 'md',
                                'max-w-lg w-full': size === 'lg',
                                'max-w-2xl w-full': size === 'xl',
                            }
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || description) && (
                            <div className="px-6 pt-6 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        {title && (
                                            <h2 className="text-xl font-semibold text-white">
                                                {title}
                                            </h2>
                                        )}
                                        {description && (
                                            <p className="mt-1 text-sm text-gray-400">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className={clsx('px-6 pb-6', !title && !description && 'pt-6')}>
                            {children}
                            {footer && (
                                <div className="mt-6 pt-4 border-t border-gray-800">
                                    {footer}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

// Confirmation Modal Helper
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading,
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
            <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                    {cancelText}
                </Button>
                <Button
                    variant={variant}
                    onClick={onConfirm}
                    loading={loading}
                    className="flex-1"
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}
