'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({
        children,
        variant = 'default',
        size = 'md',
        pulse = false,
        className = '',
        ...props
    }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all';

        const variants = {
            default: 'bg-slate-700 text-slate-300 border border-slate-600',
            primary: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
            success: 'bg-green-500/10 text-green-400 border border-green-500/20',
            warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
            danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
            info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-3 py-1 text-sm',
            lg: 'px-4 py-1.5 text-base'
        };

        const pulseEffect = pulse ? 'animate-pulse' : '';

        const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${pulseEffect} ${className}`;

        return (
            <span ref={ref} className={classes} {...props}>
                {pulse && (
                    <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                    </span>
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export default Badge;
