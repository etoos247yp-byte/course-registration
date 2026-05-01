import * as React from 'react';

export function Toolbar({
  search,
  filters,
  actions,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {search && <div className="flex-1 min-w-[240px]">{search}</div>}
      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </div>
  );
}
