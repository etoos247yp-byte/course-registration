'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  const base = `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass[size]} ${className}`;

  if (variant === 'primary') {
    return (
      <button
        {...rest}
        className={`${base} text-white hover:opacity-90 active:scale-[0.98]`}
        style={{ backgroundColor: colors.primary }}
      >
        {icon}
        {children}
      </button>
    );
  }
  if (variant === 'ghost') {
    return (
      <button {...rest} className={`${base} text-gray-700 hover:bg-gray-50`}>
        {icon}
        {children}
      </button>
    );
  }
  if (variant === 'danger') {
    return (
      <button {...rest} className={`${base} bg-white border border-red-200 text-red-700 hover:bg-red-50`}>
        {icon}
        {children}
      </button>
    );
  }
  return (
    <button
      {...rest}
      className={`${base} bg-white border text-gray-800 hover:bg-gray-50`}
      style={{ borderColor: colors.border }}
    >
      {icon}
      {children}
    </button>
  );
}
