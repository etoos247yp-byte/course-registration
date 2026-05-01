# Frontend-First Build — Design Spec

**Date:** 2026-04-28
**Author:** brainstormed with Claude
**Status:** awaiting user review of written spec

---

## 1. Summary

Build the entire frontend for the ETOOS 247 이천기숙학원 course registration webapp before backend work begins. The frontend covers two roles:

- **Student** — port of the v2 mockup (`etoos_student_portal_v2.jsx`, 1066 lines): Login, Dashboard, Schedule grid + SlotPicker drawer, Catalog, Course Detail, Cart.
- **Admin / Super Admin** — designed from scratch in the same visual language: dashboard + 11 management pages (Tier 3 scope).

The frontend reads/writes through a typed mock-data layer at `lib/data/*.ts` whose function signatures are shaped to match the eventual Supabase queries. When backend work begins, those files are the only place that changes.

## 2. Goals and non-goals

**In scope (this phase):**

- Next.js 14+ App Router scaffold, TypeScript strict, Tailwind, no shadcn/ui (custom primitives promoted from v2 mockup).
- All student pages from the v2 mockup, ported to file-system routes.
- All Tier 3 admin pages: students, courses, registrations, cohorts, extensions, lock, notifications, syllabus, pricing, audit, users.
- Single `/login` page. Students authenticate with `이름 + 생년월일 6자리`; admins authenticate with `email + password`. Mock auth via signed cookie + middleware.
- `lib/data/*.ts` typed mock-data layer over `lib/fixtures/*.json` with `localStorage` persistence in dev.
- Demo state controls (`?demo=locked`, `?demo=past-deadline`, `?demo=extended`) for stakeholder review.
- `lib/design-tokens.ts` as single source of truth for color and font; mirrored into `tailwind.config.ts`.

**Explicitly deferred to backend phase:**

- Supabase project, Postgres schema, RLS policies, Edge Functions.
- Real email via Resend (`/admin/notifications` records to mock fixture, no actual send).
- PDF generation via `@react-pdf/renderer` (the `시간표 PDF 다운로드` button shows a "준비 중" toast for now; `인쇄` uses native `window.print()`).
- Excel `validate` / `commit` Edge Functions (mock-phase import is in-memory).
- Real audit-log triggers (mock-phase audit events are written through `lib/utils/withAudit.ts`; same call site, different impl when Supabase lands).
- Real `fn_can_student_modify` Postgres function (mock-phase resolver in `lib/config/deadlines.ts` exposes the same signature).
- Realtime seat counts (mock-phase polls; subscription wiring is a swap inside `lib/data/courses.ts`).
- Payment integration (Cart confirm modal keeps the `[추후 확정]` placeholder).

**Out of scope entirely (this spec):**

- Mobile-native apps.
- Internationalization (Korean only).
- Self-service password reset for admins (admin accounts are pre-issued by the academy operator).

## 3. Stack and project structure

### Stack

- Next.js 14+, App Router, TypeScript strict, Tailwind CSS.
- Pretendard via CDN `<link>` (switches to `next/font/local` in backend phase).
- `lucide-react` icons.
- `@tanstack/react-table` headless for `DataTable`.
- `exceljs` for Excel I/O (mock-phase used in-browser).
- `jose` for cookie session signing.
- No shadcn/ui preinstalled. Add individual shadcn primitives only on demand if a custom build would be churn (e.g., `Combobox`, `DropdownMenu`).

### File tree

```
app/
  (public)/
    login/page.tsx
  (student)/
    layout.tsx                     # Header + main, gates role=student
    dashboard/page.tsx
    schedule/page.tsx
    catalog/page.tsx
    course/[id]/page.tsx
    cart/page.tsx
  (admin)/
    layout.tsx                     # Sidebar + topbar + breadcrumb, gates role in (admin, super_admin)
    page.tsx                       # admin dashboard
    students/page.tsx
    students/[id]/page.tsx
    courses/page.tsx
    courses/[id]/page.tsx
    courses/new/page.tsx
    registrations/page.tsx
    cohorts/page.tsx
    cohorts/[id]/page.tsx
    extensions/page.tsx
    lock/page.tsx
    notifications/page.tsx
    syllabus/page.tsx
    syllabus/[courseId]/page.tsx
    pricing/page.tsx
    audit/page.tsx
    users/page.tsx                 # super_admin only
  api/                             # empty for now; backend phase fills in
  layout.tsx
  globals.css
  not-found.tsx

components/
  ui/
    Button.tsx, Pill.tsx, Input.tsx, Logo.tsx, ActionCard.tsx, Meta.tsx,
    Modal.tsx, Drawer.tsx,
    DataTable.tsx, EmptyState.tsx, Breadcrumb.tsx, Toolbar.tsx, Tabs.tsx,
    KPICard.tsx, RoleBadge.tsx, DiffViewer.tsx, DateField.tsx, KrwField.tsx,
    Toast.tsx
  student/
    Header.tsx, Dashboard.tsx, ScheduleGrid.tsx, SlotPicker.tsx,
    Catalog.tsx, CourseDetail.tsx, Cart.tsx, ConflictModal.tsx
  admin/
    Sidebar.tsx, Topbar.tsx, PageHeader.tsx,
    StudentsTable.tsx, StudentDetail.tsx,
    CoursesTable.tsx, CourseEditor.tsx, MeetingsEditor.tsx,
    RegistrationsByCourse.tsx, RegistrationsByStudent.tsx,
    CohortsList.tsx, CohortEditor.tsx,
    ExtensionGrantForm.tsx, ExtensionsList.tsx,
    LockToggle.tsx, LockHistory.tsx,
    NotificationForm.tsx, NotificationsHistory.tsx,
    SyllabusEditor.tsx, SyllabusList.tsx,
    PricingTierEditor.tsx, PricingPreview.tsx,
    AuditFeed.tsx,
    UsersTable.tsx

lib/
  data/                            # the swap-to-Supabase boundary
    students.ts
    courses.ts
    registrations.ts
    cohorts.ts
    extensions.ts
    syllabus.ts
    pricing.ts
    audit.ts
    notifications.ts
    auth.ts
  fixtures/
    students.json
    courses.json
    cohorts.json
    registrations.json
    extensions.json
    syllabus.json
    audit.json
    notifications.json
    admins.json
  config/
    index.ts                       # BLOCKS, DAYS, DEFAULT_COHORT_ID
    deadlines.ts                   # canStudentModify(student, cohort, action)
  auth/
    session.ts                     # encode/decode session cookie
    permissions.ts                 # can(role, action)
  excel/
    import.ts, export.ts
  utils/
    dday.ts, kdate.ts, krw.ts, conflict.ts, recommend.ts, withAudit.ts, guard.ts
  types.ts
  design-tokens.ts

middleware.ts                      # role cookie -> route group gating
tailwind.config.ts                 # theme.colors mirrors design-tokens
next.config.ts
tsconfig.json
```

### Conventions

- **Pages never import from `lib/fixtures/*`.** They go through `lib/data/*.ts`. The data files are the only place that changes when Supabase lands.
- **No module-load constants for time-sensitive values.** D-day, deadlines, blocks, pricing tiers, and "current cohort" are read through `lib/config/`. The v2 mockup's `TARGET_DATE`, `TODAY`, `D_DAY` constants do not survive the port.
- **`components/ui/*`** is the visual contract (the v2 mockup's primitive language). `components/student/*` and `components/admin/*` compose them.
- **Styling rule of thumb:** prefer `className="bg-brand text-white"` for static styling. Use inline `style={{ backgroundColor: colors.x }}` only when the token name is computed at render time (e.g., `levelColor(course.level)`).
- **CLAUDE.md "Universal CSS styles" idea** is realized as `lib/design-tokens.ts`. CLAUDE.md gets a one-line pointer rather than inlined values.

## 4. Auth and route gating

### Login flow

```
/login   POST { field1, field2 }
  -> if field1 contains '@': auth.verifyAdmin(email=field1, pw=field2)
     else:                   auth.verifyStudent(name=field1, dob6=field2)
  -> on success: write signed cookie `session` { role, userId, exp }
  -> redirect by role: student -> /dashboard, admin -> /admin

middleware.ts (every request)
  -> read + verify session cookie
  -> /(student)/* requires role='student'
  -> /(admin)/*   requires role in ('admin','super_admin')
  -> /admin/users requires role='super_admin'
  -> unauthenticated request to gated path -> redirect to /login?next=<path>
```

### Form behavior

Single form on `/login`, two visible fields.

- Field 1 placeholder: `이름 또는 이메일`. Input type `text`.
- Field 2 placeholder: `생년월일 6자리 또는 비밀번호`. When field 1 contains no `@`, field 2 applies a 6-digit numeric mask (YYMMDD); when field 1 contains `@`, field 2 becomes type `password`.
- Submit dispatches based on field 1 content.
- Single error string regardless of which path failed: `로그인 정보가 일치하지 않습니다.`

### DOB parsing

`070318` → year `2007`, month `03`, day `18`. Year prefix rule: `YY <= 30 → 2000+YY`, `YY > 30 → 1900+YY`. Implemented in `lib/utils/kdate.ts`.

### Admin accounts

Pre-issued by the academy operator. Self-signup not exposed. Password reset flow not in scope (admin emails the operator). Mock fixtures seed two admin and one super_admin account.

### Permissions

Single source of truth: `lib/auth/permissions.ts → can(role, action)`. Used by middleware and by `<Show when={can('extension.grant')}>` UI guards. Non-super_admin reaching `/admin/users` gets a 403 page.

## 5. Domain model and data layer

### Types (`lib/types.ts`, abridged)

```ts
type Role = 'student' | 'admin' | 'super_admin';

type Subject = '국어' | '수학' | '영어' | '탐구';
type SubKor = '독서' | '문학' | '화작' | '언매' | '실모' | '수1' | '수2' | '미적분' | string;
type CourseType = '개념기출' | '유형테마' | 'N제실모';
type LevelTag = '1-2등급' | '3등급' | '3-4등급' | '5등급 이하' | '전체' | string;
type BlockId = 'A' | 'B' | 'C' | 'D';
type DayKor = '월' | '화' | '수' | '목' | '금';

type Meeting = { day: DayKor; block: BlockId };

type Course = {
  id: string;
  code: string;
  cohortId: string;
  subject: Subject;
  sub: SubKor;
  type: CourseType;
  level: LevelTag;
  title?: string;
  instructor: string;
  textbook: string;
  duration: number;
  season: '1' | '2' | '1-2';
  meetings: Meeting[];
  concept: string;
  objective: string;
  elective?: string;
  capacity?: number;
};

type Student = {
  id: string;                              // 학번 e.g. '2027-0142'
  name: string;
  dob: string;                             // ISO YYYY-MM-DD
  cohortId: string;
  diagnostic: Record<Subject, string>;     // e.g. '국어': '3등급'
  electives: { 국어선택?: string; 수학선택?: string; 탐구1?: string; 탐구2?: string };
};

type Cohort = {
  id: string;
  name: string;                            // '2027학년도 재수정규 6평 완성반'
  targetExamDate: string;                  // ISO
  seasons: { id: '1' | '2'; startDate: string; endDate: string }[];
  registrationOpen: string;
  registrationClose: string;
  modifyDeadline: string;                  // 변경 마감
  manuallyLocked: boolean;
  pricingTiers: { id: 'A'|'B'|'C'|'D'; min: number; max: number; fee: number }[];
};

type Registration = {
  id: string;
  studentId: string;
  courseId: string;
  cohortId: string;
  status: 'active' | 'dropped';
  createdAt: string;
  droppedAt?: string;
};

type Extension = {
  id: string;
  studentId: string;
  cohortId: string;
  scope: 'add_only' | 'drop_only' | 'add_and_drop';
  courseId?: string;                       // omit = applies to all courses
  newDeadline: string;                     // ISO
  reason: string;
  grantedBy: string;
  grantedAt: string;
};

type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorRole: Role;
  action: string;                          // 'registration.add', 'extension.grant', ...
  targetType: 'student'|'course'|'registration'|'cohort'|'extension'|'pricing'|'lock'|'notification'|'admin';
  targetId: string;
  diff?: { before?: unknown; after?: unknown };
};

type SyllabusEntry = { week: number; date: string; topic: string; special?: 'exam'|'break'; season?: 1|2 };

type AdminAccount = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  passwordHash: string;                    // mock-phase: plain compare via dev secret
  lastLoginAt?: string;
};
```

### Data-layer interface

Each `lib/data/<resource>.ts` exports the same surface pattern:

```ts
// lib/data/courses.ts
export async function listCourses(filter?: {
  cohortId?: string;
  subject?: Subject;
  type?: CourseType;
  level?: LevelTag;
  query?: string;
}): Promise<Course[]>;

export async function getCourse(id: string): Promise<Course | null>;
export async function createCourse(input: Omit<Course, 'id'>): Promise<Course>;
export async function updateCourse(id: string, patch: Partial<Course>): Promise<Course>;
export async function deleteCourse(id: string): Promise<void>;
```

Same `list*` / `get*` / `create*` / `update*` / `delete*` shape for every resource. Mutations go through `lib/utils/withAudit.ts`, which wraps the call and writes an `AuditEvent` after success.

### Storage in mock phase

- Reads pull from `lib/fixtures/*.json` on first call.
- Mutations apply against an in-memory copy, then persist to `localStorage` under one key per resource.
- `?reset=1` query param wipes `localStorage` and re-reads fixtures. Useful for demos.
- All data functions return `Promise` so the surface matches the eventual Supabase calls — no signature change at swap time.

### `canStudentModify` resolver

```ts
// lib/config/deadlines.ts
export function canStudentModify(
  studentId: string,
  cohortId: string,
  action: 'add' | 'drop',
): { allowed: boolean; effectiveDeadline: string; reason: 'global'|'manually-locked'|'extension'|'closed' };
```

This is the single point UI, gates, and admin "변경 마감" displays consult. When backend lands, the function delegates to a Supabase RPC with the same signature.

## 6. Component library and design tokens

### `lib/design-tokens.ts`

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

### Tailwind theme

`tailwind.config.ts` mirrors every token under `theme.extend.colors` (`brand`, `brand-dark`, `brand-light`, `brand-bg`, `brand-text`, `brand-border`, `brand-warning`, etc.) and sets `fontFamily.sans` to the Pretendard stack. Result: `className="bg-brand text-white border border-brand-border"` works without inline styles.

### `globals.css`

Tailwind directives + body font/color/background + `line-clamp-2` utility (used by mockup). Nothing else.

### UI primitives — promoted from v2 mockup

| Primitive    | Source in v2 mockup       | Notes                                                                  |
|--------------|---------------------------|------------------------------------------------------------------------|
| `Button`     | lines 256–263             | Variants: `primary` / `secondary` / `ghost` / `danger`; sizes `sm/md/lg`; optional `icon`. |
| `Pill`       | lines 242–254             | Colors: `gray` / `teal` / `warn` / `red` / `green` / `slate`; sizes `sm/md`. |
| `Input`      | lines 265–273             | Optional left icon; brand focus border.                                |
| `Logo`       | lines 231–240             | Sizes `md/lg`.                                                         |
| `ActionCard` | lines 436–446             | Used on student dashboard; reused on admin dashboard.                  |
| `Meta`       | lines 840–847             | Icon + label + value row.                                              |
| `Modal`      | extracted from Cart confirm | Centered overlay + body + footer.                                    |
| `Drawer`     | extracted from `SlotPicker` | Right-side slide-over.                                              |

### New primitives (admin needs)

| Primitive    | Why                                                                           |
|--------------|-------------------------------------------------------------------------------|
| `DataTable`  | Lists with sorting, pagination, bulk-select, row-click. Headless via TanStack. |
| `EmptyState` | "아직 등록된 학생이 없습니다" + optional CTA.                                   |
| `Breadcrumb` | Admin topbar.                                                                  |
| `Toolbar`    | Search + filters + actions row above tables.                                   |
| `Tabs`       | Course detail (admin) tabs: 강의 정보 / 강의계획서 / 수강생.                    |
| `KPICard`    | Admin dashboard stat tiles.                                                    |
| `RoleBadge`  | super_admin / admin distinction.                                               |
| `DiffViewer` | Audit log: before/after JSON keys highlighted.                                 |
| `DateField`  | YYYYMMDD masked text input.                                                    |
| `KrwField`   | Number input with thousand separators + `원` suffix.                           |
| `Toast`      | Single global toast region for gate/conflict/success/failure.                  |

### shadcn/ui policy

Not preinstalled. If a future page wants a primitive that would be churn to build (e.g., `Combobox`, `DropdownMenu`, `Calendar`), install just that one component via the shadcn CLI and theme it to match.

## 7. Student pages — port mapping from v2 mockup

For each surface: what stays, what changes, what is deferred.

### `/login`

- **Stays:** layout, Logo, footer, Input primitives, copy.
- **Changes:** field placeholders to `이름 또는 이메일` / `생년월일 6자리 또는 비밀번호`; field-2 mask switches based on field-1; submit calls `lib/data/auth.ts`; heading text reads from `getCurrentCohort().name`.
- **Deferred:** "비밀번호 찾기" — none in mockup, not added.

### `/dashboard`

- **Stays:** greeting, cohort pill, diagnostic line, the two cards layout (D-day / 신청 현황), ActionCard grid.
- **Changes:** `STUDENT` → `await getStudent(session.userId)`; `D_DAY` computed in the Server Component from `cohort.targetExamDate` and request-time `Date.now()` (so it never goes stale on refresh; client-side "D-N today, becomes D-(N-1) at midnight" ticking is not in scope this phase); SEASON dates from `cohort.seasons[]`; "변경 마감" line from `canStudentModify(...).effectiveDeadline`, formatted as `M/D (요일) HH:mm`; Class Pick tier from `cohort.pricingTiers` + current registered count; "시간표 PDF" ActionCard routes to `/schedule#pdf`, disabled if no registrations.
- **Deferred:** Bell-icon notifications dropdown content (visual only).

### `/schedule` — `ScheduleGrid` + `SlotPicker` drawer

- **Stays:** 5×4 grid, BLOCK headers, empty-cell `+`, registered-cell render with hover-X, lower 신청 강의 목록 list.
- **Changes:** add/drop go through `canStudentModify`; on disallow, toast with reason. **인쇄** uses native `window.print()` with `@media print` styles. **PDF 다운로드** stubs as toast `"PDF 다운로드는 준비 중입니다"`. SlotPicker recommendation logic moves to `lib/utils/recommend.ts`.
- **Deferred:** real PDF rendering.

### `/catalog`

- **Stays:** search input, 과목 / 강좌 구분 pill filters, "내 진단 등급 추천만" toggle, 2-col card grid.
- **Changes:** course list comes from `await listCourses({ cohortId, subject, type, query })`; "추천만" toggle is client-side over the returned set; Card "신청" goes through `canStudentModify` + conflict check; on conflict, opens new `ConflictModal` with the overlapping registered course.
- **Deferred:** infinite scroll/pagination.

### `/course/[id]`

- **Stays:** breadcrumb-back, header (code, title, type pills, concept paragraph), Meta grid (4 cells), 강의 목표 callout, syllabus week list.
- **Changes:** `course` from `await getCourse(params.id)` (404 if missing); `syllabus` from `await getSyllabus(course.id)`; if empty, show `EmptyState` `"강의계획서가 아직 업로드되지 않았습니다"`; add/remove gated through the same helpers; conflict warning rendered inline as a banner when applicable.

### `/cart`

- **Stays:** subject-grouped sections, Class Pick tier progress steps, "다음 단계" hint, submit button + confirm modal.
- **Changes:** registrations from `await listRegistrations({ studentId, status:'active' })`; tiers from `cohort.pricingTiers`; submit confirms by writing `Registration` rows and redirecting to `/dashboard` with success toast; `[추후 확정]` 결제 안내 placeholder kept verbatim.
- **Deferred:** payment integration.

### Cross-cutting student behavior

- All gated mutations flow through `lib/utils/guard.ts → withGate(action, fn)`.
- Optimistic UI on add/remove; revert on rejection.
- Single global toast region.
- `?demo=` overrides:
  - `?demo=locked` — manually-locked state.
  - `?demo=past-deadline` — registrations read-only.
  - `?demo=extended` — student has an extension; banner shows extended deadline.
- Demo overrides are dev-only; production middleware ignores the query param.

## 8. Admin pages — sidebar IA + 12 page briefs

### Sidebar groupings

```
대시보드     (/admin)
학사 운영
  · 학생       (/admin/students)
  · 강의       (/admin/courses)
  · 수강신청 현황  (/admin/registrations)
  · 코호트 / 시즌 (/admin/cohorts)
예외 처리
  · 마감 연장   (/admin/extensions)  [badge: 미해결 N]
  · 등록 잠금   (/admin/lock)
  · 알림 발송   (/admin/notifications)
콘텐츠
  · 강의계획서  (/admin/syllabus)
  · 수강료 단계 (/admin/pricing)
시스템
  · 감사 로그   (/admin/audit)
  · 사용자 / 권한 (/admin/users)  ← super_admin only
```

Topbar: breadcrumb + cohort selector (sticky in cookie) + admin profile menu + "학생 화면 미리보기" link. Preview is **dev-only impersonation**: clicking opens a modal to pick a seed student, then opens `/dashboard?as=<studentId>` in a new tab; middleware honors `?as=` only when the active session role is admin or super_admin and only outside production. The original admin session is untouched. Closing the tab returns to admin work.

### Page briefs

**`/admin` — dashboard.** Four `KPICard`s: 등록 학생 수 / 개설 강의 수 / 변경 마감 D-N / 미해결 연장 신청 N. Below: 최근 활동 feed (last 10 audit events) on the left; 할 일 list on the right (수강신청 미완료 학생 수, 정원 초과 강의 수, 강의계획서 미등록 강의 수). All clickable into the relevant page.

**`/admin/students`.** Toolbar (검색, cohort filter, 학생 추가, Excel 가져오기 / 내보내기) + DataTable: 학번 / 이름 / 코호트 / 진단 등급 / 신청 강의 수 / 마지막 활동 / actions. Row click → `/admin/students/[id]`. Bulk select → bulk extension grant, bulk delete.

**`/admin/students/[id]`.** Tabs: 기본 정보 / 진단·선택과목 / 신청 강의 / 연장 이력 / 활동 로그. Inline edit → save → audit event.

**`/admin/courses`.** Toolbar (검색, cohort, subject, type, level, 강의 추가, Excel I/O) + DataTable: 코드 / 강의명 / subject·sub·type·level / 강사 / 시간 / 정원·신청 / 시즌 / actions. Row click → `/admin/courses/[id]` with tabs: 강의 정보 / 강의계획서 / 수강생.

**`/admin/courses/new` and edit.** Full form including a `MeetingsEditor` mini-grid (click cells in a 5×4 block grid to assign).

**`/admin/registrations`.** Cohort-scoped overview, two tab views: **강의별** (per-course headcount, capacity bar, 정원 초과 chip, expandable enrolled list) and **학생별** (per-student grid). CSV/Excel export on both.

**`/admin/cohorts`.** Card-list of cohorts. Each card: name, dates timeline (registration open → close → modify deadline → season 1 → season 2 → exam), 잠금 상태 toggle. Click → `/admin/cohorts/[id]` full editor.

**`/admin/extensions`** (load-bearing per CLAUDE.md). Active extensions list (학생 / scope / 새 마감 / 사유 / 발급자). `ExtensionGrantForm`:

1. Pick student (typeahead by 이름 or 학번).
2. Pick scope: `add_only` / `drop_only` / `add_and_drop` (radio — 3 separate scopes, never collapsed).
3. Optional: limit to a specific course (typeahead; blank = all).
4. Pick new deadline (DateField + time).
5. 사유 (textarea, required, 50-char min).
6. 발급 → audit event written, optional email-student toggle (mock: writes to `notifications.json`).

**`/admin/lock`.** Single toggle card (current 잠금 / 해제 state), button to flip → modal asks for 사유. Below: lock history table (활동 기간, 시작/해제 시간, 발급자, 사유).

**`/admin/notifications`.** Form (제목, 본문, 대상: 전체 / 코호트 / 학생 그룹) + sent-history table. Mock-phase send writes a record and toasts "발송이 예약되었습니다 (실제 발송은 백엔드 단계에서 연결)". Real Resend send is deferred.

**`/admin/syllabus`.** List view, missing syllabuses surfaced first (`강의계획서 미등록`). Click → `/admin/syllabus/[courseId]` with `SyllabusEditor`: week-by-week grid auto-generated from course duration + season dates; each row = `{ week, date (computed), topic (input), special: exam|break|none, season }`. Save writes `SyllabusEntry[]`. Student `/course/[id]` reads from same source.

**`/admin/pricing`.** Per-cohort tier editor. 4 default rows (Class A/B/C/D), each editable: range min/max, fee (`KrwField`), display label. Add/remove rows. Preview pane: slider 0→20 demos which tier students would see at each registered count.

**`/admin/audit`.** Read-only feed. Filters: 기간, 행위자, 대상 유형, 액션. DataTable rows: at / actor / action / target / 변경 (expand → DiffViewer).

**`/admin/users`** (super_admin only). Admin staff CRUD. Table: 이메일 / 이름 / 권한 / 마지막 로그인 / actions. Add → form. super_admin promote/demote toggle. Non-super_admins reaching this URL get a 403 page.

### Cross-cutting admin behavior

- Most pages cohort-scoped via topbar selector; selection persists in cookie.
- Every CRUD mutation goes through `lib/utils/withAudit.ts`.
- Bulk Excel via `lib/excel/{import,export}.ts`. Mock-phase import does in-memory validate + commit; real Edge Function pipeline is deferred.
- Permissions matrix in `lib/auth/permissions.ts`. Used by middleware AND by `<Show when={can(...)}>` UI guards.

## 9. Seed fixtures

The mock fixtures need enough volume that admin lists feel real and Catalog filters return content for every subject.

- **`cohorts.json`** — 1 active cohort (`2027학년도 재수정규 6평 완성반`) plus 1 archived (`2026학년도 9평 완성반`) so cohort selector shows movement.
- **`students.json`** — ~40 students across the active cohort. Mix of diagnostic 등급 across subjects.
- **`courses.json`** — port + extend the v2 mockup's 국어 / 수학 entries; add at least 8 영어 and 8 탐구 entries so Catalog `과목` filters all return content.
- **`registrations.json`** — ~25 of the 40 students have 3–10 registrations each; a few are at 0 (untouched), a few at the Class D boundary.
- **`extensions.json`** — 2 active extensions across different scopes for the demo states.
- **`syllabus.json`** — populated for ~30% of courses; the rest empty so the EmptyState path is exercised.
- **`audit.json`** — ~50 events seeded so the audit feed is non-trivial on first render.
- **`notifications.json`** — 3 historical broadcasts.
- **`admins.json`** — 1 super_admin, 2 admins.

## 10. Acceptance criteria

This phase is complete when the following are true:

1. **Build & dev:** package manager is **pnpm** (set in `package.json` `packageManager` field). `pnpm dev` boots Next.js and `/login` renders the v2 visual at `localhost:3000/login`. `pnpm build` produces a clean production build with no TypeScript errors. `pnpm lint` is clean.
2. **Login flow:** logging in as a seed student (e.g., `김민준` / `070318`) lands on `/dashboard`. Logging in as a seed admin lands on `/admin`. Logging in as super_admin shows `/admin/users` in sidebar; admin does not.
3. **Student golden path:** student can land on dashboard, navigate to schedule, click an empty cell, pick a course in SlotPicker, see it appear in the grid, navigate to cart, see Class Pick tier reflect, hit 수강신청하기, see confirm modal, confirm, land back on dashboard with the registration persisted across `localStorage`.
4. **Conflict path:** adding a course that overlaps an existing registration surfaces `ConflictModal` (Catalog) or inline banner (Course Detail).
5. **Demo states:** `?demo=locked` blocks all add/drop and shows the lock banner; `?demo=past-deadline` makes the cart submit disabled with reason; `?demo=extended` shows the extension banner.
6. **Admin happy paths:** every admin page renders with seeded data, every CRUD button opens its form/modal, every form submit writes to fixtures+`localStorage` and triggers an audit event.
7. **Extension grant flow:** the form requires a scope choice and ≥50-char 사유; submitting writes the extension and an audit event, and (when student is reloaded) the student's `canStudentModify` reflects the new deadline.
8. **Lock toggle:** flipping the manual lock immediately changes `canStudentModify` for all students in that cohort and is reflected in their UI on next load.
9. **Visual fidelity:** student pages match the v2 mockup screenshots (color, spacing, typography, pill chip language). Admin pages share the same primitives.
10. **`?reset=1`** wipes `localStorage` and re-seeds. Every demo run starts from the same initial state when this is used.

## 11. Open questions / explicitly deferred

These are not resolved in this spec and are tracked for the backend phase or for a follow-up:

- **Real `fn_can_student_modify`** — Postgres function with the same signature as the mock resolver.
- **Realtime seat counts** — `course_sections.enrolled_count` denormalization + Realtime subscription on Catalog page.
- **RLS policies** — student-row isolation; admin write paths.
- **Audit triggers** — Postgres-side, replacing `withAudit.ts` calls.
- **Resend integration** — for extension-grant emails and broadcast notifications.
- **PDF rendering** — `@react-pdf/renderer` for 시간표 PDF.
- **Excel pipeline** — Edge Functions `excel-validate` and `excel-commit`.
- **Mobile breakpoint coverage** — the v2 mockup is desktop-first; admin tables in particular need a tablet/mobile pass.
- **Self-hosted Pretendard** — switch from CDN `<link>` to `next/font/local`.

## 12. Notes for implementation planning

- Recommended task ordering for the planning phase:
  1. Scaffold (Next.js, Tailwind theme, design tokens, base layout, root not-found).
  2. UI primitives library (Button → Pill → Input → Modal → Drawer → DataTable etc.) — these block both halves.
  3. Auth + middleware + login + role gating + seed admins/students.
  4. Mock-data layer scaffolding for all resources (empty fixtures fine at first).
  5. Student pages port (Login → Dashboard → Schedule → SlotPicker → Catalog → Course Detail → Cart). Each page is one task.
  6. Admin shell (Sidebar + Topbar + Breadcrumb + cohort selector + dashboard with KPI cards).
  7. Admin pages — order by load-bearing-ness: Students → Courses → Registrations → Cohorts → Extensions → Lock → Audit → Syllabus → Pricing → Notifications → Users.
  8. Demo state controls + reset.
  9. Acceptance walkthrough.

- Each item in 5 and 7 is a candidate for a focused TDD-style implementation pass: mock the data, render the page, exercise the golden path with a quick interactive walkthrough, then move on.
