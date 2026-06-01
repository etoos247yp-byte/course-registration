const SHORTCUTS: Record<string, (today: Date, isEnd: boolean) => Date> = {
  '오늘': (t, isEnd) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), isEnd ? 23 : 0, isEnd ? 59 : 0),
  today: (t, isEnd) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), isEnd ? 23 : 0, isEnd ? 59 : 0),
  '내일': (t, isEnd) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, isEnd ? 23 : 0, isEnd ? 59 : 0),
  tomorrow: (t, isEnd) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, isEnd ? 23 : 0, isEnd ? 59 : 0),
};

export function parseShortDate(
  input: string,
  referenceYear?: number,
  defaultTimeType: 'start' | 'end' = 'start',
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const now = new Date();
  const year = referenceYear ?? now.getFullYear();
  const isEnd = defaultTimeType === 'end';

  const shortcut = SHORTCUTS[trimmed.toLowerCase()];
  if (shortcut) return formatDatetimeLocal(shortcut(now, isEnd));

  if (/^\d{4}$/.test(trimmed)) {
    const mm = parseInt(trimmed.slice(0, 2), 10);
    const dd = parseInt(trimmed.slice(2, 4), 10);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && isValidDate(year, mm, dd)) {
      const hh = isEnd ? 23 : 0;
      const min = isEnd ? 59 : 0;
      return formatDatetimeLocal(new Date(year, mm - 1, dd, hh, min));
    }
    return null;
  }

  if (/^\d{8}$/.test(trimmed)) {
    const mm = parseInt(trimmed.slice(0, 2), 10);
    const dd = parseInt(trimmed.slice(2, 4), 10);
    const hh = parseInt(trimmed.slice(4, 6), 10);
    const min = parseInt(trimmed.slice(6, 8), 10);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && hh >= 0 && hh <= 23 && min >= 0 && min <= 59 && isValidDate(year, mm, dd)) {
      return formatDatetimeLocal(new Date(year, mm - 1, dd, hh, min));
    }
    return null;
  }

  if (/^\d{6}$/.test(trimmed)) {
    const mm = parseInt(trimmed.slice(0, 2), 10);
    const dd = parseInt(trimmed.slice(2, 4), 10);
    const hh = parseInt(trimmed.slice(4, 6), 10);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && hh >= 0 && hh <= 23 && isValidDate(year, mm, dd)) {
      return formatDatetimeLocal(new Date(year, mm - 1, dd, hh, 0));
    }
    return null;
  }

  const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2})(?::(\d{2}))?)?$/);
  if (match) {
    const mm = parseInt(match[1], 10);
    const dd = parseInt(match[2], 10);
    const hasTime = match[3] !== undefined;
    const hh = hasTime ? parseInt(match[3], 10) : (isEnd ? 23 : 0);
    const min = match[4] ? parseInt(match[4], 10) : (hasTime ? 0 : (isEnd ? 59 : 0));
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && hh >= 0 && hh <= 23 && min >= 0 && min <= 59 && isValidDate(year, mm, dd)) {
      return formatDatetimeLocal(new Date(year, mm - 1, dd, hh, min));
    }
    return null;
  }

  return null;
}

function formatDatetimeLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function formatDisplay(datetimeLocal: string): string {
  if (!datetimeLocal || typeof datetimeLocal !== 'string') return '';
  if (!datetimeLocal.includes('T')) return datetimeLocal;
  const [datePart, timePart] = datetimeLocal.split('T');
  const [y, m, d] = datePart.split('-');
  return `${y}년 ${m}월 ${d}일 ${timePart}`;
}

export function calculateAutoCloseDate(startDateStr: string): string {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';

  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 9);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T23:59`;
}
