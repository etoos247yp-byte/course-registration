export const colors = {
  primary:      'var(--color-brand, #2DAE9D)',
  primaryDark:  'var(--color-brand-dark, #259387)',
  primaryLight: 'var(--color-brand-light, #E8F5F3)',
  primaryBg:    'var(--color-brand-bg, #F4FAF9)',
  text:         'var(--color-text, #111827)',
  textMuted:    'var(--color-text-muted, #6B7280)',
  textFaint:    'var(--color-text-faint, #9CA3AF)',
  border:       'var(--color-brand-border, #EAECEE)',
  borderLight:  'var(--color-brand-border-light, #F3F4F6)',
  surface:      '#FAFAFA',
  warning:      '#D97706',
  warningBg:    '#FEF3C7',
  warningLight: '#FFFBEB',
  danger:       '#DC2626',
  dangerBg:     '#FEE2E2',
} as const;

export const font =
  "'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR','Segoe UI',Roboto,sans-serif";

export const radii = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem' } as const;
