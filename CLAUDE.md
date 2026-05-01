# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Pre-implementation.** The repo currently contains a design document and a UI mock — no code, no `package.json`, no git history. The two sources of truth before doing any implementation work:

- `course_registration_webapp_blueprint_v2.md` — functional/architectural spec
- `design/student-mock.tsx` — visual spec for student-side pages (single-file React mock; **not** production code)

There are no build/lint/test commands yet. They will be added once the Next.js project is scaffolded (Phase 1 of the roadmap in §14 of the blueprint).

## Brand & Language

- **Brand:** ETOOS 247 이천기숙학원 (a Korean academy). All user-facing copy is **Korean** — login forms, nav labels, validation messages, emails, PDFs. English is acceptable in code, comments, identifiers, and admin-internal strings, but never in student-facing UI.
- **Visual identity:** primary `#2DAE9D` (teal). Full palette and font stack are baked into `design/student-mock.tsx` as the `C` and `FONT` constants — port these to Tailwind theme tokens / a `lib/design-tokens.ts` file when scaffolding rather than re-eyeballing colors.
- **Typography:** Pretendard (Korean-optimized). The font stack in the mock is the canonical fallback chain.
- **Card style:** border-only (`#EAECEE`), no drop shadows except on sticky action bars. Rounded `rounded-md` / `rounded-lg`. Status uses pill chips (gray / teal / warn / red / green), not colored borders.

## Mock-to-Blueprint Gaps

The mock simplifies several things that the real implementation must do properly:

- **Deadline banner** is hardcoded in the mock (`const deadline = '2026-04-30 23:59'`). Real impl must call `fn_can_student_modify` via Supabase RPC and reflect the *effective* deadline — global, manually-locked, or a per-student extension — per blueprint §6.
- **21-credit cap** is a magic number in the cart validation. Make this a per-semester/per-program setting, not a constant.
- **Prerequisites** are pre-marked `prereqsMet: true` in the mock data. Real impl joins against `student_completed_courses` and runs the check server-side before any registration commit.
- **Capacity** in the mock comes from a `enrolled` field in the row; in production this is `course_sections.enrolled_count` (denormalized, trigger-maintained) and the catalog must subscribe via Supabase Realtime so seat counts update live.
- **Login** in the mock is `학번 또는 이메일` + password. The blueprint specifies Supabase Auth with email/password + optional magic link — keep the visual treatment from the mock but wire it through `@supabase/ssr`.

## What This Will Be

A self-serve course registration webapp for a single academy of ~400 students. Two main user roles (Student, Admin/Super Admin). The non-obvious requirements that drive most of the architecture:

1. **Admin-configured semester timelines.** Each semester has five distinct dates (registration open/close, add/drop deadline, semester start/end). Admin can also manually lock registration, overriding the schedule.
2. **Per-student extensions.** After the global add/drop deadline, admins can grant individual students a custom deadline, scoped to an action (`add_only` / `drop_only` / `add_and_drop`) and optionally to a specific course. This is the feature most likely to leak complexity into other parts of the system — touch it carefully.

## Intended Stack

- **Next.js 14+ App Router** (frontend + API routes) on **Vercel**
- **Supabase**: Postgres, Auth, Storage, Realtime, Edge Functions
- TypeScript, Tailwind, **shadcn/ui**, TanStack Table, React Hook Form + Zod
- `exceljs` for Excel I/O, `@react-pdf/renderer` for PDFs, **Resend** for email
- `@supabase/ssr` for auth in Next.js (middleware-gated routes)

Don't substitute alternatives without checking with the user — the blueprint has reasoning for these specific choices (see §8 and §16).

## Load-Bearing Architectural Decisions

These come from §16 of the blueprint and should constrain any code you write:

1. **`fn_can_student_modify(student_id, semester_id, action)` is the single source of truth** for "can this student add/drop right now?" It lives as a Postgres function and is called from three places that must never disagree: client UI state (via Supabase RPC), Next.js API route authorization, and the RLS policy on `registrations`. If you add a fourth place that needs this answer, call the function — do not re-derive the logic.

2. **RLS is the security boundary, not the API layer.** Student isolation is enforced in Postgres so that even a buggy route handler cannot leak data. Don't write client code that assumes service-role access; the service-role key is server-only.

3. **Audit log is written via DB triggers**, not from app code, so it can't be skipped. When adding a new mutating operation, the trigger should already cover it — don't add app-level audit writes.

4. **Realtime seat counts** drive the catalog page; `course_sections.enrolled_count` is denormalized and kept in sync by trigger. Don't compute live seat counts from `registrations` in the read path.

5. **Extensions are scoped intentionally narrowly** (action + optional specific course). When implementing the grant flow, do not collapse scopes into a single "reopen for this student" boolean.

## Project Structure (planned, see blueprint §11)

App Router groups: `(public)` / `(student)` / `(admin)`. Supabase code under `lib/supabase/{client,server,admin}.ts` with the three-client split (browser / SSR / service-role) — keep them separate, don't unify.

Edge Functions live under `supabase/functions/` for heavy work that shouldn't run in a Next.js route: `excel-validate`, `excel-commit`, `send-extension-email`.

## When Asked to Implement

Cross-reference the blueprint sections rather than re-deriving:
- Database schema → §5
- Effective deadline logic → §6 (has SQL pseudocode)
- API surface → §7 (split between direct Supabase reads and Next.js routes)
- RLS policies → §9.1
- Page routes → §10
- Phased roadmap → §14

The blueprint is explicitly a "living spec" — if a decision changes during implementation, update the blueprint in the same commit.

---

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
