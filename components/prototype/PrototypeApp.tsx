'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  addRegistration,
  adminAddStudentClass,
  adminDropStudentClass,
  authenticateDemoUser,
  authenticateUserWithSupabase,
  blockLabels,
  canAccessPrototypeArea,
  canStudentModifySchedule,
  calculateClassPick,
  createInitialPrototypeState,
  dropRegistration,
  getActiveRegistrations,
  getHeldPersonalScheduleRows,
  getStudentCourses,
  hydratePrototypeState,
  prototypeSubjects,
  updateCorrectionPeriod,
  type PrototypeCourse,
  type PrototypeSession,
  type PrototypeState,
  type PrototypeSubject,
} from '@/lib/prototype-data';

type View = 'login' | 'dashboard' | 'catalog' | 'schedule' | 'cart' | 'admin' | 'admin-students' | 'admin-courses' | 'admin-registrations';

const stateKey = 'course-registration-prototype-state';
const sessionKey = 'course-registration-prototype-session';
const subjects: Array<PrototypeSubject | '전체'> = ['전체', ...prototypeSubjects];

export function PrototypeApp({ view }: { view: View }) {
  const router = useRouter();
  const [state, setState] = React.useState<PrototypeState>(() => createInitialPrototypeState());
  const [session, setSession] = React.useState<PrototypeSession | null>(null);
  const [message, setMessage] = React.useState('');
  const [hydrated, setHydrated] = React.useState(false);

  const loadState = React.useCallback(async () => {
    try {
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: coursesData } = await supabase.from('courses').select('*').order('code');
      const { data: registrationsData } = await supabase.from('registrations').select('*');
      const { data: openingsData } = await supabase.from('individual_openings').select('*');
      const { data: settingsData } = await supabase.from('system_settings').select('*');

      const lockedSetting = settingsData?.find((s) => s.key === 'locked')?.value ?? false;
      const deadlineSetting = settingsData?.find((s) => s.key === 'deadline')?.value ?? '2026-05-30T23:59:00';
      const correctionOpenSetting = settingsData?.find((s) => s.key === 'correctionOpen')?.value ?? '2026-05-01T00:00:00';
      const correctionCloseSetting = settingsData?.find((s) => s.key === 'correctionClose')?.value ?? '2026-05-30T23:59:00';

      setState({
        students: studentsData || [],
        courses: (coursesData || []).map((c) => ({
          ...c,
          meetings: typeof c.meetings === 'string' ? JSON.parse(c.meetings) : c.meetings,
        })),
        registrations: registrationsData || [],
        locked: lockedSetting,
        deadline: deadlineSetting,
        correctionOpen: correctionOpenSetting,
        correctionClose: correctionCloseSetting,
        individualOpenings: (openingsData || []).map((o) => ({
          studentId: o.student_id,
          open: o.open,
          close: o.close,
          reason: o.reason,
        })),
      });
    } catch (err) {
      console.error('Error loading state from Supabase:', err);
    }
  }, []);

  React.useEffect(() => {
    const savedSession = window.localStorage.getItem(sessionKey);
    if (savedSession) setSession(JSON.parse(savedSession) as PrototypeSession);
    loadState().then(() => setHydrated(true));
  }, [loadState]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (session) window.localStorage.setItem(sessionKey, JSON.stringify(session));
    else window.localStorage.removeItem(sessionKey);
  }, [hydrated, session]);

  function signOut() {
    setSession(null);
    router.push('/login');
  }

  async function resetDemo() {
    try {
      // Delete all registrations
      await supabase.from('registrations').delete().neq('id', '');
      // Delete all individual openings
      await supabase.from('individual_openings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Reset system settings
      await supabase.from('system_settings').upsert([
        { key: 'locked', value: false },
        { key: 'deadline', value: '2026-05-30T23:59:00' },
        { key: 'correctionOpen', value: '2026-05-01T00:00:00' },
        { key: 'correctionClose', value: '2026-05-30T23:59:00' }
      ]);

      // Re-insert initial registrations to match initial state
      await supabase.from('registrations').insert([
        { id: 'reg-1', student_id: 'stu-2', course_id: 'math-advanced', status: 'active', created_at: '2026-05-01T09:00:00Z' },
        { id: 'reg-2', student_id: 'stu-2', course_id: 'eng-reading', status: 'active', created_at: '2026-05-01T09:05:00Z' },
        { id: 'reg-3', student_id: 'stu-3', course_id: 'kor-basic', status: 'active', created_at: '2026-05-01T10:00:00Z' }
      ]);

      setMessage('데모 데이터가 초기화되었습니다.');
      await loadState();
    } catch (err) {
      console.error('Error resetting demo:', err);
      setMessage('데모 초기화 중 오류가 발생했습니다.');
    }
  }

  const activeStudentId = session?.role === 'student' ? session.id : 'stu-1';
  const isAdminView = view.startsWith('admin');
  const canModifySchedule = canStudentModifySchedule(state, new Date(), activeStudentId);

  if (view === 'login') {
    return <LoginScreen onLogin={setSession} />;
  }

  if (!session) {
    return (
      <Shell session={session} onSignOut={signOut}>
        <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <ShieldCheck className="h-12 w-12 text-brand" />
          <h1 className="mt-6 text-2xl font-semibold">로그인이 필요합니다</h1>
          <p className="mt-2 text-sm text-brand-text-muted">학생 또는 관리자 데모 계정으로 먼저 로그인하세요.</p>
          <Link href="/login" className="mt-6 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white">
            로그인으로 이동
          </Link>
        </section>
      </Shell>
    );
  }

  if (!canAccessPrototypeArea(session.role, isAdminView ? 'admin' : 'student')) {
    return (
      <Shell session={session} onSignOut={signOut}>
        <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <Lock className="h-12 w-12 text-brand-danger" />
          <h1 className="mt-6 text-2xl font-semibold">접근할 수 없는 화면입니다</h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            {session.role === 'student' ? '학생 계정에서는 관리자 콘솔을 열 수 없습니다.' : '관리자 계정에서는 학생 전용 화면을 열 수 없습니다.'}
          </p>
          <Link
            href={session.role === 'student' ? '/dashboard' : '/admin'}
            className="mt-6 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            내 화면으로 이동
          </Link>
        </section>
      </Shell>
    );
  }

  return (
    <Shell session={session} onSignOut={signOut}>
      {message ? (
        <div className="mx-auto mt-5 max-w-7xl px-4">
          <div className="rounded-md border border-brand bg-brand-light px-4 py-3 text-sm text-brand-dark">{message}</div>
        </div>
      ) : null}
      {view === 'dashboard' && <StudentDashboard state={state} studentId={activeStudentId} />}
      {view === 'catalog' && (
        <Catalog
          state={state}
          studentId={activeStudentId}
          canModify={canModifySchedule}
          onAdd={async (courseId) => {
            const checkResult = addRegistration(state, activeStudentId, courseId);
            if (!checkResult.ok) {
              setMessage(checkResult.reason);
              return;
            }

            const { error } = await supabase.from('registrations').insert({
              id: `reg-${Date.now()}-${courseId}`,
              student_id: activeStudentId,
              course_id: courseId,
              status: 'active',
              created_at: new Date().toISOString(),
            });

            if (error) {
              setMessage(`신청 실패: ${error.message}`);
            } else {
              setMessage('강좌를 신청했습니다.');
              await loadState();
            }
          }}
        />
      )}
      {view === 'schedule' && <Schedule state={state} studentId={activeStudentId} />}
      {view === 'cart' && (
        <Cart
          state={state}
          studentId={activeStudentId}
          canModify={canModifySchedule}
          onDrop={async (courseId) => {
            const { error } = await supabase
              .from('registrations')
              .update({ status: 'dropped' })
              .eq('student_id', activeStudentId)
              .eq('course_id', courseId)
              .eq('status', 'active');

            if (error) {
              setMessage(`제외 실패: ${error.message}`);
            } else {
              setMessage('강좌를 장바구니에서 제외했습니다.');
              await loadState();
            }
          }}
        />
      )}
      {view.startsWith('admin') && (
        <AdminConsole
          view={view}
          state={state}
          onToggleLock={async () => {
            const nextLocked = !state.locked;
            const { error } = await supabase
              .from('system_settings')
              .upsert({ key: 'locked', value: nextLocked });

            if (error) {
              setMessage(`설정 변경 실패: ${error.message}`);
            } else {
              setMessage(nextLocked ? '수강신청을 잠갔습니다.' : '수강신청을 열었습니다.');
              await loadState();
            }
          }}
          onSetCorrectionOpen={async (open) => {
            const openDate = open ? '2026-05-01T00:00:00' : state.correctionOpen;
            const closeDate = open ? '2099-12-31T23:59:00' : '2000-01-01T00:00:00';

            const { error: err1 } = await supabase
              .from('system_settings')
              .upsert({ key: 'locked', value: false });

            const { error: err2 } = await supabase
              .from('system_settings')
              .upsert([
                { key: 'correctionOpen', value: openDate },
                { key: 'correctionClose', value: closeDate }
              ]);

            if (err1 || err2) {
              setMessage('설정 변경 실패');
            } else {
              setMessage(open ? '수강정정기간을 열었습니다.' : '수강정정기간을 닫았습니다.');
              await loadState();
            }
          }}
          onUpdateCorrectionPeriod={async (openDate, closeDate) => {
            const { error } = await supabase
              .from('system_settings')
              .upsert([
                { key: 'correctionOpen', value: `${openDate}T00:00:00` },
                { key: 'correctionClose', value: `${closeDate}T23:59:00` }
              ]);

            if (error) {
              setMessage(`기간 수정 실패: ${error.message}`);
            } else {
              setMessage('수강정정기간을 수정했습니다.');
              await loadState();
            }
          }}
          onGrantStudentOpening={async (studentId) => {
            const { error: err1 } = await supabase
              .from('system_settings')
              .upsert({ key: 'locked', value: false });

            const { error: err2 } = await supabase
              .from('individual_openings')
              .insert({
                student_id: studentId,
                open: '2026-05-01T00:00:00',
                close: '2099-12-31T23:59:00',
                reason: '신규 입소생',
              });

            if (err1 || err2) {
              setMessage('개별 오픈 실패');
            } else {
              setMessage('해당 학생에게 개별 수강신청을 오픈했습니다.');
              await loadState();
            }
          }}
          onAdminAddClass={async (studentId, courseId) => {
            const checkResult = adminAddStudentClass(state, studentId, courseId);
            if (!checkResult.ok) {
              setMessage(checkResult.reason);
              return;
            }

            const { error } = await supabase.from('registrations').insert({
              id: `reg-${Date.now()}-${courseId}`,
              student_id: studentId,
              course_id: courseId,
              status: 'active',
              created_at: new Date().toISOString(),
            });

            if (error) {
              setMessage(`추가 실패: ${error.message}`);
            } else {
              setMessage('관리자가 학생 강좌를 추가했습니다.');
              await loadState();
            }
          }}
          onAdminDropClass={async (studentId, courseId) => {
            const { error } = await supabase
              .from('registrations')
              .update({ status: 'dropped' })
              .eq('student_id', studentId)
              .eq('course_id', courseId)
              .eq('status', 'active');

            if (error) {
              setMessage(`제외 실패: ${error.message}`);
            } else {
              setMessage('관리자가 학생 강좌를 제외했습니다.');
              await loadState();
            }
          }}
          onReset={resetDemo}
        />
      )}
    </Shell>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: PrototypeSession) => void }) {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState('김민준');
  const [secret, setSecret] = React.useState('070318');
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const session = await authenticateUserWithSupabase(identifier, secret);
      if (!session) {
        setError('로그인 정보가 일치하지 않습니다.');
        return;
      }
      window.localStorage.setItem(sessionKey, JSON.stringify(session));
      onLogin(session);
      router.push(session.role === 'student' ? '/dashboard' : '/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="inline-flex items-center rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium text-brand-dark">
            ETOOS 247 이천기숙학원
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-brand-text sm:text-5xl">
            수강신청을 바로 점검할 수 있는 운영 프로토타입
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-brand-text-muted">
            학생은 강좌 탐색, 시간표 확인, 장바구니 확정을 진행하고 관리자는 학생, 강좌, 신청 현황을 한 화면에서 확인합니다.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <Metric label="학생 데모" value="4명" />
            <Metric label="개설 강좌" value="6개" />
            <Metric label="상태" value="Mock" />
          </div>
        </section>

        <section className="rounded-lg border border-brand-border bg-white p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-brand" />
            <div>
              <h2 className="font-semibold">로그인</h2>
              <p className="text-sm text-brand-text-muted">데모 계정이 미리 입력되어 있습니다.</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">이름 또는 이메일</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-3 outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">생년월일 6자리 또는 비밀번호</span>
              <input
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                type={identifier.includes('@') ? 'password' : 'text'}
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-3 outline-none focus:border-brand"
              />
            </label>
            {error ? <p className="text-sm text-brand-danger">{error}</p> : null}
            <button className="w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white">시작하기</button>
          </form>
          <div className="mt-5 grid gap-2 text-sm">
            <button
              onClick={() => {
                setIdentifier('김민준');
                setSecret('070318');
              }}
              className="rounded-md border border-brand-border px-3 py-2 text-left hover:bg-brand-bg"
            >
              학생: 김민준 / 070318
            </button>
            <button
              onClick={() => {
                setIdentifier('admin@etoos247.kr');
                setSecret('admin1234');
              }}
              className="rounded-md border border-brand-border px-3 py-2 text-left hover:bg-brand-bg"
            >
              관리자: admin@etoos247.kr / admin1234
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Shell({ children, session, onSignOut }: { children: React.ReactNode; session: PrototypeSession | null; onSignOut: () => void }) {
  return (
    <main className="min-h-screen bg-white text-brand-text">
      <header className="sticky top-0 z-10 border-b border-brand-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href={session?.role === 'admin' || session?.role === 'super_admin' ? '/admin' : '/dashboard'} className="font-semibold text-brand">
            ETOOS 247 수강신청
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Nav href="/dashboard" label="대시보드" />
            <Nav href="/catalog" label="강좌" />
            <Nav href="/schedule" label="시간표" />
            <Nav href="/cart" label="장바구니" />
            {session?.role === 'admin' || session?.role === 'super_admin' ? <Nav href="/admin" label="관리자" /> : null}
          </nav>
          <div className="flex items-center gap-3">
            {session ? <span className="hidden text-sm text-brand-text-muted sm:inline">{session.name}</span> : null}
            {session ? (
              <button onClick={onSignOut} className="inline-flex items-center gap-1 rounded-md border border-brand-border px-3 py-2 text-sm">
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            ) : null}
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

function Nav({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-brand-text-muted hover:bg-brand-bg hover:text-brand-text">
      {label}
    </Link>
  );
}

function StudentDashboard({ state, studentId }: { state: PrototypeState; studentId: string }) {
  const student = state.students.find((item) => item.id === studentId) ?? state.students[0];
  const courses = getStudentCourses(state, student.id);
  const classPick = calculateClassPick(courses.length);
  const recommendations = state.courses.filter((course) => !courses.some((active) => active.id === course.id)).slice(0, 3);

  return (
    <Page title={`${student.name} 학생 대시보드`} description="현재 신청 현황과 추천 강좌를 확인하세요.">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="신청 강좌" value={`${courses.length}개`} icon={<BookOpen />} />
        <Metric label="클래스픽" value={classPick} icon={<ShoppingCart />} />
        <Metric label="마감" value={state.deadline.slice(5, 10)} icon={<CalendarDays />} />
        <Metric label="운영 상태" value={state.locked ? '잠김' : '신청 가능'} icon={<Lock />} />
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="내 신청 강좌">
          <CourseList courses={courses} empty="아직 신청한 강좌가 없습니다." />
        </Panel>
        <Panel title="추천 강좌">
          <CourseList courses={recommendations} empty="추천 강좌가 없습니다." compact />
        </Panel>
      </div>
    </Page>
  );
}

function Catalog({
  state,
  studentId,
  canModify,
  onAdd,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  onAdd: (courseId: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [subject, setSubject] = React.useState<PrototypeSubject | '전체'>('전체');
  const active = getStudentCourses(state, studentId);
  const filtered = state.courses.filter((course) => {
    const matchesSubject = subject === '전체' || course.subject === subject;
    const matchesQuery = `${course.title} ${course.instructor} ${course.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  return (
    <Page title="강좌 탐색" description="시간 충돌과 정원 상태를 보면서 수강할 강좌를 담으세요.">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="강좌명, 강사, 코드 검색"
            className="w-full rounded-md border border-brand-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {subjects.map((item) => (
            <button
              key={item}
              onClick={() => setSubject(item)}
              className={`rounded-md border px-3 py-2 text-sm ${subject === item ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {!canModify ? (
        <div className="mb-5 rounded-md border border-brand-warning-bg bg-brand-warning-light px-4 py-3 text-sm text-brand-warning">
          수강정정기간이 아니어서 강좌를 담거나 변경할 수 없습니다.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course) => {
          const enrolled = active.some((item) => item.id === course.id);
          return (
            <CourseCard
              key={course.id}
              course={course}
              actionLabel={enrolled ? '신청됨' : canModify ? '담기' : '정정기간 아님'}
              disabled={enrolled || !canModify}
              onAction={() => onAdd(course.id)}
            />
          );
        })}
      </div>
    </Page>
  );
}

function Schedule({ state, studentId }: { state: PrototypeState; studentId: string }) {
  const rows = getHeldPersonalScheduleRows(state, studentId);
  return (
    <Page title="개인 시간표" description="내가 선택한 수업이 있는 시간만 표시합니다.">
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-brand-border p-8 text-center text-sm text-brand-text-muted">
            신청한 강좌가 없습니다.
          </div>
        ) : (
        <table className="w-full min-w-[760px] border-collapse border-t border-brand-text text-sm">
          <thead className="bg-brand-surface">
            <tr>
              <th colSpan={2} className="border-b border-r border-brand-border px-4 py-5 text-center font-semibold">
                시간
              </th>
              <th className="border-b border-brand-border px-4 py-5 text-center font-semibold">평일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              return (
              <tr key={`${row.label}-${row.time}`} className="odd:bg-white even:bg-brand-surface/40">
                <th className="w-[21%] border-b border-r border-brand-border px-4 py-3 text-center font-medium text-brand-text-muted">
                  {row.label}
                </th>
                <td className="w-[20%] border-b border-r border-brand-border px-4 py-3 text-center text-brand-text-muted">{row.time}</td>
                <td className="border-b border-brand-border px-4 py-3 text-center">
                  {row.courses.length > 0 ? (
                    <div className="mx-auto flex max-w-2xl flex-col gap-2">
                      {row.courses.map((course) => (
                        <div key={course.id} className="rounded-md border border-brand bg-brand-light px-3 py-2 text-left">
                          <p className="font-semibold text-brand-dark">{course.title}</p>
                          <p className="mt-1 text-xs text-brand-text-muted">
                            {course.instructor} · {course.meetings
                              .filter((meeting) => meeting.block === row.classBlock)
                              .map((meeting) => `${meeting.day} ${blockLabels[meeting.block]}`)
                              .join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="whitespace-pre-line leading-7 text-brand-text-muted">{row.content}</span>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </Page>
  );
}

function Cart({
  state,
  studentId,
  canModify,
  onDrop,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  onDrop: (courseId: string) => void;
}) {
  const courses = getStudentCourses(state, studentId);
  return (
    <Page title="장바구니" description="최종 신청 전 강좌 수와 클래스픽을 확인하세요.">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="담은 강좌">
          <div className="space-y-3">
            {!canModify ? <p className="rounded-md bg-brand-warning-light px-3 py-2 text-sm text-brand-warning">수강정정기간이 아니어서 변경할 수 없습니다.</p> : null}
            {courses.length === 0 ? <p className="text-sm text-brand-text-muted">담은 강좌가 없습니다.</p> : null}
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between gap-4 rounded-md border border-brand-border p-4">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="mt-1 text-sm text-brand-text-muted">{course.meetings.map((meeting) => `${meeting.day} ${blockLabels[meeting.block]}`).join(', ')}</p>
                </div>
                <button
                  onClick={() => onDrop(course.id)}
                  disabled={!canModify}
                  className="rounded-md border border-brand-border px-3 py-2 text-sm hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  제외
                </button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="신청 요약">
          <div className="space-y-3 text-sm">
            <Row label="강좌 수" value={`${courses.length}개`} />
            <Row label="클래스픽" value={calculateClassPick(courses.length)} />
          </div>
          <button className="mt-5 w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white">신청 확정</button>
        </Panel>
      </div>
    </Page>
  );
}

function AdminConsole({
  view,
  state,
  onToggleLock,
  onSetCorrectionOpen,
  onUpdateCorrectionPeriod,
  onGrantStudentOpening,
  onAdminAddClass,
  onAdminDropClass,
  onReset,
}: {
  view: View;
  state: PrototypeState;
  onToggleLock: () => void;
  onSetCorrectionOpen: (open: boolean) => void;
  onUpdateCorrectionPeriod: (openDate: string, closeDate: string) => void;
  onGrantStudentOpening: (studentId: string) => void;
  onAdminAddClass: (studentId: string, courseId: string) => void;
  onAdminDropClass: (studentId: string, courseId: string) => void;
  onReset: () => void;
}) {
  const activeRegistrations = state.registrations.filter((item) => item.status === 'active');
  const correctionOpen = canStudentModifySchedule(state);
  const [correctionStart, setCorrectionStart] = React.useState(state.correctionOpen.slice(0, 10));
  const [correctionEnd, setCorrectionEnd] = React.useState(state.correctionClose.slice(0, 10));
  return (
    <Page title="관리자 콘솔" description="프로토타입 데이터로 수강신청 운영 화면을 점검합니다.">
      <div className="mb-5 flex flex-wrap gap-2">
        <AdminTab href="/admin" label="요약" active={view === 'admin'} />
        <AdminTab href="/admin/students" label="학생" active={view === 'admin-students'} />
        <AdminTab href="/admin/courses" label="강좌" active={view === 'admin-courses'} />
        <AdminTab href="/admin/registrations" label="신청" active={view === 'admin-registrations'} />
      </div>

      {view === 'admin' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="학생" value={`${state.students.length}명`} icon={<Users />} />
            <Metric label="강좌" value={`${state.courses.length}개`} icon={<BookOpen />} />
            <Metric label="활성 신청" value={`${activeRegistrations.length}건`} icon={<CheckCircle2 />} />
            <Metric label="상태" value={state.locked ? '잠김' : '열림'} icon={<Lock />} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onToggleLock} className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white">
              {state.locked ? '신청 열기' : '신청 잠그기'}
            </button>
            <button onClick={onReset} className="rounded-md border border-brand-border px-4 py-2.5 text-sm font-semibold">
              데모 초기화
            </button>
            <button onClick={() => onSetCorrectionOpen(true)} className="rounded-md border border-brand-border px-4 py-2.5 text-sm font-semibold">
              수강정정기간 열기
            </button>
            <button onClick={() => onSetCorrectionOpen(false)} className="rounded-md border border-brand-border px-4 py-2.5 text-sm font-semibold">
              수강정정기간 닫기
            </button>
            <button
              onClick={() => {
                setCorrectionStart(state.correctionOpen.slice(0, 10));
                setCorrectionEnd(state.correctionClose.slice(0, 10));
              }}
              className="rounded-md border border-brand-border px-4 py-2.5 text-sm font-semibold"
            >
              현재 날짜 불러오기
            </button>
          </div>
          <div className="mt-4 rounded-md border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text-muted">
            수강정정기간: {state.correctionOpen.slice(0, 10)} ~ {state.correctionClose.slice(0, 10)} · 현재 {correctionOpen ? '변경 가능' : '변경 불가'}
          </div>
          <form
            className="mt-4 grid gap-3 rounded-lg border border-brand-border p-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdateCorrectionPeriod(correctionStart, correctionEnd);
            }}
          >
            <label className="text-sm font-medium">
              시작일
              <input
                type="date"
                value={correctionStart}
                onChange={(event) => setCorrectionStart(event.target.value)}
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium">
              종료일
              <input
                type="date"
                value={correctionEnd}
                onChange={(event) => setCorrectionEnd(event.target.value)}
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-2"
              />
            </label>
            <button className="self-end rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white">
              날짜 저장
            </button>
          </form>
        </>
      ) : null}

      {view === 'admin-students' ? (
        <Panel title="학생 목록">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-brand-bg">
                <tr>
                  {['이름', '반', '수준', '목표', '현재 강좌', '강좌 편집', '개별 오픈'].map((header) => (
                    <th key={header} className="border-b border-brand-border px-3 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.students.map((student) => {
                  const opening = state.individualOpenings.find((item) => item.studentId === student.id);
                  const studentCourses = getStudentCourses(state, student.id);
                  const selectedIds = new Set(studentCourses.map((course) => course.id));
                  const availableCourses = state.courses.filter((course) => !selectedIds.has(course.id));
                  return (
                    <tr key={student.id}>
                      <td className="border-b border-brand-border px-3 py-3">{student.name}</td>
                      <td className="border-b border-brand-border px-3 py-3">{student.cohortId}</td>
                      <td className="border-b border-brand-border px-3 py-3">{student.level}</td>
                      <td className="border-b border-brand-border px-3 py-3">{student.target}</td>
                      <td className="border-b border-brand-border px-3 py-3">
                        <div className="space-y-2">
                          {studentCourses.length === 0 ? <span className="text-brand-text-muted">없음</span> : null}
                          {studentCourses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between gap-2 rounded-md border border-brand-border px-2 py-1">
                              <span>{course.title}</span>
                              <button
                                onClick={() => onAdminDropClass(student.id, course.id)}
                                className="rounded-md border border-brand-border px-2 py-1 text-xs hover:bg-brand-bg"
                              >
                                제외
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border-b border-brand-border px-3 py-3">
                        <select
                          defaultValue=""
                          onChange={(event) => {
                            if (!event.target.value) return;
                            onAdminAddClass(student.id, event.target.value);
                            event.target.value = '';
                          }}
                          className="w-48 rounded-md border border-brand-border px-2 py-2 text-sm"
                        >
                          <option value="">강좌 추가</option>
                          {availableCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-brand-border px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onGrantStudentOpening(student.id)}
                            className="rounded-md border border-brand-border px-3 py-1.5 text-xs font-semibold hover:bg-brand-bg"
                          >
                            신규 입소생 오픈
                          </button>
                          {opening ? <span className="text-xs text-brand-text-muted">오픈됨</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {view === 'admin-courses' ? (
        <Panel title="강좌 목록">
          <DataTable
            headers={['코드', '과목', '강좌명', '강사', '정원']}
            rows={state.courses.map((course) => [course.code, course.subject, course.title, course.instructor, `${course.enrolled}/${course.capacity}`])}
          />
        </Panel>
      ) : null}

      {view === 'admin-registrations' ? (
        <Panel title="신청 현황">
          <DataTable
            headers={['학생', '강좌', '상태', '신청일']}
            rows={state.registrations.map((registration) => [
              state.students.find((student) => student.id === registration.studentId)?.name ?? '-',
              state.courses.find((course) => course.id === registration.courseId)?.title ?? '-',
              registration.status === 'active' ? '신청' : '취소',
              registration.createdAt.slice(0, 10),
            ])}
          />
        </Panel>
      ) : null}
    </Page>
  );
}

function CourseCard({
  course,
  actionLabel,
  disabled,
  onAction,
}: {
  course: PrototypeCourse;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <article className="rounded-lg border border-brand-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-brand">{course.code}</p>
          <h3 className="mt-1 font-semibold">{course.title}</h3>
        </div>
        <span className="rounded-full bg-brand-bg px-2 py-1 text-xs text-brand-dark">{course.subject}</span>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-6 text-brand-text-muted">{course.summary}</p>
      <div className="mt-4 space-y-1 text-sm text-brand-text-muted">
        <Row label="강사" value={course.instructor} />
        <Row label="수준" value={course.level} />
        <Row label="정원" value={`${course.enrolled}/${course.capacity}`} />
        <Row label="시간" value={course.meetings.map((meeting) => `${meeting.day} ${blockLabels[meeting.block]}`).join(', ')} />
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="mt-4 w-full rounded-md border border-brand bg-brand px-3 py-2.5 text-sm font-semibold text-white disabled:bg-white disabled:text-brand-text-muted"
      >
        {actionLabel}
      </button>
    </article>
  );
}

function CourseList({ courses, empty, compact = false }: { courses: PrototypeCourse[]; empty: string; compact?: boolean }) {
  if (courses.length === 0) return <p className="text-sm text-brand-text-muted">{empty}</p>;
  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div key={course.id} className="rounded-md border border-brand-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{course.title}</p>
              <p className="mt-1 text-sm text-brand-text-muted">{course.instructor} · {course.subject}</p>
            </div>
            <span className="rounded-full bg-brand-bg px-2 py-1 text-xs text-brand-dark">{course.level}</span>
          </div>
          {!compact ? <p className="mt-3 text-sm text-brand-text-muted">{course.summary}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Page({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-brand-border p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-brand-text-muted">
        <span className="text-sm">{label}</span>
        {icon ? <span className="text-brand [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-brand-text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function AdminTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`rounded-md border px-3 py-2 text-sm ${active ? 'border-brand bg-brand text-white' : 'border-brand-border'}`}>
      {label}
    </Link>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-brand-bg">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-brand-border px-3 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="border-b border-brand-border px-3 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
