'use client';
import * as React from 'react';
import { Input, type InputProps } from './Input';

export const DateField = React.forwardRef<HTMLInputElement, InputProps>(function DateField(props, ref) {
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      maxLength={8}
      pattern="\d{8}"
      placeholder="YYYYMMDD"
      {...props}
      onChange={(e) => {
        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 8);
        props.onChange?.(e);
      }}
    />
  );
});
