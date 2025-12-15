'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'gradient' | 'success' | 'warning';
    showLabel?: boolean;
    animated?: boolean;
}

export default function ProgressBar({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = true,
    className = '',
    ...props
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4'
    };

    const variants = {
        default: 'bg-indigo-600',
        gradient: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600'
    };

    return (
        <div className={`w-full ${className}`} {...props}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-300">Progress</span>
                    <span className="text-sm font-semibold text-white">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${sizes[size]}`}>
                <motion.div
                    initial={animated ? { width: 0 } : { width: `${percentage}%` }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`${sizes[size]} ${variants[variant]} rounded-full transition-all`}
                />
            </div>
        </div>
    );
}
