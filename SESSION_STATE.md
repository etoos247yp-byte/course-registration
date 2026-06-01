# ETOOS 247 이천기숙학원 수강신청 — Session State & Project Structure

Welcome back! This file is your single source of truth for the **Course Registration Project**. It tracks the current development state, the exact file architecture, and how to pick up where you or another developer left off.

---

## 🚀 Quick Start & Commands

To quickly spin up the environment and run diagnostic tools, use the following commands from the project root:

| Command | Action | Description |
| :--- | :--- | :--- |
| `pnpm dev` | Start Dev Server | Launches the Next.js development server at [http://localhost:3000](http://localhost:3000) |
| `pnpm test` | Run Unit/Component Tests | Runs the entire `vitest` suite to verify components, utility functions, and mock states |
| `pnpm test:watch` | Run Tests in Watch Mode | Keeps `vitest` running in watch mode for test-driven development |
| `pnpm lint` | Run ESLint | Checks files for style guidelines, deprecation notices, and Next.js compiler errors |
| `pnpm build` | Build Production Bundle | Compiles the Next.js production build and checks React SSR consistency |

---

## 🔑 Demo & Testing Credentials

Use these verified demo accounts to sign in and test the student and administrator workflows:

### Student Accounts
Students authenticate using **Name (이름)** as the identifier and **6-Digit Date of Birth (생년월일 6자리 YYMMDD)** as the password.

*   **김민준** (Cohort: 6평 완성반) — ID: `stu-1` / Password: `070318`
*   **이서연** (Cohort: 6평 완성반) — ID: `stu-2` / Password: `070522`
*   **박지호** (Cohort: 6평 완성반) — ID: `stu-3` / Password: `070804`
*   **최예린** (Cohort: 6평 완성반) — ID: `stu-4` / Password: `070708`

### Admin Accounts
Administrators authenticate using **Email** and a password.

*   **Standard Admin:** `admin@etoos247.kr` / `admin1234`
*   **Super Admin:** `super@etoos247.kr` / `super1234`

---

## 📂 Codebase & File Structure

Here is the comprehensive layout of the project, including the folder structure and the purpose of each load-bearing component:

```
Course_registration/
├── .claude/                     # Claude-specific internal configurations
├── .codex/                      # Editor/Codex workspace configs
├── .next/                       # Next.js build cache (ignored by git)
├── app/                         # Next.js 16 App Router pages & layout configurations
│   ├── admin/                   # Admin pages & dashboards
│   │   ├── courses/             # Course Catalog Management panel
│   │   │   └── page.tsx         # Renders course admin view
│   │   ├── registrations/       # Course Registrations Overview
│   │   │   └── page.tsx         # Renders registration admin view
│   │   ├── students/            # Student roster & timelines
│   │   │   └── page.tsx         # Renders student admin view
│   │   └── page.tsx             # Main admin panel gateway
│   ├── cart/                    # Cart / Submission checklist page
│   │   └── page.tsx             # Renders the cart review layout
│   ├── catalog/                 # Student-facing course search and catalog
│   │   └── page.tsx             # Renders the course finder view
│   ├── dashboard/               # Student welcome dashboard & metrics
│   │   └── page.tsx             # Renders student dashboard
│   ├── login/                   # Auth gateway page
│   │   └── page.tsx             # Renders student/admin login page
│   ├── schedule/                # Student interactive timetable planner
│   │   └── page.tsx             # Renders the interactive weekly grid planner
│   ├── favicon.ico              # Web application browser favicon
│   ├── globals.css              # Main vanilla CSS & Tailwind theme directives
│   ├── layout.tsx               # Root layout setting typography, lang, toast providers
│   └── page.tsx                 # Index route redirecting directly to /login
├── components/                  # React Components Layer
│   ├── prototype/               # High-fidelity mock logic
│   │   ├── __tests__/           # Tests validating state machine logic
│   │   │   └── PrototypeApp.test.tsx # High-coverage integration tests
│   │   └── PrototypeApp.tsx     # The 113KB single-file frontend state machine engine
│   └── ui/                      # Premium design system primitives (Ported from visual mock)
│       ├── __tests__/           # Primitives test suite
│       │   ├── Button.test.tsx  # Validates hover, focus, onClick, and disabled states
│       │   └── Pill.test.tsx    # Validates pill style colors (teal, red, warn, gray)
│       ├── ActionCard.tsx       # Action buttons for dashboard shortcuts
│       ├── Breadcrumb.tsx       # Section breadcrumb indicator
│       ├── Button.tsx           # Custom styled buttons supporting primary, ghost, danger
│       ├── DataTable.tsx        # Styled TanStack Table wrapper for admin lists
│       ├── DateField.tsx        # Formats date displays
│       ├── DiffViewer.tsx       # Shows changes in courses/timelines before committing
│       ├── Drawer.tsx           # Sliding side-panel drawer for course details & slot pickers
│       ├── EmptyState.tsx       # Handles blank search queries and empty cart displays
│       ├── Input.tsx            # Styled form input with inline icon decorators
│       ├── KPICard.tsx          # Key metrics (e.g. Total Enrolled, Free Space)
│       ├── KrwField.tsx         # Formats money to Korean Won standard
│       ├── Logo.tsx             # Canonical ETOOS 247 Brand Logo Component
│       ├── Meta.tsx             # Renders course metadata lines
│       ├── Modal.tsx            # Floating dialog box for registrations/deletions
│       ├── Pill.tsx             # Colorful status badge indicator
│       ├── RoleBadge.tsx        # Admin vs. Student visual indicators
│       ├── SmartDateInput.tsx   # Supports relative shorthand tags like "+10d", "+1w"
│       ├── Tabs.tsx             # View switching tabs
│       ├── Toast.tsx            # Toast notification styles
│       └── Toolbar.tsx          # Filter/action header for data tables
├── docs/                        # Architectural documentation & spec logs
│   └── superpowers/             
│       ├── plans/               # Detailed project execution roadmaps
│       │   └── 2026-04-28-frontend-first-implementation.md # Phase-by-phase timeline
│       └── specs/               # Style specs, design tokens, Korean visual assets
│           └── 2026-04-28-frontend-first-design.md # Visual identity constants
├── lib/                         # Business logic, state definitions, and utility packages
│   ├── __tests__/               
│   │   └── prototype-data.test.ts # Covers user logins, registrations, fee calculations
│   ├── utils/                   
│   │   ├── __tests__/           # Exhaustive unit tests for core utilities
│   │   │   ├── conflict.test.ts # Meeting conflict resolver test
│   │   │   ├── date-shorthand.test.ts # Smart shorthand input parser test
│   │   │   ├── dday.test.ts     # D-Day calculator test
│   │   │   ├── kdate.test.ts    # Korean Standard Time formatter test
│   │   │   ├── krw.test.ts      # Currency formatter test
│   │   │   ├── recommend.test.ts# Student grade recommendation test
│   │   │   └── tier.test.ts     # Pricing tier check test
│   │   ├── conflict.ts          # Checks for overlapping meetings/slots (e.g. 월 A vs 월 A)
│   │   ├── date-shorthand.ts    # Parses inputs like "2026-05-15" or relative "+2w"
│   │   ├── dday.ts              # Returns "D-6" format from targeted academic exam date
│   │   ├── excel.ts             # Course and student roster Excel export helper
│   │   ├── kdate.ts             # Formats JavaScript dates to clean Korean locale strings
│   │   ├── krw.ts               # Currency formatting function
│   │   ├── recommend.ts         # Diagnostic grade matching (recommends classes based on test scores)
│   │   └── tier.ts              # Matches registered class counts to A/B/C/D fee brackets
│   ├── design-tokens.ts         # Color variables (Teal `#2DAE9D`, text `#111827`, etc.)
│   ├── prototype-data.ts        # The primary state hydrator, auth engine, and local-storage driver
│   ├── supabase.ts              # Supabase JS connection layer and environment variable validator
│   └── types.ts                 # Explicit TypeScript types (Course, Student, Registration, Extension)
├── package.json                 # Project dependencies, devDependencies, and run scripts
├── pnpm-lock.yaml               # Pinpoint packages manager lockfile
├── supabase-schema.sql          # Full Postgres schemas, denormalized triggers, and seed statements
├── tsconfig.json                # Strict TypeScript rules configuration
└── vitest.config.ts             # Test suites settings (aliases, environment, setup files)
```

---

## 📈 Current Project State & State Management

The project is structured with a **Frontend-First Design** pattern. It is fully operational using React mock states and local storage caching, meaning **every button, modal, form, drawer, and admin panel operates correctly right out of the box.**

### 1. The State Engine (`lib/prototype-data.ts`)
*   **Dev Mode Persistence:** The state utilizes `localStorage`. Every time the student or admin adds a course, approves a schedule correction, or overrides a deadline, the state is persisted dynamically.
*   **SSR Consistency:** React hydration is handled cleanly. The client checks `localStorage` and falls back to seeds only if it is completely empty.
*   **Automatic Deadlines:** It supports auto-closing when the deadline passes, and alerts students with clear banners (Korean copy: *"수강 정정 및 신청 기간이 마감되었습니다."*).

### 2. Verified Test Coverage
All core logic is protected by **92 automated unit and integration tests** located inside `/tests` and sub-`__tests__` folders:
*   **Conflicts:** Confirms overlaps in timeslots are flagged.
*   **Grade Recommendations:** Confirms a student with a "Grade 3" diagnostic is recommended matched classes in the drawer slot picker.
*   **Shorthand Parser:** Confirms inputs like `+5d` properly evaluate to exactly 5 days from today's Korean Standard Time.
*   **Fee Calculations:** Confirms the pricing tier transitions correctly:
    *   `1–3 courses` $\rightarrow$ **Class A** (Free)
    *   `4–6 courses` $\rightarrow$ **Class B** (₩100,000 / month)
    *   `7–9 courses` $\rightarrow$ **Class C** (₩200,000 / month)
    *   `10+ courses` $\rightarrow$ **Class D** (₩300,000 / month)

### 3. Backend Readiness (The Supabase SQL Blueprint)
The database structure is locked and saved in `supabase-schema.sql`. It includes:
*   Tables matching TypeScript definitions exactly: `students`, `courses`, `registrations`, `individual_openings`, `system_settings`, `admins`.
*   A denormalized, trigger-driven capacity tracker (`update_course_enrolled`) that maintains `courses.enrolled` counter integrity on INSERT/UPDATE/DELETE.
*   Seeded mock data matching the local development files.

---

## 🎯 Next Steps & Supabase Integration Roadmap

When you are ready to transition from mock data to the true Supabase backend, follow this roadmap:

1.  **Configure Environment Variables:** Add your keys to a `.env.local` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
    ```
2.  **Auth Layer Migration:**
    *   Modify `/app/login/page.tsx` to handle standard auth session loops using `@supabase/ssr` or `@supabase/supabase-js`.
    *   Implement route-gating inside a standard Next.js `middleware.ts`.
3.  **Database Migration:** Run the script inside `supabase-schema.sql` on your Supabase Console SQL Editor to set up tables, triggers, and seed data.
4.  **Replace LocalState with DB Queries:**
    *   Swap `localStorage` actions inside `components/prototype/PrototypeApp.tsx` with async Supabase Client requests (e.g. `supabase.from('registrations').insert(...)`).
    *   Port Postgres RPC function `fn_can_student_modify` to handle deadline validation on both the DB side (via RLS policies) and the web client side.
5.  **Run Tests:** Keep `pnpm test` running to ensure no frontend components break during the migration.

---

> [!TIP]
> Keep this document updated as you complete milestones. It guarantees that subsequent development runs smoothly without code duplication or state conflicts. Happy coding!
