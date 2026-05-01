'use client';
import * as React from 'react';
import { Input, type InputProps } from './Input';

export const KrwField = React.forwardRef<HTMLInputElement, InputProps>(function KrwField(
  { value, onChange, ...rest },
  ref,
) {
  const display =
    value === undefined || value === '' ? '' : Number(String(value).replace(/\D/g, '')).toLocaleString();
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const raw = e.currentTarget.value.replace(/\D/g, '');
        const synthetic = { ...e, currentTarget: { ...e.currentTarget, value: raw } };
        onChange?.(synthetic as React.ChangeEvent<HTMLInputElement>);
      }}
      {...rest}
    />
  );
});
