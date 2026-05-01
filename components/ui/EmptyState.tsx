import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="border-2 border-dashed rounded-lg py-16 px-6 text-center"
      style={{ borderColor: colors.border }}
    >
      {icon && <div className="text-gray-300 mx-auto mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 mb-5">{description}</p>}
      {action}
    </div>
  );
}
