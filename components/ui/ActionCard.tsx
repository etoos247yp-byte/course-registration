'use client';
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export function ActionCard({
  icon,
  title,
  desc,
  onClick,
  primary = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="text-left border rounded-lg p-5 hover:border-gray-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        borderColor: primary ? colors.primary : colors.border,
        backgroundColor: primary ? colors.primaryBg : 'white',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <ChevronRight size={16} className="text-gray-300 ml-auto group-hover:text-gray-500" />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}
