import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ds } from '@/lib/styles/design-system';

interface PremiumCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
}

export function PremiumCard({
    children,
    className,
    hover = false,
    title,
    subtitle,
    icon
}: PremiumCardProps) {
    return (
        <div
            className={cn(
                'bg-white',
                ds.card.radius,
                ds.card.shadow,
                ds.card.border,
                ds.card.padding,
                hover && ds.card.hover,
                className
            )}
        >
            {(title || subtitle || icon) && (
                <CardHeader
                    title={title || ''}
                    subtitle={subtitle}
                    action={icon}
                    className="mb-4"
                />
            )}
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between mb-6', className)}>
            <div>
                <h3 className={cn(ds.typography.h3, 'text-neutral-900 mb-1')}>
                    {title}
                </h3>
                {subtitle && (
                    <p className={cn(ds.typography.small, 'text-neutral-500')}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="ml-4">{action}</div>}
        </div>
    );
}
