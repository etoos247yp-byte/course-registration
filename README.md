# Course Registration

ETOOS 247 이천기숙학원 수강신청 앱입니다.

## Local Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

When Supabase variables are not configured, local development falls back to demo data.

## Production Configuration

Production requires these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
JWT_SECRET=...
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

In production, missing Supabase variables or `JWT_SECRET` are treated as configuration errors instead of silently enabling demo mode.

## Verification

```bash
pnpm verify
```

`pnpm verify` runs lint, TypeScript, tests, dependency audit, and a production build.

## Local Demo Accounts

Use only for local/demo mode:

- Student: `김민준` / `070318`
- Admin: `admin@etoos247.kr` / `admin1234`

## Routes

- `/login`
- `/dashboard`
- `/catalog`
- `/schedule`
- `/cart`
- `/admin`
- `/admin/students`
- `/admin/courses`
- `/admin/registrations`
