const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function parseDOB6(input: string): string | null {
  if (!/^\d{6}$/.test(input)) return null;
  const yy = parseInt(input.slice(0, 2), 10);
  const mm = parseInt(input.slice(2, 4), 10);
  const dd = parseInt(input.slice(4, 6), 10);
  const fullYear = yy <= 30 ? 2000 + yy : 1900 + yy;
  const d = new Date(fullYear, mm - 1, dd);
  if (
    d.getFullYear() !== fullYear ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  )
    return null;
  return `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export function formatKDate(iso: string): string {
  const d = new Date(iso);
  const day = DAYS_KOR[d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} (${day}) ${hh}:${mm}`;
}
