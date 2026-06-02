const DEVELOPMENT_JWT_SECRET = 'etoos-247-course-registration-secure-secret-key-32bytes-fallback';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);

  if (isProduction()) {
    throw new Error('JWT_SECRET is required in production.');
  }

  return new TextEncoder().encode(DEVELOPMENT_JWT_SECRET);
}

export function assertSupabaseConfigured(url: string | undefined, anonKey: string | undefined): void {
  if (url && anonKey) return;

  if (isProduction()) {
    throw new Error('Supabase environment variables are required in production.');
  }
}
