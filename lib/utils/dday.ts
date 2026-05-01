export function dDay(now: Date, target: Date): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
