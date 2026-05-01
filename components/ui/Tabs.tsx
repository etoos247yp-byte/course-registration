'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b mb-6" style={{ borderColor: colors.border }}>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative px-4 py-2.5 text-sm font-medium"
            style={{ color: active === t.id ? colors.primary : colors.textMuted }}
          >
            {t.label}
            {active === t.id && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5" style={{ backgroundColor: colors.primary }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
