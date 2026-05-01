export function formatKRW(n: number): string {
  return n === 0 ? '무료' : `${n.toLocaleString()}원`;
}
