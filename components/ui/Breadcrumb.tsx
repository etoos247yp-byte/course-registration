import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface Crumb { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500">
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-gray-900">
              {c.label}
            </Link>
          ) : (
            <span className="text-gray-900">{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
