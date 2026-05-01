'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-lg' }: DrawerProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 bottom-0 w-full ${width} bg-white flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div>
            {subtitle && <p className="text-xs text-gray-500 mb-0.5">{subtitle}</p>}
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
