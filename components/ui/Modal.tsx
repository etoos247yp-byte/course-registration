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
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={`${width} w-full bg-white rounded-lg shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-2 flex items-start justify-between">
            <div>{title}</div>
            <button onClick={onClose} className="p-2 -mr-2 rounded hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
        {footer && (
          <div
            className="px-6 py-4 border-t flex justify-end gap-2"
            style={{ borderColor: colors.border }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
