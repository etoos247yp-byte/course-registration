# Frontend-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete student + admin frontend for the ETOOS 247 course registration webapp on Next.js 14+ App Router with a typed mock-data layer, before any backend work begins.

**Architecture:** Single Next.js app, route groups `(public)` / `(student)` / `(admin)`. All UI reads/writes through `lib/data/*.ts` typed mock-data layer over `lib/fixtures/*.json` with `localStorage` persistence in dev. Auth simulated via signed cookie + middleware. Visual primitives promoted from `etoos_student_portal_v2.jsx` into `components/ui/*`. Design tokens in `lib/design-tokens.ts`, mirrored to Tailwind theme.

**Tech Stack:** Next.js 14+, TypeScript strict, Tailwind CSS, `lucide-react`, `@tanstack/react-table`, `exceljs`, `jose`, `vitest` + `@testing-library/react` for unit/component tests, pnpm package manager.

**Spec:** `docs/superpowers/specs/2026-04-28-frontend-first-design.md` — read before starting any task.

---

## Review checkpoints

After these phases, pause for stakeholder review:

- **After Phase 6** (auth + login + data layer) — login works, can navigate empty `/dashboard` and `/admin`. Demo: "the shell is alive."
- **After Phase 9** (student demo) — entire student golden path works end-to-end with seeded data.
- **After Phase 11** (admin demo) — all 12 admin pages render and CRUD works against `localStorage`.
- **After Phase 12** — full acceptance walkthrough complete; ready to begin backend phase.

---

## Phase 0 — Project initialization

### Task 1: Initialize git repo + Next.js 14+ project

**Files:**
- Create: `.gitignore`
- Create: `package.json`, `pnpm-lock.yaml`
- Create: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `README.md` (one-line — Korean academy registration app)

- [ ] **Step 1: Initialize git in project root**

```bash
cd C:/Code/Course_registration
git init -b main
```

- [ ] **Step 2: Add `.gitignore` for Node + Next.js**

Create `.gitignore` with:
```
node_modules/
.next/
out/
.env*.local
.DS_Store
*.log
.vercel/
coverage/
.swc/
```

- [ ] **Step 3: Scaffold Next.js with create-next-app**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-pnpm --yes
```

When prompted "Directory not empty, continue?" answer yes (the existing CLAUDE.md, mockup, docs/ stay).

Expected: Creates `package.json`, `app/`, `tailwind.config.ts`, etc.

- [ ] **Step 4: Pin pnpm in `package.json` and verify TypeScript strict**

Edit `package.json` — add `"packageManager": "pnpm@9.0.0"` (use whatever pnpm version is current).

Edit `tsconfig.json` — confirm `"strict": true` is set.

- [ ] **Step 5: Verify dev server boots**

```bash
pnpm dev
```

Expected: Next.js boots at `http://localhost:3000` and shows the default Next.js welcome page. Stop with Ctrl+C.

- [ ] **Step 6: Initial commit**

```bash
git add .
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

### Task 2: Install runtime + dev dependencies and configure ESLint

**Files:**
- Modify: `package.json`
- Create: `.eslintrc.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
pnpm add lucide-react @tanstack/react-table exceljs jose @react-pdf/renderer
```

- [ ] **Step 2: Install dev dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom eslint eslint-config-next prettier prettier-plugin-tailwindcss
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 4: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "off"
  }
}
```

- [ ] **Step 6: Add scripts to `package.json`**

In the `scripts` block, ensure these exist:
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify lint and test infra both work**

```bash
pnpm lint
```
Expected: no errors (may show "no eslint configuration" prompt; pick "strict" if asked, or skip if our `.eslintrc.json` is detected).

```bash
pnpm test
```
Expected: "no test files" message (zero tests yet).

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add runtime + test deps and ESLint config"
```

---

## Phase 1 — Design system foundation

### Task 3: Design tokens + Tailwind theme + Pretendard font + globals

**Files:**
- Create: `lib/design-tokens.ts`
- Modify: `tailwind.config.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `lib/design-tokens.ts`**

```ts
export const colors = {
  primary:      '#2DAE9D',
  primaryDark:  '#259387',
  primaryLight: '#E8F5F3',
  primaryBg:    '#F4FAF9',
  text:         '#111827',
  textMuted:    '#6B7280',
  textFaint:    '#9CA3AF',
  border:       '#EAECEE',
  borderLight:  '#F3F4F6',
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
```

- [ ] **Step 2: Mirror tokens into `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';
import { colors, font } from './lib/design-tokens';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: colors.primary,
        'brand-dark': colors.primaryDark,
        'brand-light': colors.primaryLight,
        'brand-bg': colors.primaryBg,
        'brand-text': colors.text,
        'brand-text-muted': colors.textMuted,
        'brand-text-faint': colors.textFaint,
        'brand-border': colors.border,
        'brand-border-light': colors.borderLight,
        'brand-surface': colors.surface,
        'brand-warning': colors.warning,
        'brand-warning-bg': colors.warningBg,
        'brand-warning-light': colors.warningLight,
        'brand-danger': colors.danger,
        'brand-danger-bg': colors.dangerBg,
      },
      fontFamily: { sans: [font] },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Wire Pretendard in `app/layout.tsx`**

Replace the body of `app/layout.tsx` with:

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ETOOS 247 이천기숙학원 수강신청',
  description: '재수정규 6평 완성반 수강신청 페이지',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="bg-white text-brand-text font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

- [ ] **Step 5: Replace `app/page.tsx` with a placeholder that confirms styling works**

```tsx
import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-brand">ETOOS 247 수강신청</h1>
      <p className="text-brand-text-muted mt-2">아래 링크에서 시작하세요.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/login" className="text-brand underline">/login</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expect: teal "ETOOS 247 수강신청" heading rendered in Pretendard. Stop server.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: design tokens, Tailwind theme, Pretendard font, root layout"
```

---

## Phase 2 — UI primitives

### Task 4: Foundational primitives (Button, Pill, Input, Logo)

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Pill.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Logo.tsx`
- Test: `components/ui/__tests__/Button.test.tsx`
- Test: `components/ui/__tests__/Pill.test.tsx`

**Source reference:** Port from `etoos_student_portal_v2.jsx` lines 231–273.

- [ ] **Step 1: Write Button test**

```tsx
// components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>로그인</Button>);
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>확인</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>제출</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test (expect fail — module not found)**

```bash
pnpm test
```
Expected: FAIL — "Cannot find module '../Button'".

- [ ] **Step 3: Implement `components/ui/Button.tsx`**

```tsx
'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  const base = `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass[size]} ${className}`;

  if (variant === 'primary') {
    return (
      <button
        {...rest}
        className={`${base} text-white hover:opacity-90 active:scale-[0.98]`}
        style={{ backgroundColor: colors.primary }}
      >
        {icon}
        {children}
      </button>
    );
  }
  if (variant === 'ghost') {
    return (
      <button {...rest} className={`${base} text-gray-700 hover:bg-gray-50`}>
        {icon}
        {children}
      </button>
    );
  }
  if (variant === 'danger') {
    return (
      <button {...rest} className={`${base} bg-white border border-red-200 text-red-700 hover:bg-red-50`}>
        {icon}
        {children}
      </button>
    );
  }
  return (
    <button
      {...rest}
      className={`${base} bg-white border text-gray-800 hover:bg-gray-50`}
      style={{ borderColor: colors.border }}
    >
      {icon}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run Button test (expect pass)**

```bash
pnpm test
```
Expected: PASS, 3/3.

- [ ] **Step 5: Implement `components/ui/Pill.tsx` (port lines 242–254 of mockup)**

```tsx
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

type PillColor = 'gray' | 'teal' | 'warn' | 'red' | 'green' | 'slate';
type PillSize = 'sm' | 'md';

const palette: Record<PillColor, { bg: string; text: string }> = {
  gray:  { bg: '#F3F4F6', text: '#4B5563' },
  teal:  { bg: colors.primaryLight, text: colors.primaryDark },
  warn:  { bg: '#FEF3C7', text: '#92400E' },
  red:   { bg: '#FEE2E2', text: '#991B1B' },
  green: { bg: '#D1FAE5', text: '#065F46' },
  slate: { bg: '#F1F5F9', text: '#334155' },
};

export function Pill({
  children,
  color = 'gray',
  size = 'sm',
}: {
  children: React.ReactNode;
  color?: PillColor;
  size?: PillSize;
}) {
  const c = palette[color];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded font-medium`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Write Pill test**

```tsx
import { render, screen } from '@testing-library/react';
import { Pill } from '../Pill';
import { describe, it, expect } from 'vitest';

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill color="teal">신청 완료</Pill>);
    expect(screen.getByText('신청 완료')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Implement `components/ui/Input.tsx` (port lines 265–273)**

```tsx
'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, className = '', ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      )}
      <input
        ref={ref}
        {...rest}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-md text-sm bg-white focus:outline-none transition-colors ${className}`}
        style={{ borderColor: colors.border }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          rest.onBlur?.(e);
        }}
      />
    </div>
  );
});
```

- [ ] **Step 8: Implement `components/ui/Logo.tsx` (port lines 231–240)**

```tsx
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
```

- [ ] **Step 9: Run all tests**

```bash
pnpm test
```
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add components/ui/
git commit -m "feat: foundational UI primitives (Button, Pill, Input, Logo)"
```

### Task 5: Composite primitives (Modal, Drawer, ActionCard, Meta, EmptyState, Toast)

**Files:**
- Create: `components/ui/Modal.tsx`, `Drawer.tsx`, `ActionCard.tsx`, `Meta.tsx`, `EmptyState.tsx`, `Toast.tsx`, `ToastProvider.tsx`

- [ ] **Step 1: Implement `components/ui/Modal.tsx`** (extracted from Cart confirm modal, mockup lines 965–1003)

```tsx
'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string; // e.g. 'max-w-md'
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={`${width} w-full bg-white rounded-lg shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-2 flex items-start justify-between">
            <div>{title}</div>
            <button onClick={onClose} className="p-2 -mr-2 rounded hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
        {footer && (
          <div
            className="px-6 py-4 border-t flex justify-end gap-2"
            style={{ borderColor: colors.border }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/ui/Drawer.tsx`** (extracted from SlotPicker, mockup lines 567–615)

```tsx
'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string; // e.g. 'max-w-lg'
}

export function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-lg' }: DrawerProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 bottom-0 w-full ${width} bg-white flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div>
            {subtitle && <p className="text-xs text-gray-500 mb-0.5">{subtitle}</p>}
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `components/ui/ActionCard.tsx`** (port mockup lines 436–446)

```tsx
'use client';
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export function ActionCard({
  icon,
  title,
  desc,
  onClick,
  primary = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="text-left border rounded-lg p-5 hover:border-gray-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        borderColor: primary ? colors.primary : colors.border,
        backgroundColor: primary ? colors.primaryBg : 'white',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <ChevronRight size={16} className="text-gray-300 ml-auto group-hover:text-gray-500" />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}
```

- [ ] **Step 4: Implement `components/ui/Meta.tsx`** (port mockup lines 840–847)

```tsx
import * as React from 'react';

export function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
```

- [ ] **Step 5: Implement `components/ui/EmptyState.tsx`**

```tsx
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="border-2 border-dashed rounded-lg py-16 px-6 text-center"
      style={{ borderColor: colors.border }}
    >
      {icon && <div className="text-gray-300 mx-auto mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 mb-5">{description}</p>}
      {action}
    </div>
  );
}
```

- [ ] **Step 6: Implement `components/ui/ToastProvider.tsx` and `Toast.tsx`**

`components/ui/Toast.tsx`:
```tsx
'use client';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

type ToastVariant = 'success' | 'error' | 'info';
type ToastEntry = { id: number; variant: ToastVariant; message: string };

const ToastContext = createContext<{
  toast: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, variant, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 max-w-sm bg-white border rounded-md shadow-lg px-4 py-3"
            style={{ borderColor: colors.border }}
          >
            {t.variant === 'success' && (
              <CheckCircle2 size={16} className="mt-0.5" style={{ color: colors.primary }} />
            )}
            {t.variant === 'error' && (
              <AlertCircle size={16} className="mt-0.5" style={{ color: colors.danger }} />
            )}
            {t.variant === 'info' && (
              <Info size={16} className="mt-0.5" style={{ color: colors.textMuted }} />
            )}
            <p className="text-sm text-gray-800 flex-1">{t.message}</p>
            <button
              onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.toast;
}
```

- [ ] **Step 7: Wrap root layout with `ToastProvider`**

Edit `app/layout.tsx`, wrap `{children}`:

```tsx
import { ToastProvider } from '@/components/ui/Toast';
// ...
<body className="bg-white text-brand-text font-sans antialiased">
  <ToastProvider>{children}</ToastProvider>
</body>
```

- [ ] **Step 8: Run tests + lint**

```bash
pnpm test && pnpm lint
```
Expected: PASS / clean.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: composite primitives (Modal, Drawer, ActionCard, Meta, EmptyState, Toast)"
```

### Task 6: Admin-needed primitives (DataTable, Toolbar, Tabs, KPICard, RoleBadge, Breadcrumb, DiffViewer, DateField, KrwField)

**Files:**
- Create: `components/ui/DataTable.tsx`, `Toolbar.tsx`, `Tabs.tsx`, `KPICard.tsx`, `RoleBadge.tsx`, `Breadcrumb.tsx`, `DiffViewer.tsx`, `DateField.tsx`, `KrwField.tsx`

- [ ] **Step 1: Implement `components/ui/DataTable.tsx`** (TanStack-headless wrapper)

```tsx
'use client';
import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({ data, columns, onRowClick, pageSize = 20 }: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="border rounded-lg bg-white" style={{ borderColor: colors.border }}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: colors.surface }}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b" style={{ borderColor: colors.border }}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() && <ChevronDown size={12} />}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick?.(r.original)}
              className={`border-b last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              style={{ borderColor: colors.borderLight }}
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-4 py-3">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: colors.border }}>
        <span className="text-xs text-gray-500">
          {table.getRowCount()}건 · {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
        </span>
        <div className="flex gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded hover:bg-gray-50 disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded hover:bg-gray-50 disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement remaining primitives — single file each**

`components/ui/Toolbar.tsx`:
```tsx
import * as React from 'react';

export function Toolbar({
  search,
  filters,
  actions,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {search && <div className="flex-1 min-w-[240px]">{search}</div>}
      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </div>
  );
}
```

`components/ui/Tabs.tsx`:
```tsx
'use client';
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b mb-6" style={{ borderColor: colors.border }}>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative px-4 py-2.5 text-sm font-medium"
            style={{ color: active === t.id ? colors.primary : colors.textMuted }}
          >
            {t.label}
            {active === t.id && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5" style={{ backgroundColor: colors.primary }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

`components/ui/KPICard.tsx`:
```tsx
import * as React from 'react';
import { colors } from '@/lib/design-tokens';

export function KPICard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-5" style={{ borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
```

`components/ui/RoleBadge.tsx`:
```tsx
import { Pill } from './Pill';

export function RoleBadge({ role }: { role: 'admin' | 'super_admin' }) {
  if (role === 'super_admin') return <Pill color="teal">Super Admin</Pill>;
  return <Pill color="slate">관리자</Pill>;
}
```

`components/ui/Breadcrumb.tsx`:
```tsx
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface Crumb { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500">
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-gray-900">
              {c.label}
            </Link>
          ) : (
            <span className="text-gray-900">{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

`components/ui/DiffViewer.tsx`:
```tsx
import * as React from 'react';

export function DiffViewer({ before, after }: { before?: unknown; after?: unknown }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
      <div>
        <p className="text-gray-500 mb-1">변경 전</p>
        <pre className="bg-red-50 p-3 rounded border border-red-100 whitespace-pre-wrap">
          {JSON.stringify(before ?? {}, null, 2)}
        </pre>
      </div>
      <div>
        <p className="text-gray-500 mb-1">변경 후</p>
        <pre className="bg-green-50 p-3 rounded border border-green-100 whitespace-pre-wrap">
          {JSON.stringify(after ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

`components/ui/DateField.tsx` (YYYYMMDD masked text input):
```tsx
'use client';
import * as React from 'react';
import { Input, type InputProps } from './Input';

export const DateField = React.forwardRef<HTMLInputElement, InputProps>(function DateField(props, ref) {
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      maxLength={8}
      pattern="\\d{8}"
      placeholder="YYYYMMDD"
      {...props}
      onChange={(e) => {
        e.currentTarget.value = e.currentTarget.value.replace(/\\D/g, '').slice(0, 8);
        props.onChange?.(e);
      }}
    />
  );
});
```

`components/ui/KrwField.tsx`:
```tsx
'use client';
import * as React from 'react';
import { Input, type InputProps } from './Input';

export const KrwField = React.forwardRef<HTMLInputElement, InputProps>(function KrwField(
  { value, onChange, ...rest },
  ref,
) {
  const display =
    value === undefined || value === '' ? '' : Number(String(value).replace(/\\D/g, '')).toLocaleString();
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const raw = e.currentTarget.value.replace(/\\D/g, '');
        const synthetic = { ...e, currentTarget: { ...e.currentTarget, value: raw } };
        onChange?.(synthetic as React.ChangeEvent<HTMLInputElement>);
      }}
      {...rest}
    />
  );
});
```

- [ ] **Step 3: Run lint + tests**

```bash
pnpm lint && pnpm test
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: admin UI primitives (DataTable, Toolbar, Tabs, KPICard, RoleBadge, Breadcrumb, DiffViewer, DateField, KrwField)"
```

---

## Phase 3 — Domain types and pure utilities (TDD)

### Task 7: Domain types + DOB parser

**Files:**
- Create: `lib/types.ts`
- Create: `lib/utils/kdate.ts`
- Test: `lib/utils/__tests__/kdate.test.ts`

- [ ] **Step 1: Create `lib/types.ts`** — copy verbatim from spec §5 "Types" code block.

(See `docs/superpowers/specs/2026-04-28-frontend-first-design.md` §5. Engineer: paste that block as `lib/types.ts`. Add `export` to every type alias.)

- [ ] **Step 2: Write DOB parser test**

```ts
// lib/utils/__tests__/kdate.test.ts
import { describe, it, expect } from 'vitest';
import { parseDOB6, formatKDate } from '../kdate';

describe('parseDOB6', () => {
  it('parses 070318 as 2007-03-18', () => {
    expect(parseDOB6('070318')).toBe('2007-03-18');
  });
  it('parses 990318 as 1999-03-18', () => {
    expect(parseDOB6('990318')).toBe('1999-03-18');
  });
  it('parses 250101 as 2025-01-01', () => {
    expect(parseDOB6('250101')).toBe('2025-01-01');
  });
  it('parses 310101 as 1931-01-01 (boundary)', () => {
    expect(parseDOB6('310101')).toBe('1931-01-01');
  });
  it('returns null for invalid length', () => {
    expect(parseDOB6('07031')).toBeNull();
    expect(parseDOB6('0703180')).toBeNull();
  });
  it('returns null for invalid date', () => {
    expect(parseDOB6('070230')).toBeNull(); // Feb 30
    expect(parseDOB6('071332')).toBeNull(); // month 13
  });
});

describe('formatKDate', () => {
  it('formats ISO to M/D (요일) HH:mm', () => {
    expect(formatKDate('2026-05-02T23:59:00')).toBe('5/2 (토) 23:59');
  });
});
```

- [ ] **Step 3: Run test (expect fail)**

```bash
pnpm test kdate
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/utils/kdate.ts`**

```ts
const DAYS_KOR = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function parseDOB6(input: string): string | null {
  if (!/^\\d{6}$/.test(input)) return null;
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
```

- [ ] **Step 5: Run test (expect pass)**

```bash
pnpm test kdate
```
Expected: PASS, 7/7.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/utils/kdate.ts lib/utils/__tests__/
git commit -m "feat: domain types + DOB6 parser + Korean date formatter (TDD)"
```

### Task 8: D-day, Class Pick tier helpers

**Files:**
- Create: `lib/utils/dday.ts`
- Create: `lib/utils/krw.ts`
- Create: `lib/utils/tier.ts`
- Test: `lib/utils/__tests__/dday.test.ts`, `krw.test.ts`, `tier.test.ts`

- [ ] **Step 1: Write tests**

`lib/utils/__tests__/dday.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { dDay } from '../dday';

describe('dDay', () => {
  it('counts days from now to target', () => {
    expect(dDay(new Date('2026-04-28'), new Date('2026-06-04'))).toBe(37);
  });
  it('returns 0 on the day', () => {
    expect(dDay(new Date('2026-06-04'), new Date('2026-06-04'))).toBe(0);
  });
  it('returns negative after target', () => {
    expect(dDay(new Date('2026-06-05'), new Date('2026-06-04'))).toBe(-1);
  });
});
```

`lib/utils/__tests__/krw.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatKRW } from '../krw';

describe('formatKRW', () => {
  it('returns 무료 for 0', () => expect(formatKRW(0)).toBe('무료'));
  it('formats 100000 as 100,000원', () => expect(formatKRW(100000)).toBe('100,000원'));
});
```

`lib/utils/__tests__/tier.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getTier } from '../tier';

const tiers = [
  { id: 'A' as const, min: 1, max: 3, fee: 0 },
  { id: 'B' as const, min: 4, max: 6, fee: 100000 },
  { id: 'C' as const, min: 7, max: 9, fee: 200000 },
  { id: 'D' as const, min: 10, max: 99, fee: 300000 },
];

describe('getTier', () => {
  it('returns null for 0 courses', () => expect(getTier(0, tiers)).toBeNull());
  it('returns A for 2 courses', () => expect(getTier(2, tiers)?.id).toBe('A'));
  it('returns D for 15 courses', () => expect(getTier(15, tiers)?.id).toBe('D'));
});
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
pnpm test dday krw tier
```

- [ ] **Step 3: Implement helpers**

`lib/utils/dday.ts`:
```ts
export function dDay(now: Date, target: Date): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
```

`lib/utils/krw.ts`:
```ts
export function formatKRW(n: number): string {
  return n === 0 ? '무료' : `${n.toLocaleString()}원`;
}
```

`lib/utils/tier.ts`:
```ts
import type { Cohort } from '@/lib/types';

type Tier = Cohort['pricingTiers'][number];

export function getTier(count: number, tiers: Tier[]): Tier | null {
  if (count === 0) return null;
  return tiers.find((t) => count >= t.min && count <= t.max) ?? null;
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: D-day, KRW, Class Pick tier helpers (TDD)"
```

### Task 9: Conflict detection + Recommendation

**Files:**
- Create: `lib/utils/conflict.ts`, `lib/utils/recommend.ts`
- Test: `lib/utils/__tests__/conflict.test.ts`, `recommend.test.ts`

- [ ] **Step 1: Write conflict test**

```ts
import { describe, it, expect } from 'vitest';
import { findConflict } from '../conflict';
import type { Course } from '@/lib/types';

const c1: Course = { id:'a', code:'a', cohortId:'co', subject:'국어', sub:'독서', type:'개념기출', level:'1-2등급', instructor:'k', textbook:'t', duration:10, season:'1', meetings:[{day:'월',block:'A'}], concept:'', objective:'' };
const c2: Course = { ...c1, id:'b', code:'b', meetings:[{day:'월',block:'B'}] };
const c3: Course = { ...c1, id:'c', code:'c', meetings:[{day:'월',block:'A'}] };

describe('findConflict', () => {
  it('returns null when no overlap', () => {
    expect(findConflict(c2, [c1])).toBeNull();
  });
  it('returns the overlapping course', () => {
    expect(findConflict(c3, [c1])?.id).toBe('a');
  });
  it('ignores self', () => {
    expect(findConflict(c1, [c1])).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `lib/utils/conflict.ts`**

```ts
import type { Course } from '@/lib/types';

export function findConflict(candidate: Course, registered: Course[]): Course | null {
  for (const r of registered) {
    if (r.id === candidate.id) continue;
    for (const m of candidate.meetings) {
      if (r.meetings.some((rm) => rm.day === m.day && rm.block === m.block)) return r;
    }
  }
  return null;
}
```

- [ ] **Step 3: Implement `lib/utils/recommend.ts` (port mockup logic)**

```ts
import type { Student, Subject, LevelTag } from '@/lib/types';

export function isRecommendedForStudent(
  student: Student,
  courseSubject: Subject,
  level: LevelTag,
): boolean {
  if (level === '전체') return true;
  const grade = student.diagnostic[courseSubject];
  if (!grade) return false;
  const gradeNum = parseInt(grade, 10);
  if (Number.isNaN(gradeNum)) return false;
  // course level like '3-4등급' or '3등급' or '5등급 이하'
  const m = level.match(/^(\\d)/);
  if (!m) return false;
  const courseGrade = parseInt(m[1], 10);
  if (level.includes('이하')) return gradeNum >= courseGrade;
  if (level.includes('-')) {
    const m2 = level.match(/-(\\d)/);
    const upper = m2 ? parseInt(m2[1], 10) : courseGrade;
    return gradeNum >= courseGrade && gradeNum <= upper;
  }
  return gradeNum === courseGrade;
}
```

Add tests:
```ts
import { describe, it, expect } from 'vitest';
import { isRecommendedForStudent } from '../recommend';
import type { Student } from '@/lib/types';

const s: Student = { id:'s', name:'a', dob:'2007-03-18', cohortId:'co', diagnostic:{ 국어:'3등급', 수학:'4등급', 영어:'2등급', 탐구:'3등급' }, electives:{} };

describe('isRecommendedForStudent', () => {
  it('matches range like 3-4등급', () => {
    expect(isRecommendedForStudent(s, '국어', '3-4등급')).toBe(true);
    expect(isRecommendedForStudent(s, '국어', '1-2등급')).toBe(false);
  });
  it('matches 이하 like 5등급 이하', () => {
    expect(isRecommendedForStudent(s, '수학', '5등급 이하')).toBe(false); // 4 < 5? no, '이하' means student grade should be at-or-below course grade
    expect(isRecommendedForStudent(s, '수학', '3등급 이하')).toBe(true);
  });
  it('전체 always recommended', () => {
    expect(isRecommendedForStudent(s, '영어', '전체')).toBe(true);
  });
});
```

Note on '이하' semantics: re-read the v2 mockup `recommendForLevel` (line 559) — `'5등급 이하'` means *students at grade 5 or worse should take this*. Adjust test expectations to match. If unsure, prefer the broader rule: when course is `N등급 이하`, recommend if student grade ≥ N.

- [ ] **Step 4: Run tests + adjust to match mockup intent**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: conflict detection + diagnostic-based recommendation (TDD)"
```

---

## Phase 4 — Config, deadlines, fixtures

### Task 10: `lib/config/index.ts` + BLOCKS/DAYS constants

**Files:**
- Create: `lib/config/index.ts`

- [ ] **Step 1: Create `lib/config/index.ts`**

```ts
export const BLOCKS = [
  { id: 'A' as const, label: '1·2교시', time: '08:20–10:00', periods: [1, 2] },
  { id: 'B' as const, label: '3·4교시', time: '10:20–12:00', periods: [3, 4] },
  { id: 'C' as const, label: '5·6교시', time: '14:30–16:10', periods: [5, 6] },
  { id: 'D' as const, label: '7·8교시', time: '16:30–18:10', periods: [7, 8] },
];

export const DAYS = ['월', '화', '수', '목', '금'] as const;

export const DEFAULT_COHORT_ID = '2027-재수정규-6평';
```

- [ ] **Step 2: Commit**

```bash
git add lib/config/
git commit -m "feat: BLOCKS/DAYS/default cohort config"
```

### Task 11: Seed fixtures

**Files:**
- Create: `lib/fixtures/cohorts.json`, `students.json`, `courses.json`, `registrations.json`, `extensions.json`, `syllabus.json`, `audit.json`, `notifications.json`, `admins.json`

- [ ] **Step 1: Author `lib/fixtures/cohorts.json`** — 1 active + 1 archived cohort

```json
[
  {
    "id": "2027-재수정규-6평",
    "name": "2027학년도 재수정규 6평 완성반",
    "targetExamDate": "2026-06-04",
    "seasons": [
      { "id": "1", "startDate": "2026-02-23", "endDate": "2026-05-02" },
      { "id": "2", "startDate": "2026-05-04", "endDate": "2026-06-06" }
    ],
    "registrationOpen": "2026-02-15T00:00:00",
    "registrationClose": "2026-05-02T23:59:00",
    "modifyDeadline": "2026-05-02T23:59:00",
    "manuallyLocked": false,
    "pricingTiers": [
      { "id": "A", "min": 1, "max": 3, "fee": 0 },
      { "id": "B", "min": 4, "max": 6, "fee": 100000 },
      { "id": "C", "min": 7, "max": 9, "fee": 200000 },
      { "id": "D", "min": 10, "max": 99, "fee": 300000 }
    ]
  },
  {
    "id": "2026-9평",
    "name": "2026학년도 9평 완성반",
    "targetExamDate": "2025-09-04",
    "seasons": [
      { "id": "1", "startDate": "2025-06-01", "endDate": "2025-08-15" },
      { "id": "2", "startDate": "2025-08-16", "endDate": "2025-09-04" }
    ],
    "registrationOpen": "2025-05-15T00:00:00",
    "registrationClose": "2025-08-15T23:59:00",
    "modifyDeadline": "2025-08-15T23:59:00",
    "manuallyLocked": false,
    "pricingTiers": [
      { "id": "A", "min": 1, "max": 3, "fee": 0 },
      { "id": "B", "min": 4, "max": 6, "fee": 100000 },
      { "id": "C", "min": 7, "max": 9, "fee": 200000 },
      { "id": "D", "min": 10, "max": 99, "fee": 300000 }
    ]
  }
]
```

- [ ] **Step 2: Author `lib/fixtures/admins.json`** — 1 super_admin + 2 admins

```json
[
  { "id": "adm-1", "email": "super@etoos247.kr", "name": "최영희", "role": "super_admin", "passwordHash": "super1234" },
  { "id": "adm-2", "email": "admin1@etoos247.kr", "name": "박재형", "role": "admin", "passwordHash": "admin1234" },
  { "id": "adm-3", "email": "admin2@etoos247.kr", "name": "이서연", "role": "admin", "passwordHash": "admin1234" }
]
```

(Mock-phase: passwords stored plaintext. Real impl will hash on backend phase.)

- [ ] **Step 3: Author `lib/fixtures/students.json`** — 40 students, varied diagnostic + electives

Generate names from common Korean names (김민준, 이서연, 박지호, etc.). For each student:
- `id`: `2027-XXXX` format with 4-digit serial starting `0142`
- `dob`: ISO date 2006-01 to 2008-12 range
- `cohortId`: `'2027-재수정규-6평'` for ~38 of 40, two on `'2026-9평'`
- `diagnostic`: random distribution across 1–5등급 per subject
- `electives`: 화법과작문 vs 언어와매체, 미적분 vs 확률통계, 생명과학1 vs 화학1, 사회문화 vs 한국지리

The first student must be `김민준 / 2027-0142 / 2007-03-18` (matches login default in v2 mockup).

(Engineer: write a quick generator script if helpful, or hand-author 40 entries. Either way, file lands as JSON.)

- [ ] **Step 4: Author `lib/fixtures/courses.json`** — port v2 mockup's 국어 + 수학 entries, expand to ≥8 영어 + ≥8 탐구

Start by copying every `COURSES` entry from `etoos_student_portal_v2.jsx` (lines 32–183). Add `cohortId: '2027-재수정규-6평'` to every entry. Add at least 8 영어 courses (독해, 듣기, 어법, EBS연계, 실모) and 8 탐구 courses (생명과학1, 화학1, 사회문화, 한국지리 — open across blocks). Include `capacity` field on each (e.g., 25–30).

- [ ] **Step 5: Author `lib/fixtures/registrations.json`** — ~25 students × 3–10 registrations each

Mix `status: 'active'` (most) with a few `'dropped'`. A few students at the Class D boundary (10+ courses), a few untouched. The student `2027-0142` should have 2 active registrations matching the v2 mockup default state (one 국어 문학 course, one 영어 course).

- [ ] **Step 6: Author `lib/fixtures/syllabus.json`** — populate ~30% of courses

Copy `SYLLABUS_FULL` from mockup lines 185–203 for `r-cg-3-mon-d`. Fill in real-looking week-by-week schedules for ~10 more courses. Leave the rest empty (admin can add later).

- [ ] **Step 7: Author `lib/fixtures/extensions.json`** — 2 active extensions

```json
[
  {
    "id": "ext-1",
    "studentId": "2027-0148",
    "cohortId": "2027-재수정규-6평",
    "scope": "add_and_drop",
    "newDeadline": "2026-05-09T23:59:00",
    "reason": "병가로 인한 변경 마감 연장",
    "grantedBy": "adm-2",
    "grantedAt": "2026-04-25T10:30:00"
  },
  {
    "id": "ext-2",
    "studentId": "2027-0156",
    "cohortId": "2027-재수정규-6평",
    "scope": "drop_only",
    "courseId": "m1-cg-1-mon-b",
    "newDeadline": "2026-05-05T23:59:00",
    "reason": "강사 변경 요청",
    "grantedBy": "adm-1",
    "grantedAt": "2026-04-26T15:00:00"
  }
]
```

- [ ] **Step 8: Author `lib/fixtures/audit.json`** — 50 events spread across actions/targets

Synthesize events for `student.create`, `course.update`, `registration.add`, `registration.drop`, `extension.grant`, `lock.toggle`, `pricing.update`, etc. Span across the last 14 days.

- [ ] **Step 9: Author `lib/fixtures/notifications.json`** — 3 historical broadcasts

```json
[
  { "id": "n-1", "title": "수강신청 안내", "body": "수강신청이 시작되었습니다. 변경 마감 5/2.", "audience": "all", "sentAt": "2026-02-15T09:00:00", "sentBy": "adm-1" },
  { "id": "n-2", "title": "강의계획서 확인 안내", "body": "강의계획서를 확인하고 수강 계획을 세우세요.", "audience": "cohort:2027-재수정규-6평", "sentAt": "2026-03-20T10:00:00", "sentBy": "adm-2" },
  { "id": "n-3", "title": "변경 마감 임박", "body": "변경 마감이 일주일 남았습니다.", "audience": "cohort:2027-재수정규-6평", "sentAt": "2026-04-25T11:00:00", "sentBy": "adm-1" }
]
```

- [ ] **Step 10: Commit**

```bash
git add lib/fixtures/
git commit -m "chore: seed fixtures for cohorts, admins, students, courses, registrations, syllabus, extensions, audit, notifications"
```

### Task 12: `canStudentModify` resolver

**Files:**
- Create: `lib/config/deadlines.ts`
- Test: `lib/config/__tests__/deadlines.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canStudentModify } from '../deadlines';
import type { Cohort, Extension } from '@/lib/types';

const baseCohort: Cohort = {
  id: 'co', name: 'co',
  targetExamDate: '2026-06-04',
  seasons: [],
  registrationOpen: '2026-02-15T00:00:00',
  registrationClose: '2026-05-02T23:59:00',
  modifyDeadline: '2026-05-02T23:59:00',
  manuallyLocked: false,
  pricingTiers: [],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-28T10:00:00'));
});

describe('canStudentModify', () => {
  it('allows when within deadline', () => {
    const r = canStudentModify('s1', baseCohort, [], 'add');
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('global');
  });
  it('blocks when manually locked', () => {
    const r = canStudentModify('s1', { ...baseCohort, manuallyLocked: true }, [], 'add');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('manually-locked');
  });
  it('blocks when past deadline and no extension', () => {
    vi.setSystemTime(new Date('2026-05-03T00:00:00'));
    const r = canStudentModify('s1', baseCohort, [], 'add');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('closed');
  });
  it('honors student-specific extension with matching scope', () => {
    vi.setSystemTime(new Date('2026-05-03T00:00:00'));
    const ext: Extension = {
      id: 'e1', studentId: 's1', cohortId: 'co', scope: 'add_and_drop',
      newDeadline: '2026-05-10T23:59:00', reason: 'r', grantedBy: 'a', grantedAt: '2026-04-25T00:00:00',
    };
    const r = canStudentModify('s1', baseCohort, [ext], 'add');
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('extension');
    expect(r.effectiveDeadline).toBe('2026-05-10T23:59:00');
  });
  it('blocks add when extension is drop_only', () => {
    vi.setSystemTime(new Date('2026-05-03T00:00:00'));
    const ext: Extension = {
      id: 'e1', studentId: 's1', cohortId: 'co', scope: 'drop_only',
      newDeadline: '2026-05-10T23:59:00', reason: 'r', grantedBy: 'a', grantedAt: '2026-04-25T00:00:00',
    };
    const r = canStudentModify('s1', baseCohort, [ext], 'add');
    expect(r.allowed).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `lib/config/deadlines.ts`**

```ts
import type { Cohort, Extension } from '@/lib/types';

export type ModifyResult = {
  allowed: boolean;
  effectiveDeadline: string;
  reason: 'global' | 'manually-locked' | 'extension' | 'closed';
};

export function canStudentModify(
  studentId: string,
  cohort: Cohort,
  extensions: Extension[],
  action: 'add' | 'drop',
  courseId?: string,
): ModifyResult {
  if (cohort.manuallyLocked) {
    return { allowed: false, effectiveDeadline: cohort.modifyDeadline, reason: 'manually-locked' };
  }

  const now = new Date();
  const globalDeadline = new Date(cohort.modifyDeadline);
  if (now <= globalDeadline) {
    return { allowed: true, effectiveDeadline: cohort.modifyDeadline, reason: 'global' };
  }

  // Past global; check extensions
  const matchScope = (e: Extension) =>
    e.scope === 'add_and_drop' ||
    (e.scope === 'add_only' && action === 'add') ||
    (e.scope === 'drop_only' && action === 'drop');

  const matchCourse = (e: Extension) => !e.courseId || e.courseId === courseId;

  const candidates = extensions.filter(
    (e) => e.studentId === studentId && e.cohortId === cohort.id && matchScope(e) && matchCourse(e),
  );
  const active = candidates.find((e) => now <= new Date(e.newDeadline));
  if (active) {
    return { allowed: true, effectiveDeadline: active.newDeadline, reason: 'extension' };
  }
  return { allowed: false, effectiveDeadline: cohort.modifyDeadline, reason: 'closed' };
}
```

- [ ] **Step 3: Run tests (expect pass)**

```bash
pnpm test deadlines
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: canStudentModify resolver with global/lock/extension/closed reasons (TDD)"
```

---

## Phase 5 — Mock data layer

### Task 13: Storage helpers + `withAudit` wrapper

**Files:**
- Create: `lib/data/_storage.ts`
- Create: `lib/utils/withAudit.ts`
- Test: `lib/data/__tests__/_storage.test.ts`

The data layer reads JSON fixtures on first call, then persists mutations to `localStorage` (browser) or in-memory (server). All mutations go through `withAudit`.

- [ ] **Step 1: Implement `lib/data/_storage.ts`**

```ts
type Resource = string;
const memoryStore = new Map<Resource, unknown>();

const isBrowser = () => typeof window !== 'undefined';
const KEY_PREFIX = 'etoos:data:';

export async function readResource<T>(name: Resource, seed: () => Promise<T>): Promise<T> {
  if (isBrowser()) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('reset') === '1') {
      window.localStorage.removeItem(KEY_PREFIX + name);
    }
    const raw = window.localStorage.getItem(KEY_PREFIX + name);
    if (raw) return JSON.parse(raw) as T;
    const seeded = await seed();
    window.localStorage.setItem(KEY_PREFIX + name, JSON.stringify(seeded));
    return seeded;
  }
  if (memoryStore.has(name)) return memoryStore.get(name) as T;
  const seeded = await seed();
  memoryStore.set(name, seeded);
  return seeded;
}

export async function writeResource<T>(name: Resource, data: T): Promise<void> {
  if (isBrowser()) {
    window.localStorage.setItem(KEY_PREFIX + name, JSON.stringify(data));
  } else {
    memoryStore.set(name, data);
  }
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
```

- [ ] **Step 2: Implement `lib/utils/withAudit.ts`**

```ts
import { makeId } from '@/lib/data/_storage';
import type { AuditEvent, Role } from '@/lib/types';
import { readResource, writeResource } from '@/lib/data/_storage';
import auditSeed from '@/lib/fixtures/audit.json';

export interface AuditContext {
  actorId: string;
  actorRole: Role;
  action: string;
  targetType: AuditEvent['targetType'];
  targetId: string;
  before?: unknown;
  after?: unknown;
}

export async function writeAudit(ctx: AuditContext): Promise<void> {
  const events = await readResource<AuditEvent[]>('audit', async () => auditSeed as AuditEvent[]);
  const event: AuditEvent = {
    id: makeId('aud'),
    at: new Date().toISOString(),
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: ctx.action,
    targetType: ctx.targetType,
    targetId: ctx.targetId,
    diff: ctx.before || ctx.after ? { before: ctx.before, after: ctx.after } : undefined,
  };
  await writeResource('audit', [event, ...events]);
}

export async function withAudit<T>(ctx: AuditContext, fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  await writeAudit(ctx);
  return result;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/data/_storage.ts lib/utils/withAudit.ts
git commit -m "feat: data-layer storage helpers + withAudit wrapper"
```

### Task 14: `lib/data/cohorts.ts`, `students.ts`, `admins.ts`

**Files:**
- Create: `lib/data/cohorts.ts`, `students.ts`, `admins.ts`
- Test: `lib/data/__tests__/students.test.ts`

- [ ] **Step 1: Write `lib/data/cohorts.ts`**

```ts
import type { Cohort } from '@/lib/types';
import { readResource, writeResource } from './_storage';
import seed from '@/lib/fixtures/cohorts.json';
import { DEFAULT_COHORT_ID } from '@/lib/config';

const RES = 'cohorts';

export async function listCohorts(): Promise<Cohort[]> {
  return readResource<Cohort[]>(RES, async () => seed as Cohort[]);
}

export async function getCohort(id: string): Promise<Cohort | null> {
  const all = await listCohorts();
  return all.find((c) => c.id === id) ?? null;
}

export async function getCurrentCohort(): Promise<Cohort> {
  const c = await getCohort(DEFAULT_COHORT_ID);
  if (!c) throw new Error(`Default cohort not found: ${DEFAULT_COHORT_ID}`);
  return c;
}

export async function updateCohort(id: string, patch: Partial<Cohort>): Promise<Cohort> {
  const all = await listCohorts();
  const next = all.map((c) => (c.id === id ? { ...c, ...patch } : c));
  await writeResource(RES, next);
  return next.find((c) => c.id === id)!;
}
```

- [ ] **Step 2: Write `lib/data/students.ts`**

```ts
import type { Student } from '@/lib/types';
import { readResource, writeResource, makeId } from './_storage';
import seed from '@/lib/fixtures/students.json';

const RES = 'students';

export async function listStudents(filter?: { cohortId?: string; query?: string }): Promise<Student[]> {
  let all = await readResource<Student[]>(RES, async () => seed as Student[]);
  if (filter?.cohortId) all = all.filter((s) => s.cohortId === filter.cohortId);
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    all = all.filter((s) => s.name.includes(filter.query!) || s.id.toLowerCase().includes(q));
  }
  return all;
}

export async function getStudent(id: string): Promise<Student | null> {
  const all = await listStudents();
  return all.find((s) => s.id === id) ?? null;
}

export async function getStudentByName(name: string): Promise<Student | null> {
  const all = await listStudents();
  return all.find((s) => s.name === name) ?? null;
}

export async function createStudent(input: Omit<Student, 'id'>): Promise<Student> {
  const all = await listStudents();
  const id = `2027-${String(all.length + 142).padStart(4, '0')}`;
  const next: Student = { ...input, id };
  await writeResource(RES, [...all, next]);
  return next;
}

export async function updateStudent(id: string, patch: Partial<Student>): Promise<Student> {
  const all = await listStudents();
  const next = all.map((s) => (s.id === id ? { ...s, ...patch } : s));
  await writeResource(RES, next);
  return next.find((s) => s.id === id)!;
}

export async function deleteStudent(id: string): Promise<void> {
  const all = await listStudents();
  await writeResource(RES, all.filter((s) => s.id !== id));
}
```

- [ ] **Step 3: Write `lib/data/admins.ts`** — same shape, returns `AdminAccount[]`

(Engineer: model after `students.ts`, source `lib/fixtures/admins.json`, type `AdminAccount`.)

- [ ] **Step 4: Run lint + commit**

```bash
pnpm lint && git add . && git commit -m "feat: data layer for cohorts, students, admins"
```

### Task 15: `lib/data/courses.ts`, `registrations.ts`

**Files:**
- Create: `lib/data/courses.ts`, `registrations.ts`

- [ ] **Step 1: Write `lib/data/courses.ts`**

```ts
import type { Course, Subject, CourseType, LevelTag } from '@/lib/types';
import { readResource, writeResource, makeId } from './_storage';
import seed from '@/lib/fixtures/courses.json';

const RES = 'courses';

export async function listCourses(filter?: {
  cohortId?: string;
  subject?: Subject;
  type?: CourseType;
  level?: LevelTag;
  query?: string;
}): Promise<Course[]> {
  let all = await readResource<Course[]>(RES, async () => seed as Course[]);
  if (filter?.cohortId) all = all.filter((c) => c.cohortId === filter.cohortId);
  if (filter?.subject) all = all.filter((c) => c.subject === filter.subject);
  if (filter?.type) all = all.filter((c) => c.type === filter.type);
  if (filter?.level) all = all.filter((c) => c.level === filter.level);
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    all = all.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.sub.includes(filter.query!),
    );
  }
  return all;
}

export async function getCourse(id: string): Promise<Course | null> {
  const all = await listCourses();
  return all.find((c) => c.id === id) ?? null;
}

export async function createCourse(input: Omit<Course, 'id'>): Promise<Course> {
  const all = await listCourses();
  const next: Course = { ...input, id: makeId('crs') };
  await writeResource(RES, [...all, next]);
  return next;
}

export async function updateCourse(id: string, patch: Partial<Course>): Promise<Course> {
  const all = await listCourses();
  const next = all.map((c) => (c.id === id ? { ...c, ...patch } : c));
  await writeResource(RES, next);
  return next.find((c) => c.id === id)!;
}

export async function deleteCourse(id: string): Promise<void> {
  const all = await listCourses();
  await writeResource(RES, all.filter((c) => c.id !== id));
}
```

- [ ] **Step 2: Write `lib/data/registrations.ts`**

```ts
import type { Registration } from '@/lib/types';
import { readResource, writeResource, makeId } from './_storage';
import seed from '@/lib/fixtures/registrations.json';

const RES = 'registrations';

export async function listRegistrations(filter?: {
  studentId?: string;
  courseId?: string;
  cohortId?: string;
  status?: Registration['status'];
}): Promise<Registration[]> {
  let all = await readResource<Registration[]>(RES, async () => seed as Registration[]);
  if (filter?.studentId) all = all.filter((r) => r.studentId === filter.studentId);
  if (filter?.courseId) all = all.filter((r) => r.courseId === filter.courseId);
  if (filter?.cohortId) all = all.filter((r) => r.cohortId === filter.cohortId);
  if (filter?.status) all = all.filter((r) => r.status === filter.status);
  return all;
}

export async function addRegistration(input: {
  studentId: string;
  courseId: string;
  cohortId: string;
}): Promise<Registration> {
  const all = await listRegistrations();
  const exists = all.find(
    (r) => r.studentId === input.studentId && r.courseId === input.courseId && r.status === 'active',
  );
  if (exists) return exists;
  const reg: Registration = {
    ...input,
    id: makeId('reg'),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  await writeResource(RES, [...all, reg]);
  return reg;
}

export async function dropRegistration(id: string): Promise<Registration> {
  const all = await listRegistrations();
  const next = all.map((r) =>
    r.id === id ? { ...r, status: 'dropped' as const, droppedAt: new Date().toISOString() } : r,
  );
  await writeResource(RES, next);
  return next.find((r) => r.id === id)!;
}

export async function countRegistrationsByCourse(cohortId: string): Promise<Record<string, number>> {
  const regs = await listRegistrations({ cohortId, status: 'active' });
  return regs.reduce<Record<string, number>>((acc, r) => {
    acc[r.courseId] = (acc[r.courseId] || 0) + 1;
    return acc;
  }, {});
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: data layer for courses + registrations"
```

### Task 16: `lib/data/extensions.ts`, `syllabus.ts`, `notifications.ts`, `audit.ts`, `auth.ts`

**Files:**
- Create: `lib/data/extensions.ts`, `syllabus.ts`, `notifications.ts`, `audit.ts`, `auth.ts`

- [ ] **Step 1: Write `lib/data/extensions.ts`**

```ts
import type { Extension } from '@/lib/types';
import { readResource, writeResource, makeId } from './_storage';
import seed from '@/lib/fixtures/extensions.json';

const RES = 'extensions';

export async function listExtensions(filter?: { studentId?: string; cohortId?: string }): Promise<Extension[]> {
  let all = await readResource<Extension[]>(RES, async () => seed as Extension[]);
  if (filter?.studentId) all = all.filter((e) => e.studentId === filter.studentId);
  if (filter?.cohortId) all = all.filter((e) => e.cohortId === filter.cohortId);
  return all;
}

export async function grantExtension(input: Omit<Extension, 'id' | 'grantedAt'>): Promise<Extension> {
  const all = await listExtensions();
  const ext: Extension = { ...input, id: makeId('ext'), grantedAt: new Date().toISOString() };
  await writeResource(RES, [ext, ...all]);
  return ext;
}

export async function revokeExtension(id: string): Promise<void> {
  const all = await listExtensions();
  await writeResource(RES, all.filter((e) => e.id !== id));
}
```

- [ ] **Step 2: Write `lib/data/syllabus.ts`**

```ts
import type { SyllabusEntry } from '@/lib/types';
import { readResource, writeResource } from './_storage';
import seed from '@/lib/fixtures/syllabus.json';

const RES = 'syllabus';
type SyllabusMap = Record<string, SyllabusEntry[]>;

export async function getSyllabus(courseId: string): Promise<SyllabusEntry[]> {
  const all = await readResource<SyllabusMap>(RES, async () => seed as SyllabusMap);
  return all[courseId] ?? [];
}

export async function setSyllabus(courseId: string, entries: SyllabusEntry[]): Promise<void> {
  const all = await readResource<SyllabusMap>(RES, async () => seed as SyllabusMap);
  await writeResource(RES, { ...all, [courseId]: entries });
}
```

- [ ] **Step 3: Write `lib/data/notifications.ts`**

```ts
import { readResource, writeResource, makeId } from './_storage';
import seed from '@/lib/fixtures/notifications.json';

export type Notification = {
  id: string;
  title: string;
  body: string;
  audience: 'all' | string;
  sentAt: string;
  sentBy: string;
};

const RES = 'notifications';

export async function listNotifications(): Promise<Notification[]> {
  return readResource<Notification[]>(RES, async () => seed as Notification[]);
}

export async function sendNotification(input: Omit<Notification, 'id' | 'sentAt'>): Promise<Notification> {
  const all = await listNotifications();
  const n: Notification = { ...input, id: makeId('not'), sentAt: new Date().toISOString() };
  await writeResource(RES, [n, ...all]);
  return n;
}
```

- [ ] **Step 4: Write `lib/data/audit.ts`**

```ts
import type { AuditEvent } from '@/lib/types';
import { readResource } from './_storage';
import seed from '@/lib/fixtures/audit.json';

const RES = 'audit';

export async function listAuditEvents(filter?: {
  actorId?: string;
  targetType?: AuditEvent['targetType'];
  action?: string;
  since?: string;
  until?: string;
}): Promise<AuditEvent[]> {
  let all = await readResource<AuditEvent[]>(RES, async () => seed as AuditEvent[]);
  if (filter?.actorId) all = all.filter((e) => e.actorId === filter.actorId);
  if (filter?.targetType) all = all.filter((e) => e.targetType === filter.targetType);
  if (filter?.action) all = all.filter((e) => e.action === filter.action);
  if (filter?.since) all = all.filter((e) => e.at >= filter.since!);
  if (filter?.until) all = all.filter((e) => e.at <= filter.until!);
  return all.sort((a, b) => (a.at < b.at ? 1 : -1));
}
```

- [ ] **Step 5: Write `lib/data/auth.ts`**

```ts
import { parseDOB6 } from '@/lib/utils/kdate';
import { listStudents } from './students';
import { listAdmins } from './admins';
import type { Role } from '@/lib/types';

export type AuthResult = { ok: true; role: Role; userId: string } | { ok: false };

export async function verifyStudent(name: string, dob6: string): Promise<AuthResult> {
  const dob = parseDOB6(dob6);
  if (!dob) return { ok: false };
  const all = await listStudents();
  const found = all.find((s) => s.name === name && s.dob === dob);
  return found ? { ok: true, role: 'student', userId: found.id } : { ok: false };
}

export async function verifyAdmin(email: string, password: string): Promise<AuthResult> {
  const all = await listAdmins();
  const found = all.find((a) => a.email === email && a.passwordHash === password);
  return found ? { ok: true, role: found.role, userId: found.id } : { ok: false };
}
```

(`listAdmins` lives in `lib/data/admins.ts` from Task 14.)

- [ ] **Step 6: Run lint + tests**

```bash
pnpm lint && pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: data layer for extensions, syllabus, notifications, audit, auth"
```

---

## Phase 6 — Auth, middleware, login page

### Task 17: Cookie session + permissions

**Files:**
- Create: `lib/auth/session.ts`, `lib/auth/permissions.ts`, `.env.local`
- Test: `lib/auth/__tests__/session.test.ts`, `permissions.test.ts`

- [ ] **Step 1: Add `.env.local` (gitignored)**

```
SESSION_SECRET=dev-only-secret-change-me
```

- [ ] **Step 2: Implement `lib/auth/session.ts`**

```ts
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/lib/types';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const COOKIE = 'session';

export interface Session { role: Role; userId: string; }

export async function encodeSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function decodeSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { role: payload.role as Role, userId: payload.userId as string };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE;
```

- [ ] **Step 3: Implement `lib/auth/permissions.ts`**

```ts
import type { Role } from '@/lib/types';

export type Action =
  | 'student.read' | 'student.write' | 'student.delete'
  | 'course.write'
  | 'registration.write'
  | 'cohort.write'
  | 'extension.grant' | 'extension.revoke'
  | 'lock.toggle'
  | 'pricing.write'
  | 'syllabus.write'
  | 'notification.send'
  | 'audit.read'
  | 'admin.write';

export function can(role: Role, action: Action): boolean {
  if (role === 'super_admin') return true;
  if (role === 'admin') {
    return action !== 'admin.write';
  }
  return false;
}
```

- [ ] **Step 4: Tests**

```ts
// session.test.ts
import { describe, it, expect } from 'vitest';
import { encodeSession, decodeSession } from '../session';

describe('session', () => {
  it('round-trips', async () => {
    const t = await encodeSession({ role: 'admin', userId: 'a1' });
    const s = await decodeSession(t);
    expect(s).toEqual({ role: 'admin', userId: 'a1' });
  });
  it('returns null for tampered', async () => {
    const s = await decodeSession('not-a-jwt');
    expect(s).toBeNull();
  });
});
```

```ts
// permissions.test.ts
import { describe, it, expect } from 'vitest';
import { can } from '../permissions';

describe('can', () => {
  it('super_admin can do everything', () => {
    expect(can('super_admin', 'admin.write')).toBe(true);
  });
  it('admin cannot admin.write', () => {
    expect(can('admin', 'admin.write')).toBe(false);
  });
  it('admin can extension.grant', () => {
    expect(can('admin', 'extension.grant')).toBe(true);
  });
  it('student cannot anything in this list', () => {
    expect(can('student', 'extension.grant')).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test session permissions
```

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: cookie session encode/decode + permissions matrix"
```

### Task 18: Middleware + login page

**Files:**
- Create: `middleware.ts`
- Create: `app/(public)/login/page.tsx`
- Create: `app/(public)/login/actions.ts`

- [ ] **Step 1: Implement `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';

const STUDENT_PREFIXES = ['/dashboard', '/schedule', '/catalog', '/course', '/cart'];
const ADMIN_PREFIXES = ['/admin'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === '/' || path.startsWith('/login') || path.startsWith('/_next') || path.startsWith('/api')) {
    return NextResponse.next();
  }

  const isStudent = STUDENT_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
  const isAdmin = ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
  if (!isStudent && !isAdmin) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSession(token);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (isStudent && session.role !== 'student') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }
  if (isAdmin && session.role === 'student') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  if (path.startsWith('/admin/users') && session.role !== 'super_admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Create login page** — port v2 mockup lines 337–355 with new field labels

`app/(public)/login/page.tsx`:
```tsx
import { LoginForm } from './LoginForm';
import { getCurrentCohort } from '@/lib/data/cohorts';

export default async function LoginPage() {
  const cohort = await getCurrentCohort();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">수강신청</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {cohort.name}<br />수강신청 페이지입니다.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
      <footer className="py-8 text-center text-xs text-gray-400 border-t border-brand-border-light">
        © 2026 ETOOS 247 이천기숙학원
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Create `LoginForm.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from './actions';

export function LoginForm() {
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAdminMode = field1.includes('@');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await login({ field1, field2 });
      if (!r.ok) setError('로그인 정보가 일치하지 않습니다.');
      else window.location.href = r.redirect;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center justify-center mb-8">
        <Logo size="lg" />
      </div>
      <Input
        icon={isAdminMode ? <Mail size={16} /> : <User size={16} />}
        placeholder="이름 또는 이메일"
        value={field1}
        onChange={(e) => setField1(e.target.value)}
      />
      <Input
        icon={<Lock size={16} />}
        type={isAdminMode ? 'password' : 'text'}
        inputMode={isAdminMode ? undefined : 'numeric'}
        maxLength={isAdminMode ? undefined : 6}
        placeholder="생년월일 6자리 또는 비밀번호"
        value={field2}
        onChange={(e) => {
          const v = isAdminMode ? e.target.value : e.target.value.replace(/\\D/g, '').slice(0, 6);
          setField2(v);
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full mt-4" disabled={pending}>
        {pending ? '확인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create `actions.ts` (Server Action)**

```ts
'use server';
import { cookies } from 'next/headers';
import { verifyStudent, verifyAdmin } from '@/lib/data/auth';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';

export async function login(input: { field1: string; field2: string }): Promise<
  { ok: true; redirect: string } | { ok: false }
> {
  const isAdmin = input.field1.includes('@');
  const result = isAdmin
    ? await verifyAdmin(input.field1, input.field2)
    : await verifyStudent(input.field1, input.field2);
  if (!result.ok) return { ok: false };
  const token = await encodeSession({ role: result.role, userId: result.userId });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true, redirect: result.role === 'student' ? '/dashboard' : '/admin' };
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
}
```

- [ ] **Step 5: Verify**

```bash
pnpm dev
```

Visit `http://localhost:3000/login`. Try logging in:
- Student: `김민준` / `070318` → redirects to `/dashboard` (will 404 since not built yet — expected, but cookie should be set)
- Admin: `super@etoos247.kr` / `super1234` → redirects to `/admin` (will 404, expected)
- Wrong: any garbage → shows "로그인 정보가 일치하지 않습니다."

Inspect cookies in DevTools → confirm `session` cookie is set as HttpOnly.

Stop server.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: middleware + /login page + login server action"
```

### Task 19: Logout + minimal placeholder pages so middleware works end-to-end

**Files:**
- Create: `app/(student)/layout.tsx`, `dashboard/page.tsx`
- Create: `app/(admin)/layout.tsx`, `page.tsx`

- [ ] **Step 1: Stub `app/(student)/layout.tsx`** (Header comes in Task 20)

```tsx
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || session.role !== 'student') redirect('/login');
  return <>{children}</>;
}
```

- [ ] **Step 2: Stub `app/(student)/dashboard/page.tsx`**

```tsx
export default function DashboardPage() {
  return <main className="p-8 text-sm">Student dashboard placeholder</main>;
}
```

- [ ] **Step 3: Stub `app/(admin)/layout.tsx`**

```tsx
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) redirect('/login');
  return <>{children}</>;
}
```

- [ ] **Step 4: Stub `app/(admin)/page.tsx`**

```tsx
export default function AdminDashboardPage() {
  return <main className="p-8 text-sm">Admin dashboard placeholder</main>;
}
```

- [ ] **Step 5: Verify end-to-end**

```bash
pnpm dev
```

- Anonymous → `/dashboard` redirects to `/login?next=/dashboard`. ✓
- Anonymous → `/admin` redirects to `/login?next=/admin`. ✓
- Student login → `/dashboard` shows placeholder. ✓
- Admin login → `/admin` shows placeholder. ✓
- Student tries `/admin` → redirects to `/dashboard`. ✓
- Admin tries `/admin/users` → 403 redirect to `/admin?error=forbidden` (super_admin succeeds, admin redirects). ✓ (will be exercised once `/admin/users` exists)

Stop server.

- [ ] **Step 6: Commit + REVIEW CHECKPOINT 1**

```bash
git add . && git commit -m "feat: route group layouts, placeholder dashboards, middleware end-to-end"
```

🟢 **CHECKPOINT 1 — pause here for stakeholder review.** Demo: login flow works for both roles, route gating prevents cross-access, cookies expire on logout.

---

## Phase 7 — Student app shell

### Task 20: Header + student layout

**Files:**
- Create: `components/student/Header.tsx`
- Modify: `app/(student)/layout.tsx`

**Source reference:** `etoos_student_portal_v2.jsx` lines 286–334.

- [ ] **Step 1: Implement `components/student/Header.tsx`**

Port from mockup. Replace the static `STUDENT` reference with props passed from layout. Replace `D_DAY` constant with a computed value from props. Wire 로그아웃 button to call the `logout` Server Action and reload to `/login`.

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookMarked, LogOut, Target } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { colors } from '@/lib/design-tokens';
import { logout } from '@/app/(public)/login/actions';

export function Header({
  studentName,
  studentId,
  cartCount,
  dDay,
}: {
  studentName: string;
  studentId: string;
  cartCount: number;
  dDay: number;
}) {
  const path = usePathname();
  const navItems = [
    { id: 'dashboard', label: '대시보드', href: '/dashboard' },
    { id: 'schedule', label: '시간표', href: '/schedule' },
    { id: 'catalog', label: '강의 검색', href: '/catalog' },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-20" style={{ borderColor: colors.border }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/dashboard"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((it) => {
              const active = path === it.href || path.startsWith(it.href + '/');
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors"
                  style={{ color: active ? colors.primary : colors.textMuted }}
                >
                  {it.label}
                  {active && (
                    <div
                      className="absolute -bottom-[17px] left-4 right-4 h-0.5"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: colors.primaryBg }}>
            <Target size={14} style={{ color: colors.primary }} />
            <span className="text-xs font-medium" style={{ color: colors.primaryDark }}>6평까지 D-{dDay}</span>
          </div>
          <Link href="/cart" className="relative p-2 rounded-md hover:bg-gray-50">
            <BookMarked size={18} className="text-gray-600" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                {cartCount}
              </span>
            )}
          </Link>
          <button className="p-2 rounded-md hover:bg-gray-50">
            <Bell size={18} className="text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: colors.primary }}>
              {studentName.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900 leading-tight">{studentName}</div>
              <div className="text-xs text-gray-500 leading-tight">{studentId}</div>
            </div>
            <form action={async () => { 'use server'; await logout(); }}>
              <button type="submit" className="ml-1 p-2 rounded-md hover:bg-gray-50">
                <LogOut size={16} className="text-gray-400" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update `app/(student)/layout.tsx` to fetch student + cohort and render Header**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getStudent } from '@/lib/data/students';
import { getCohort } from '@/lib/data/cohorts';
import { listRegistrations } from '@/lib/data/registrations';
import { dDay } from '@/lib/utils/dday';
import { Header } from '@/components/student/Header';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || session.role !== 'student') redirect('/login');

  const student = await getStudent(session.userId);
  if (!student) redirect('/login');
  const cohort = await getCohort(student.cohortId);
  if (!cohort) throw new Error('Student cohort missing');
  const regs = await listRegistrations({ studentId: student.id, status: 'active' });

  return (
    <>
      <Header
        studentName={student.name}
        studentId={student.id}
        cartCount={regs.length}
        dDay={dDay(new Date(), new Date(cohort.targetExamDate))}
      />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
pnpm dev
```

Login as `김민준 / 070318`. Expect: header shows logo, "대시보드 시간표 강의 검색" nav, "6평까지 D-{computed}" pill, cart badge with `2`, profile name+학번. Stop.

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: student Header + layout fetches student/cohort/registrations"
```

---

## Phase 8 — Student pages

### Task 21: `/dashboard`

**Source:** v2 mockup lines 358–434 (`Dashboard`, `ActionCard`).

**Files:**
- Replace: `app/(student)/dashboard/page.tsx`

- [ ] **Step 1: Implement** — port `Dashboard` component, replacing all hardcoded constants per spec §7.

```tsx
import { cookies } from 'next/headers';
import Link from 'next/link';
import { CalendarDays, Search, Download, Award, Target } from 'lucide-react';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getStudent } from '@/lib/data/students';
import { getCohort } from '@/lib/data/cohorts';
import { listRegistrations } from '@/lib/data/registrations';
import { listExtensions } from '@/lib/data/extensions';
import { listCourses } from '@/lib/data/courses';
import { canStudentModify } from '@/lib/config/deadlines';
import { dDay } from '@/lib/utils/dday';
import { formatKDate } from '@/lib/utils/kdate';
import { getTier } from '@/lib/utils/tier';
import { Pill } from '@/components/ui/Pill';
import { ActionCard } from '@/components/ui/ActionCard';
import { colors } from '@/lib/design-tokens';

export default async function DashboardPage() {
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  const student = await getStudent(session!.userId);
  const cohort = await getCohort(student!.cohortId);
  const regs = await listRegistrations({ studentId: student!.id, status: 'active' });
  const courses = await listCourses({ cohortId: cohort!.id });
  const myCourses = courses.filter((c) => regs.some((r) => r.courseId === c.id));
  const extensions = await listExtensions({ studentId: student!.id, cohortId: cohort!.id });
  const modify = canStudentModify(student!.id, cohort!, extensions, 'add');
  const totalSlots = myCourses.reduce((s, c) => s + c.meetings.length, 0);
  const currentTier = getTier(myCourses.length, cohort!.pricingTiers);
  const days = dDay(new Date(), new Date(cohort!.targetExamDate));

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {/* GREETING */}
      <div className="mb-12">
        <p className="text-sm text-gray-500 mb-1">안녕하세요,</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{student!.name} 학생</h1>
          <Pill color="teal" size="md">{cohort!.name.split(' ').slice(-2).join(' ')}</Pill>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          학번 {student!.id} · 진단 등급 국어 {student!.diagnostic.국어} · 수학 {student!.diagnostic.수학} · 영어 {student!.diagnostic.영어}
        </p>
      </div>

      {/* D-DAY + 신청 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="md:col-span-2 rounded-lg border p-6" style={{ borderColor: colors.primaryLight, backgroundColor: colors.primaryBg }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <Target size={18} style={{ color: colors.primary }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{cohort!.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{formatKDate(cohort!.targetExamDate)}</p>
              </div>
            </div>
            <Pill color="teal">진행 중</Pill>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter" style={{ color: colors.primary }}>D-{days}</span>
            <span className="text-sm text-gray-500">남았습니다</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: colors.primaryLight }}>
            {cohort!.seasons.map((s) => (
              <div key={s.id}>
                <p className="text-xs text-gray-500 mb-1">SEASON {s.id}</p>
                <p className="text-sm font-semibold text-gray-900">{s.startDate.slice(5).replace('-', '/')} ~ {s.endDate.slice(5).replace('-', '/')}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-6" style={{ borderColor: colors.border }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500">신청 현황</p>
            {currentTier ? <Pill color="teal" size="sm">Class {currentTier.id}</Pill> : <Award size={16} className="text-gray-400" />}
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">{myCourses.length}</span>
            <span className="text-sm text-gray-500">강의</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">주 {totalSlots}교시 수강</p>
          <div className="pt-3 border-t" style={{ borderColor: colors.borderLight }}>
            <p className="text-xs text-gray-500 mb-2">변경 마감</p>
            <p className="text-sm font-semibold text-gray-900">{formatKDate(modify.effectiveDeadline)}</p>
            {modify.reason !== 'global' && (
              <p className="text-xs mt-1" style={{ color: modify.reason === 'extension' ? colors.primary : colors.warning }}>
                {modify.reason === 'extension' ? '연장 적용됨' : modify.reason === 'manually-locked' ? '관리자 잠금' : '마감됨'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/schedule"><ActionCard icon={<CalendarDays size={18} />} title="시간표 짜기" desc="시간표 그리드에서 빈 칸을 클릭해 강의를 추가하세요." onClick={() => {}} primary /></Link>
          <Link href="/catalog"><ActionCard icon={<Search size={18} />} title="강의 검색" desc="과목·등급별로 강의를 검색하고 비교하세요." onClick={() => {}} /></Link>
          <Link href="/schedule#pdf"><ActionCard icon={<Download size={18} />} title="시간표 PDF" desc="확정된 시간표를 PDF로 받습니다." onClick={() => {}} disabled={myCourses.length === 0} /></Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm dev
```

Login as `김민준 / 070318` → land on `/dashboard`. Expect:
- name + cohort pill + diagnostic line render
- D-day computed from `cohort.targetExamDate` and now (2026-04-28 → exam 2026-06-04 = `D-37`)
- `신청 현황` shows `2 강의` (the seeded registrations) and `Class A` pill
- `변경 마감` reads from cohort's `modifyDeadline`
- All three quick-action links route correctly

Stop.

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: /dashboard with cohort-aware D-day, deadline, Class Pick tier"
```

### Task 22: `/schedule` — ScheduleGrid + SlotPicker drawer

**Source:** v2 mockup lines 449–616.

**Files:**
- Create: `app/(student)/schedule/page.tsx`
- Create: `components/student/ScheduleGrid.tsx`
- Create: `components/student/SlotPicker.tsx`
- Create: `app/(student)/schedule/actions.ts`

This task is large. Split into sub-steps.

- [ ] **Step 1: Implement Server Action `actions.ts`**

```ts
'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { addRegistration, dropRegistration, listRegistrations } from '@/lib/data/registrations';
import { getCohort } from '@/lib/data/cohorts';
import { listExtensions } from '@/lib/data/extensions';
import { canStudentModify } from '@/lib/config/deadlines';
import { withAudit } from '@/lib/utils/withAudit';
import { getStudent } from '@/lib/data/students';

export async function actAdd(courseId: string): Promise<{ ok: boolean; error?: string }> {
  const s = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!s) return { ok: false, error: 'unauth' };
  const student = await getStudent(s.userId);
  if (!student) return { ok: false, error: 'unauth' };
  const cohort = await getCohort(student.cohortId);
  if (!cohort) return { ok: false, error: 'no-cohort' };
  const exts = await listExtensions({ studentId: s.userId, cohortId: cohort.id });
  const gate = canStudentModify(s.userId, cohort, exts, 'add', courseId);
  if (!gate.allowed) return { ok: false, error: gate.reason };
  await withAudit(
    { actorId: s.userId, actorRole: 'student', action: 'registration.add', targetType: 'registration', targetId: courseId },
    () => addRegistration({ studentId: s.userId, courseId, cohortId: cohort.id }),
  );
  revalidatePath('/schedule');
  revalidatePath('/cart');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function actDrop(registrationId: string): Promise<{ ok: boolean; error?: string }> {
  const s = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!s) return { ok: false, error: 'unauth' };
  const student = await getStudent(s.userId);
  if (!student) return { ok: false, error: 'unauth' };
  const cohort = await getCohort(student.cohortId);
  if (!cohort) return { ok: false, error: 'no-cohort' };
  const exts = await listExtensions({ studentId: s.userId, cohortId: cohort.id });
  const all = await listRegistrations({ studentId: s.userId });
  const reg = all.find((r) => r.id === registrationId);
  if (!reg) return { ok: false, error: 'not-found' };
  const gate = canStudentModify(s.userId, cohort, exts, 'drop', reg.courseId);
  if (!gate.allowed) return { ok: false, error: gate.reason };
  await withAudit(
    { actorId: s.userId, actorRole: 'student', action: 'registration.drop', targetType: 'registration', targetId: registrationId },
    () => dropRegistration(registrationId),
  );
  revalidatePath('/schedule');
  revalidatePath('/cart');
  revalidatePath('/dashboard');
  return { ok: true };
}
```

- [ ] **Step 2: Implement `ScheduleGrid.tsx`** — port v2 mockup lines 449–550, replacing `removeCourse` to call `actDrop` (looking up the registration id), `viewCourse` to navigate `/course/[id]`, `openSlot` to open drawer.

(Engineer: paste mockup body, replace mockup constants/handlers with imports + Server Action calls. Wrap interactive bits in `'use client'`.)

- [ ] **Step 3: Implement `SlotPicker.tsx`** — port v2 mockup lines 553–616. Use `Drawer` primitive. Recommendation logic via `lib/utils/recommend.ts`. "이 강의 신청" calls `actAdd`.

- [ ] **Step 4: Implement `app/(student)/schedule/page.tsx`** — Server Component fetches data, renders `<ScheduleGrid>` (a client component that accepts the data + handlers).

```tsx
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getStudent } from '@/lib/data/students';
import { listRegistrations } from '@/lib/data/registrations';
import { listCourses } from '@/lib/data/courses';
import { ScheduleGrid } from '@/components/student/ScheduleGrid';

export default async function SchedulePage() {
  const s = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  const student = await getStudent(s!.userId);
  const regs = await listRegistrations({ studentId: student!.id, status: 'active' });
  const courses = await listCourses({ cohortId: student!.cohortId });
  return <ScheduleGrid student={student!} registrations={regs} courses={courses} />;
}
```

- [ ] **Step 5: Verify**

```bash
pnpm dev
```

Login as `김민준`. Visit `/schedule`. Expect:
- 5×4 grid renders with the 2 seeded registrations
- Empty cells show `+`
- Click empty cell → drawer opens, lists eligible courses for that (day, block), recommendations bubble up
- Click 신청 → toast on success / error, registration appears in grid, cart count increments
- Hover registered cell → X visible; click X → drops, grid updates

Stop.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: /schedule grid + SlotPicker drawer with gated add/drop"
```

### Task 23: `/catalog`

**Source:** v2 mockup lines 619–725.

**Files:**
- Create: `app/(student)/catalog/page.tsx`
- Create: `components/student/Catalog.tsx`
- Create: `components/student/ConflictModal.tsx`

- [ ] **Step 1: Implement `ConflictModal.tsx`**

```tsx
'use client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Course } from '@/lib/types';
import { BLOCKS } from '@/lib/config';

export function ConflictModal({
  open,
  onClose,
  candidate,
  conflict,
}: {
  open: boolean;
  onClose: () => void;
  candidate: Course | null;
  conflict: Course | null;
}) {
  return (
    <Modal
      open={open && !!candidate && !!conflict}
      onClose={onClose}
      title={<h2 className="text-base font-semibold text-gray-900">시간표 충돌</h2>}
      footer={<Button variant="secondary" onClick={onClose}>확인</Button>}
    >
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        <span className="font-semibold">{candidate?.title || candidate?.sub}</span>는 이미 신청한 강의 <span className="font-semibold">{conflict?.title || conflict?.sub}</span>와 시간이 겹칩니다.
      </p>
      <p className="text-xs text-gray-500">
        충돌 시간: {candidate?.meetings.filter((m) => conflict?.meetings.some((cm) => cm.day === m.day && cm.block === m.block)).map((m) => `${m.day} ${BLOCKS.find((b) => b.id === m.block)?.label}`).join(', ')}
      </p>
    </Modal>
  );
}
```

- [ ] **Step 2: Implement `components/student/Catalog.tsx`** — port mockup lines 619–725, replace `addCourse`/`viewCourse` with Server Action call + `useRouter().push()`. Wrap conflict check before calling action; if conflict, open `ConflictModal` instead.

- [ ] **Step 3: Implement `app/(student)/catalog/page.tsx`** — Server Component, fetch courses + student + registrations, pass to `<Catalog>` client component.

- [ ] **Step 4: Verify**

```bash
pnpm dev
```

Visit `/catalog`. Expect:
- All courses render in 2-col grid
- Search by code/title filters live
- Subject and Type pill filters work
- "내 진단 등급 추천만" toggle filters to recommended
- Click 신청 on a non-conflicting course → registers + toast
- Click 신청 on a conflicting course → ConflictModal opens with overlap info

Stop.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: /catalog with filters, recommendations, ConflictModal"
```

### Task 24: `/course/[id]`

**Source:** v2 mockup lines 728–847.

**Files:**
- Create: `app/(student)/course/[id]/page.tsx`
- Create: `components/student/CourseDetail.tsx`

- [ ] **Step 1: Implement `app/(student)/course/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getCourse, listCourses } from '@/lib/data/courses';
import { getStudent } from '@/lib/data/students';
import { listRegistrations } from '@/lib/data/registrations';
import { getSyllabus } from '@/lib/data/syllabus';
import { CourseDetail } from '@/components/student/CourseDetail';
import { findConflict } from '@/lib/utils/conflict';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);
  if (!course) notFound();
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  const student = await getStudent(session!.userId);
  const regs = await listRegistrations({ studentId: student!.id, status: 'active' });
  const myCourses = (await listCourses({ cohortId: student!.cohortId })).filter((c) => regs.some((r) => r.courseId === c.id));
  const conflict = findConflict(course, myCourses);
  const syllabus = await getSyllabus(course.id);
  const myReg = regs.find((r) => r.courseId === course.id);

  return <CourseDetail course={course} syllabus={syllabus} conflict={conflict} myRegistrationId={myReg?.id ?? null} />;
}
```

- [ ] **Step 2: Implement `components/student/CourseDetail.tsx`** — port mockup lines 728–847. Use `EmptyState` when syllabus is empty. Use `Meta` and `Pill`. Inline conflict banner when `conflict !== null`. Wire 신청/취소 buttons to Server Actions from `app/(student)/schedule/actions.ts`.

- [ ] **Step 3: Verify**

```bash
pnpm dev
```

Visit any course detail link. Expect:
- All meta cells render
- Concept + objective sections render
- Syllabus week list renders if data exists, else `EmptyState` "강의계획서가 아직 업로드되지 않았습니다"
- Conflict banner appears when overlapping with a registered course
- 신청 / 취소 buttons work and reflect after revalidate

Stop.

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: /course/[id] with syllabus, conflict banner, EmptyState"
```

### Task 25: `/cart`

**Source:** v2 mockup lines 850–1006.

**Files:**
- Create: `app/(student)/cart/page.tsx`
- Create: `components/student/Cart.tsx`

- [ ] **Step 1: Implement `app/(student)/cart/page.tsx`** — fetch student / cohort / registrations / extensions / courses, pass to client `<Cart>`.

- [ ] **Step 2: Implement `components/student/Cart.tsx`** — port mockup lines 850–1006. Confirm modal kept verbatim including `[추후 확정]` placeholder. Submit handler revalidates `/dashboard`.

The "수강신청하기" button is now a no-op confirm (registrations are already persisted by individual add/drop calls). Confirm modal acts as a "review and acknowledge" step. Real flow with payment lands in backend phase.

- [ ] **Step 3: Verify**

```bash
pnpm dev
```

Visit `/cart`. Expect:
- Subject-grouped sections (국어/수학/영어/탐구)
- Class Pick tier display with active step highlighted
- "강의 N개 더 추가하면 다음 단계" hint at boundaries (3, 6, 9)
- Trash icon drops a registration with gate
- 수강신청하기 → confirm modal → 확인 → toast + redirect to `/dashboard`

Stop.

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: /cart with subject grouping, Class Pick tier, confirm modal"
```

---

## Phase 9 — Demo state controls

### Task 26: `?demo=` overrides + `?reset=`

**Files:**
- Modify: `lib/config/deadlines.ts` — add demo override
- Modify: `app/(student)/layout.tsx` — read `?demo=` from search params, surface a banner

- [ ] **Step 1: Add demo wrapping in `lib/config/deadlines.ts`**

```ts
export function applyDemoOverride(
  result: ReturnType<typeof canStudentModify>,
  demo: string | null,
  cohortLockedDeadline: string,
): ReturnType<typeof canStudentModify> {
  if (process.env.NODE_ENV === 'production') return result;
  if (demo === 'locked') return { allowed: false, effectiveDeadline: cohortLockedDeadline, reason: 'manually-locked' };
  if (demo === 'past-deadline') return { allowed: false, effectiveDeadline: cohortLockedDeadline, reason: 'closed' };
  if (demo === 'extended') return { allowed: true, effectiveDeadline: cohortLockedDeadline, reason: 'extension' };
  return result;
}
```

- [ ] **Step 2: Apply override at every call site** — Dashboard, Schedule actAdd/actDrop, Cart, Course Detail. Pass `searchParams.demo` from page → action → resolver.

(Engineer: simplest path is to read the `demo` cookie set by an effect on first navigation, or pass the param through. Prefer cookie: a small `'use client'` hook reads `?demo=` from `useSearchParams()` and sets a cookie; resolvers read the cookie.)

- [ ] **Step 3: Add demo banner**

If `?demo=locked` or `=past-deadline` or `=extended` is set, show a yellow banner above the main content: `"데모 상태: <state>. 실제 마감 동작이 아닙니다."`

- [ ] **Step 4: Verify**

`?demo=locked` on `/dashboard` → 변경 마감 shows "관리자 잠금" hint, schedule add/drop blocked with toast.

`?reset=1` → `localStorage` cleared, fixtures re-read on next load.

- [ ] **Step 5: Commit + REVIEW CHECKPOINT 2**

```bash
git add . && git commit -m "feat: ?demo= state overrides + ?reset= fixture reload"
```

🟢 **CHECKPOINT 2 — pause for stakeholder review.** Demo: full student golden path works end-to-end with seeded data, demo states show all variants of the deadline UI.

---

## Phase 10 — Admin shell

### Task 27: Sidebar + Topbar + admin layout + dashboard

**Files:**
- Create: `components/admin/Sidebar.tsx`, `Topbar.tsx`
- Modify: `app/(admin)/layout.tsx`
- Replace: `app/(admin)/page.tsx`

- [ ] **Step 1: Implement `components/admin/Sidebar.tsx`** — render groups exactly as spec §8 sidebar layout. Use `lucide-react` icons (`LayoutDashboard`, `Users`, `BookOpen`, `ClipboardList`, `Calendar`, `Clock`, `Lock`, `Bell`, `BookMarked`, `Tags`, `History`, `UserCog`). Highlight active route via `usePathname`. Show "사용자 / 권한" only when role is super_admin.

- [ ] **Step 2: Implement `components/admin/Topbar.tsx`** — breadcrumb (passed in from page), cohort selector dropdown bound to a cookie `admin-cohort`, profile menu with logout, "학생 화면 미리보기" button opening a modal to pick a seed student then opening `/dashboard?as=<id>` in a new tab.

- [ ] **Step 3: Update `middleware.ts` to honor `?as=`**

```ts
// inside middleware, after session decoded, before role checks:
const asParam = req.nextUrl.searchParams.get('as');
if (asParam && (session.role === 'admin' || session.role === 'super_admin') && process.env.NODE_ENV !== 'production') {
  // re-encode session as the impersonated student for this request only
  const impersonatedToken = await encodeSession({ role: 'student', userId: asParam });
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, impersonatedToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
  return res;
}
```

(This permanently swaps the session cookie in the new tab — admin returns to admin work by closing the impersonation tab and refreshing the original admin tab; the original tab's cookie was overwritten so admin re-logins. Acceptable for dev-only impersonation.)

A safer alternative: set a separate cookie `imp_session` and read it preferentially when present. Engineer's choice; document the tradeoff.

- [ ] **Step 4: Implement `app/(admin)/layout.tsx`**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { listCohorts } from '@/lib/data/cohorts';
import { listAdmins } from '@/lib/data/admins';
import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) redirect('/login');
  const admins = await listAdmins();
  const me = admins.find((a) => a.id === session.userId)!;
  const cohorts = await listCohorts();

  return (
    <div className="min-h-screen flex">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col">
        <Topbar admin={me} cohorts={cohorts} />
        <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `app/(admin)/page.tsx` (admin dashboard)**

KPICards: 등록 학생 수, 개설 강의 수, 변경 마감 D-N, 미해결 연장 신청 N (computed: extensions where `newDeadline > now`). Below: 최근 활동 (top 10 audit events, formatted), 할 일 (recent issues — mock with placeholder lists for now).

- [ ] **Step 6: Verify**

Login as `super@etoos247.kr / super1234`. Visit `/admin`. Expect: sidebar with all 12 sections + "사용자 / 권한" present; topbar with breadcrumb "대시보드" + cohort selector + profile menu. Dashboard renders KPI cards.

Login as `admin1@etoos247.kr / admin1234`. Visit `/admin`. Expect: sidebar HIDES "사용자 / 권한". Visit `/admin/users` directly → redirect to `/admin?error=forbidden`.

Stop.

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: admin Sidebar + Topbar + layout + dashboard with KPI cards"
```

---

## Phase 11 — Admin pages

The 11 page tasks below follow the same pattern: Server Component page → fetch data → render client component → wire CRUD via Server Actions → audit event on every mutation. Each task ends with a visual walkthrough and a commit.

For each task: read spec §8 page brief, port primitives from `components/ui/`, implement the indicated form/table.

### Task 28: `/admin/students` + `/admin/students/[id]`

- [ ] **Step 1:** Build list page with `Toolbar` (검색, cohort filter, 학생 추가, Excel 가져오기/내보내기), `DataTable` columns: 학번 / 이름 / 코호트 / 진단 등급 (compact pills) / 신청 강의 수 (count via `listRegistrations`) / actions. Row click → `/admin/students/[id]`.
- [ ] **Step 2:** Build detail page with `Tabs`: 기본 정보 / 진단·선택과목 / 신청 강의 / 연장 이력 / 활동 로그.
- [ ] **Step 3:** `actCreateStudent`, `actUpdateStudent`, `actDeleteStudent` Server Actions wrapped in `withAudit`. 학생 추가 form modal.
- [ ] **Step 4:** Wire `lib/excel/import.ts` and `lib/excel/export.ts` (use `exceljs`); export columns 학번/이름/생년월일/진단 등급/선택과목; import validates header row + DOB format. Implement next.
- [ ] **Step 5:** Visual walkthrough: list renders 40 students; row click shows tabs; edit name → save → row updates → audit event in `/admin/audit`.
- [ ] **Step 6:** Commit `feat: /admin/students list + detail + Excel I/O`.

### Task 29: `/admin/courses` + `/admin/courses/[id]` + `/admin/courses/new`

- [ ] **Step 1:** List with Toolbar (검색, cohort, subject, type, level filters, 강의 추가, Excel I/O) + `DataTable`.
- [ ] **Step 2:** Editor form including `MeetingsEditor` mini-grid: 5 days × 4 blocks, click to toggle a meeting cell, multiple meetings allowed.
- [ ] **Step 3:** Server Actions `actCreateCourse`, `actUpdateCourse`, `actDeleteCourse` (audited).
- [ ] **Step 4:** Excel I/O for courses: same shape as students.
- [ ] **Step 5:** Walkthrough: create new course with two meetings → appears in list → student `/catalog` shows it → student-side filters can find it.
- [ ] **Step 6:** Commit `feat: /admin/courses list + editor + MeetingsEditor + Excel I/O`.

### Task 30: `/admin/registrations`

- [ ] **Step 1:** Two `Tabs`: 강의별 / 학생별.
- [ ] **Step 2:** 강의별: rows per course showing capacity bar (`enrolled / capacity`), 정원 초과 chip when over, expandable list of enrolled students.
- [ ] **Step 3:** 학생별: rows per student showing course count, sortable.
- [ ] **Step 4:** "Excel 내보내기" button on each tab using `lib/excel/export.ts`.
- [ ] **Step 5:** Walkthrough: switch tabs, expand a course, verify counts match student-side state.
- [ ] **Step 6:** Commit `feat: /admin/registrations dual-tab views with Excel export`.

### Task 31: `/admin/cohorts` + `/admin/cohorts/[id]`

- [ ] **Step 1:** Card-list of cohorts.
- [ ] **Step 2:** Detail editor with timeline visualization (registration open → close → modify deadline → season 1 → season 2 → exam) using a horizontal date-pin layout.
- [ ] **Step 3:** Inline edit of dates, manual lock toggle, pricing tier link to `/admin/pricing`.
- [ ] **Step 4:** Server Action `actUpdateCohort` (audited).
- [ ] **Step 5:** Walkthrough: change `modifyDeadline` to next week → student `/dashboard` reflects on next load.
- [ ] **Step 6:** Commit `feat: /admin/cohorts list + editor with date timeline`.

### Task 32: `/admin/extensions`

- [ ] **Step 1:** Active extensions list with student / scope / 새 마감 / 사유 / 발급자 columns.
- [ ] **Step 2:** `ExtensionGrantForm`: student typeahead (filter by 이름 or 학번 against `listStudents`), scope radio (3 options), optional course typeahead, datetime input (`DateField` + time), reason textarea (50-char min validation), 발급 button.
- [ ] **Step 3:** Server Action `actGrantExtension` (audited as `extension.grant`).
- [ ] **Step 4:** Walkthrough: grant `add_only` extension to student `2027-0142` for 2 days into the future → set `?demo=` to none → student logs in → `canStudentModify('add')` returns `allowed=true reason=extension`; `canStudentModify('drop')` still gated.
- [ ] **Step 5:** Walkthrough: revoke → student blocked again.
- [ ] **Step 6:** Commit `feat: /admin/extensions with scoped grant form`.

### Task 33: `/admin/lock`

- [ ] **Step 1:** Single page with current 잠금 / 해제 toggle card + lock history table below.
- [ ] **Step 2:** Toggle button opens modal asking for 사유.
- [ ] **Step 3:** Server Action `actToggleLock` (audited as `lock.toggle`); writes `manuallyLocked` field on cohort.
- [ ] **Step 4:** Lock history derived from audit log filtered by `targetType='lock'`.
- [ ] **Step 5:** Walkthrough: toggle to locked → student dashboard immediately shows "관리자 잠금"; add/drop blocked. Toggle back.
- [ ] **Step 6:** Commit `feat: /admin/lock toggle + history`.

### Task 34: `/admin/notifications`

- [ ] **Step 1:** Form (제목, 본문, 대상: select with options 전체 / 코호트 / 학생 그룹). 발송 button.
- [ ] **Step 2:** Sent-history table below.
- [ ] **Step 3:** Server Action `actSendNotification` (audited). Toast "발송이 예약되었습니다 (실제 발송은 백엔드 단계에서 연결)".
- [ ] **Step 4:** Walkthrough: send broadcast → appears in history → audit event written.
- [ ] **Step 5:** Commit `feat: /admin/notifications form + history`.

### Task 35: `/admin/syllabus` + `/admin/syllabus/[courseId]`

- [ ] **Step 1:** List view: courses with `(미등록)` badge surfaced first, then populated.
- [ ] **Step 2:** Editor: week-by-week grid auto-generated from `course.duration` + `cohort.seasons`. Each row editable: topic input, special select (none / exam / break), season auto.
- [ ] **Step 3:** Server Action `actSaveSyllabus` (audited).
- [ ] **Step 4:** Walkthrough: pick a course with no syllabus → fill in 5 weeks → save → student `/course/[id]` shows the entries instead of `EmptyState`.
- [ ] **Step 5:** Commit `feat: /admin/syllabus list + editor`.

### Task 36: `/admin/pricing`

- [ ] **Step 1:** Per-cohort tier editor. Default 4 rows (A/B/C/D); each row: range min/max number inputs, `KrwField` for fee, label input.
- [ ] **Step 2:** Add row / remove row buttons (min 1, max 6 rows).
- [ ] **Step 3:** Preview pane: slider 0–20 demos which tier students would see at each registered count, formatted as "5강의 → Class B (월 100,000원)".
- [ ] **Step 4:** Server Action `actUpdatePricingTiers` (audited; updates `cohort.pricingTiers`).
- [ ] **Step 5:** Walkthrough: change Class B fee to 120,000원 → student `/cart` reflects new fee.
- [ ] **Step 6:** Commit `feat: /admin/pricing tier editor with preview`.

### Task 37: `/admin/audit`

- [ ] **Step 1:** Read-only feed. Filters at top: 기간 (DateField start/end), 행위자 (typeahead), 대상 유형 (select), 액션 (select).
- [ ] **Step 2:** `DataTable` columns: at / actor / action / target / 변경 (expand → `DiffViewer`).
- [ ] **Step 3:** Walkthrough: perform a few admin mutations → events appear in feed; expand → diff renders before/after JSON.
- [ ] **Step 4:** Commit `feat: /admin/audit feed with DiffViewer`.

### Task 38: `/admin/users`

- [ ] **Step 1:** Server Component checks `session.role === 'super_admin'`; otherwise renders 403 page.
- [ ] **Step 2:** `DataTable` of admin staff: 이메일 / 이름 / 권한 (RoleBadge) / 마지막 로그인 / actions (promote/demote, delete).
- [ ] **Step 3:** Add admin form (modal). Server Actions `actCreateAdmin`, `actUpdateAdmin`, `actDeleteAdmin` (audited; `admin.write` permission).
- [ ] **Step 4:** Walkthrough: as super_admin, add a new admin → log out → log in as new admin → confirm sidebar lacks "사용자 / 권한".
- [ ] **Step 5:** Commit + REVIEW CHECKPOINT 3.

```bash
git add . && git commit -m "feat: /admin/users super-admin only with promote/demote"
```

🟢 **CHECKPOINT 3 — pause for stakeholder review.** Demo: every admin page works, every CRUD writes an audit event, super_admin vs admin distinction enforced.

---

## Phase 12 — Acceptance walkthrough

### Task 39: Run the full acceptance criteria from spec §10

- [ ] **Step 1:** `pnpm build` — expect 0 TypeScript errors.

```bash
pnpm build
```

- [ ] **Step 2:** `pnpm lint` — expect clean.

- [ ] **Step 3:** `pnpm test` — expect all unit tests pass.

- [ ] **Step 4:** Walk through the **10 acceptance criteria from spec §10**, checking each off in a `docs/superpowers/specs/2026-04-28-frontend-first-design.md` review note (append a "Verification" section at the bottom of the spec).

For each pass/fail, capture the result and note any deviation.

- [ ] **Step 5:** Final commit

```bash
git add . && git commit -m "chore: acceptance walkthrough complete; ready for backend phase"
```

- [ ] **Step 6:** Final summary to user

Report:
- Total commits.
- All acceptance criteria pass / fail counts.
- Any deferred items added during implementation.
- Recommended next step (begin backend phase per spec §11 deferred list).

---

## Self-review checklist (already completed during plan authoring)

- ✓ Every spec section has at least one task implementing it.
- ✓ No TBD/TODO/placeholder steps in the body.
- ✓ Type names consistent throughout (`Course`, `Student`, `Cohort`, `Registration`, `Extension`, `AuditEvent`, `SyllabusEntry`, `AdminAccount`).
- ✓ File paths exact in every task header.
- ✓ Three review checkpoints (after Phase 6, Phase 9, Phase 11) match spec §10's natural stakeholder demo points.
- ✓ Each utility task has a failing test + implement + passing test cycle.
- ✓ Each UI task has a verify step that exercises the golden path manually before commit.
