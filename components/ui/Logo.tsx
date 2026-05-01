import { colors } from '@/lib/design-tokens';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const s =
    size === 'lg'
      ? { brand: 'text-3xl', pill: 'text-xs px-2 py-0.5', sub: 'text-base' }
      : { brand: 'text-xl', pill: 'text-[10px] px-1.5 py-0.5', sub: 'text-sm' };
  return (
    <div className="flex items-center gap-2">
      <span className={`${s.brand} font-bold tracking-tight`} style={{ color: colors.primary }}>ETOOS</span>
      <span
        className={`${s.pill} font-bold text-white rounded`}
        style={{ backgroundColor: colors.primary }}
      >
        247
      </span>
      <span className={`${s.sub} text-gray-600 font-medium`}>이천기숙학원</span>
    </div>
  );
}
