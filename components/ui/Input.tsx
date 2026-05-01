'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, className = '', ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      )}
      <input
        ref={ref}
        {...rest}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-md text-sm bg-white focus:outline-none transition-colors ${className}`}
        style={{ borderColor: colors.border }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          rest.onBlur?.(e);
        }}
      />
    </div>
  );
});
