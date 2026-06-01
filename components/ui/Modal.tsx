'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  darkMode?: boolean;
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md', darkMode = false }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className={`${width} w-full rounded-lg shadow-2xl transition-colors duration-200 ${
          darkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-100' : 'bg-white text-brand-text'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-2 flex items-start justify-between">
            <div className="flex-1">{title}</div>
            <button
              onClick={onClose}
              className={`p-2 -mr-2 rounded transition-colors ${
                darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
        {footer && (
          <div
            className={`px-6 py-4 border-t flex justify-end gap-2 ${
              darkMode ? 'border-zinc-800' : 'border-brand-border'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
