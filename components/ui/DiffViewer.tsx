import * as React from 'react';

export function DiffViewer({ before, after }: { before?: unknown; after?: unknown }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
      <div>
        <p className="text-gray-500 mb-1">변경 전</p>
        <pre className="bg-red-50 p-3 rounded border border-red-100 whitespace-pre-wrap">
          {JSON.stringify(before ?? {}, null, 2)}
        </pre>
      </div>
      <div>
        <p className="text-gray-500 mb-1">변경 후</p>
        <pre className="bg-green-50 p-3 rounded border border-green-100 whitespace-pre-wrap">
          {JSON.stringify(after ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
