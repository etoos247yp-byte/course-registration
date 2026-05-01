import * as React from 'react';
import { colors } from '@/lib/design-tokens';

type PillColor = 'gray' | 'teal' | 'warn' | 'red' | 'green' | 'slate';
type PillSize = 'sm' | 'md';

const palette: Record<PillColor, { bg: string; text: string }> = {
  gray:  { bg: '#F3F4F6', text: '#4B5563' },
  teal:  { bg: colors.primaryLight, text: colors.primaryDark },
  warn:  { bg: '#FEF3C7', text: '#92400E' },
  red:   { bg: '#FEE2E2', text: '#991B1B' },
  green: { bg: '#D1FAE5', text: '#065F46' },
  slate: { bg: '#F1F5F9', text: '#334155' },
};

export function Pill({
  children,
  color = 'gray',
  size = 'sm',
}: {
  children: React.ReactNode;
  color?: PillColor;
  size?: PillSize;
}) {
  const c = palette[color];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded font-medium`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}
