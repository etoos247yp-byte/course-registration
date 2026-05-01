'use client';
import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({ data, columns, onRowClick, pageSize = 20 }: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="border rounded-lg bg-white" style={{ borderColor: colors.border }}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: colors.surface }}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b" style={{ borderColor: colors.border }}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() && <ChevronDown size={12} />}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick?.(r.original)}
              className={`border-b last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              style={{ borderColor: colors.borderLight }}
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-4 py-3">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: colors.border }}>
        <span className="text-xs text-gray-500">
          {table.getRowCount()}건 · {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
        </span>
        <div className="flex gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded hover:bg-gray-50 disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded hover:bg-gray-50 disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
