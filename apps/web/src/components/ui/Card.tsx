import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

export function Card({ children, className, hover = false, padding = 'md', onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={clsx(
                'bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800',
                hover && 'hover:border-gray-700 hover:bg-gray-900/70 transition-all duration-200 cursor-pointer',
                {
                    'p-0': padding === 'none',
                    'p-4': padding === 'sm',
                    'p-6': padding === 'md',
                    'p-8': padding === 'lg',
                },
                className
            )}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-400 mt-0.5">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
