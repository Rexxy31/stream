'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        label,
        error,
        success,
        leftIcon,
        rightIcon,
        helperText,
        type = 'text',
        className = '',
        id,
        ...props
    }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const isPassword = type === 'password';
        const actualType = isPassword && showPassword ? 'text' : type;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(e.target.value.length > 0);
            props.onChange?.(e);
        };

        const baseInputStyles = 'w-full bg-background border rounded-lg px-4 py-3 text-white placeholder-transparent focus:outline-none transition-all';
        const stateStyles = error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : success
                ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : 'border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

        const paddingStyles = leftIcon ? 'pl-11' : rightIcon || isPassword ? 'pr-11' : '';

        return (
            <div className="w-full">
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={inputId}
                        type={actualType}
                        className={`${baseInputStyles} ${stateStyles} ${paddingStyles} ${className}`}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={handleChange}
                        placeholder={label || props.placeholder}
                        {...props}
                    />

                    {/* Floating Label */}
                    {label && (
                        <label
                            htmlFor={inputId}
                            className={`absolute transition-all pointer-events-none ${leftIcon ? 'left-11' : 'left-4'
                                } ${isFocused || hasValue
                                    ? '-top-2.5 text-xs bg-background px-1'
                                    : 'top-1/2 -translate-y-1/2 text-base'
                                } ${error
                                    ? 'text-red-400'
                                    : success
                                        ? 'text-green-400'
                                        : isFocused
                                            ? 'text-indigo-400'
                                            : 'text-slate-500'
                                }`}
                        >
                            {label}
                        </label>
                    )}

                    {/* Right Icon or Password Toggle */}
                    {isPassword ? (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors focus:outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    ) : rightIcon ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                            {rightIcon}
                        </div>
                    ) : null}
                </div>

                {/* Helper Text / Error / Success */}
                {(error || success || helperText) && (
                    <p className={`mt-1.5 text-sm ${error
                        ? 'text-red-400'
                        : success
                            ? 'text-green-400'
                            : 'text-slate-400'
                        }`}>
                        {error || success || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
