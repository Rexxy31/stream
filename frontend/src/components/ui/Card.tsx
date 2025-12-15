'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered' | 'glass';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({
        children,
        variant = 'default',
        hover = true,
        padding = 'md',
        className = '',
        ...props
    }, ref) => {
        const baseStyles = 'rounded-2xl transition-all';

        const variants = {
            default: 'bg-surface border border-theme',
            elevated: 'bg-surface shadow-xl',
            bordered: 'bg-surface border-2 border-slate-700',
            glass: 'glass-card'
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8'
        };

        const hoverEffect = hover ? 'hover-lift cursor-pointer' : '';

        const classes = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverEffect} ${className}`;

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={classes}
                {...props as any}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
