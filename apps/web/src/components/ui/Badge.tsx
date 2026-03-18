import { clsx } from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center font-medium rounded-full',
                {
                    'px-2 py-0.5 text-xs': size === 'sm',
                    'px-2.5 py-1 text-sm': size === 'md',
                },
                {
                    'bg-gray-700 text-gray-300': variant === 'default',
                    'bg-green-500/20 text-green-400 border border-green-500/30': variant === 'success',
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30': variant === 'warning',
                    'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'danger',
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'info',
                    'bg-violet-500/20 text-violet-400 border border-violet-500/30': variant === 'purple',
                },
                className
            )}
        >
            {children}
        </span>
    );
}

// Status badge with dot indicator
interface StatusBadgeProps {
    status: 'passed' | 'failed' | 'running' | 'queued' | 'skipped';
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = {
        passed: { label: 'Passed', variant: 'success' as const },
        failed: { label: 'Failed', variant: 'danger' as const },
        running: { label: 'Running', variant: 'info' as const },
        queued: { label: 'Queued', variant: 'default' as const },
        skipped: { label: 'Skipped', variant: 'warning' as const },
    };

    const { label, variant } = config[status];

    return (
        <Badge variant={variant}>
            <span
                className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', {
                    'bg-green-400': variant === 'success',
                    'bg-red-400': variant === 'danger',
                    'bg-blue-400 animate-pulse': variant === 'info',
                    'bg-gray-400': variant === 'default',
                    'bg-yellow-400': variant === 'warning',
                })}
            />
            {label}
        </Badge>
    );
}
