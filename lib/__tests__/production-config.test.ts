import { afterEach, describe, expect, test, vi } from 'vitest';

describe('production configuration guards', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('requires JWT_SECRET in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');

    const { getJwtSecretKey } = await import('@/lib/production-config');

    expect(() => getJwtSecretKey()).toThrow(/JWT_SECRET/);
  });

  test('allows a development fallback JWT secret outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('JWT_SECRET', '');

    const { getJwtSecretKey } = await import('@/lib/production-config');

    expect(getJwtSecretKey()).toBeInstanceOf(Uint8Array);
  });

  test('requires Supabase variables in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    await expect(import('@/lib/supabase')).rejects.toThrow(/Supabase/);
  });
});
