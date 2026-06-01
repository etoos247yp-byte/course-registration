'use client';
import * as React from 'react';
import { parseShortDate, formatDisplay } from '@/lib/utils/date-shorthand';

export function SmartDateInput({
  value,
  onChange,
  label,
  type = 'start',
  darkMode = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  type?: 'start' | 'end';
  darkMode?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  /* eslint-disable react-hooks/set-state-in-effect -- Syncs draft value when parent value changes while input is not focused. */
  React.useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const parsed = React.useMemo(() => {
    const trimmed = draft.trim();
    return trimmed ? parseShortDate(trimmed, undefined, type) : null;
  }, [draft, type]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) {
      const result = parseShortDate(trimmed, undefined, type);
      if (result) {
        onChange(result);
        setDraft(result);
        return;
      }
    }
    setDraft(value);
  }

  return (
    <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-brand-text'}`}>
      {label}
      <input
        type="text"
        value={focused ? draft : formatDisplay(value)}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        placeholder="예: 5/12, 0512, 오늘"
        className={`mt-2 w-full rounded-md border px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-brand ${
          darkMode
            ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
            : 'bg-white border-brand-border text-brand-text placeholder-brand-text-faint'
        }`}
      />
      {focused && draft.trim() ? (
        parsed ? (
          <p className="mt-1 text-xs" style={{ color: '#2DAE9D' }}>
            → {formatDisplay(parsed)}(으)로 설정됩니다
          </p>
        ) : (
          <p className={`mt-1 text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-faint'}`}>
            예: 5/12, 5/12 14:30, 0512, 05121430, 오늘, 내일, today
          </p>
        )
      ) : null}
    </label>
  );
}
