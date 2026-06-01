'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Moon,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { SmartDateInput } from '@/components/ui/SmartDateInput';
import { calculateAutoCloseDate } from '@/lib/utils/date-shorthand';
import { exportStudents, exportCourses, exportRegistrations, parseExcelFile } from '@/lib/utils/excel';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  adminAddStudentClassAction,
  adminDropStudentClassAction,
  approveChangeRequestAction,
  rejectChangeRequestAction,
  loginAction,
  logoutAction,
  getServerTimeAction,
  adminAddStudentAction,
  adminDeleteStudentsAction,
} from '@/lib/actions';
import {
  addRegistration,
  adminAddStudentClass,
  adminDropStudentClass,
  acknowledgeAutoConfirmation,
  autoConfirmStudentRegistration,
  approveChangeRequest,
  authenticateDemoUser,
  authenticateUserWithSupabase,
  blockLabels,
  canAccessPrototypeArea,
  canStudentModifySchedule,
  calculateClassPick,
  confirmStudentRegistration,
  createInitialPrototypeState,
  defaultSeasonTemplates,
  dropRegistration,
  getActiveRegistrations,
  getActiveSeason,
  getCourseSubmission,
  getConfirmedClassPick,
  getEffectiveClassPick,
  getPersonalScheduleRows,
  getSeason,
  getStudentCourses,
  hydratePrototypeState,
  prototypeSubjects,
  rejectChangeRequest,
  submitChangeRequest,
  submitStudentCourseSelection,
  type PrototypeCourse,
  type PrototypeDay,
  type PrototypeRegistration,
  type PrototypeSession,
  type PrototypeState,
  type PrototypeStudent,
  type PrototypeSubject,
  type SeasonTemplate,
} from '@/lib/prototype-data';

type View = 'login' | 'dashboard' | 'catalog' | 'schedule' | 'cart' | 'admin' | 'admin-students' | 'admin-courses' | 'admin-registrations';

const stateKey = 'course-registration-prototype-state';
const sessionKey = 'course-registration-prototype-session';
const subjects: Array<PrototypeSubject | '전체'> = ['전체', ...prototypeSubjects];
const weekDays: PrototypeDay[] = ['월', '화', '수', '목', '금'];

export function PrototypeApp({ view }: { view: View }) {
  const router = useRouter();
  const [state, setState] = React.useState<PrototypeState>(() => createInitialPrototypeState());
  const [session, setSession] = React.useState<PrototypeSession | null>(null);
  const [message, setMessage] = React.useState('');
  const [hydrated, setHydrated] = React.useState(false);
  const [serverTimeMount, setServerTimeMount] = React.useState<number | null>(null);
  const [perfTimeMount, setPerfTimeMount] = React.useState<number>(0);

  React.useEffect(() => {
    async function syncTime() {
      try {
        const timeStr = await getServerTimeAction();
        setServerTimeMount(new Date(timeStr).getTime());
        setPerfTimeMount(performance.now());
      } catch (err) {
        console.error('Failed to sync server time:', err);
      }
    }
    syncTime();
  }, []);

  const getVerifiedNow = React.useCallback(() => {
    if (serverTimeMount === null) return new Date();
    return new Date(serverTimeMount + (performance.now() - perfTimeMount));
  }, [serverTimeMount, perfTimeMount]);

  const [isAdminDarkMode, setIsAdminDarkMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('admin-dark-mode') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    window.localStorage.setItem('admin-dark-mode', String(isAdminDarkMode));
  }, [isAdminDarkMode]);

  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const persistDemoState = React.useCallback((nextState: PrototypeState) => {
    setState(nextState);
    window.localStorage.setItem(stateKey, JSON.stringify(nextState));
  }, []);

  const loadDemoState = React.useCallback(() => {
    const savedState = window.localStorage.getItem(stateKey);
    if (!savedState) {
      setState(createInitialPrototypeState());
      return;
    }

    try {
      setState(hydratePrototypeState(JSON.parse(savedState) as PrototypeState));
    } catch {
      window.localStorage.removeItem(stateKey);
      setState(createInitialPrototypeState());
    }
  }, []);

  const loadState = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      loadDemoState();
      return;
    }

    try {
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: coursesData } = await supabase.from('courses').select('*').order('code');
      const { data: registrationsData } = await supabase.from('registrations').select('*');
      const { data: openingsData } = await supabase.from('individual_openings').select('*');
      const { data: settingsData } = await supabase.from('system_settings').select('*');

      const lockedSetting = settingsData?.find((s) => s.key === 'locked')?.value ?? false;
      const seasonSetting = settingsData?.find((s) => s.key === 'currentSeason')?.value ?? 'season-3';
      const registrationCloseSetting = settingsData?.find((s) => s.key === 'registrationClose')?.value ?? '2099-12-31T23:59:00';
      const templatesRaw = settingsData?.find((s) => s.key === 'seasonTemplates')?.value;
      let seasonTemplates = defaultSeasonTemplates;
      if (templatesRaw) {
        try {
          const parsed = typeof templatesRaw === 'string' ? JSON.parse(templatesRaw) as Record<string, unknown>[] : templatesRaw as Record<string, unknown>[];
          if (Array.isArray(parsed)) {
            seasonTemplates = parsed.map((t: Record<string, unknown>) => ({
              id: t.id as string,
              name: t.name as string,
              startDate: (t.startDate as string) || '2026-05-01',
              endDate: (t.endDate as string) || '2026-06-06',
              registrationClose: (t.registrationClose as string) || calculateAutoCloseDate((t.startDate as string) || '2026-05-01'),
            }));
          }
        } catch { /* keep defaultSeasonTemplates */ }
      }

      setState({
        students: studentsData || [],
        courses: (coursesData || []).map((c) => ({
          ...c,
          meetings: typeof c.meetings === 'string' ? JSON.parse(c.meetings) : c.meetings,
        })),
        registrations: registrationsData || [],
        locked: lockedSetting,
        currentSeason: seasonSetting,
        registrationClose: registrationCloseSetting,
        seasonTemplates,
        confirmedClassPicks: [],
        courseSubmissions: [],
        changeRequests: [],
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
  }, [loadDemoState]);

  React.useEffect(() => {
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates prototype state from localStorage or Supabase after mount.
    loadState().then(() => {
      if (!active) return;

      const savedSession = window.localStorage.getItem(sessionKey);
      if (savedSession) setSession(JSON.parse(savedSession) as PrototypeSession);
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [loadState]);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadState]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (session) window.localStorage.setItem(sessionKey, JSON.stringify(session));
    else window.localStorage.removeItem(sessionKey);
  }, [hydrated, session]);

  async function signOut() {
    await logoutAction();
    setSession(null);
    router.push('/login');
  }

  async function resetDemo() {
    if (!isSupabaseConfigured) {
      persistDemoState(createInitialPrototypeState());
      setMessage('데모 데이터가 초기화되었습니다.');
      return;
    }

    try {
      // Delete all registrations
      await supabase.from('registrations').delete().neq('id', '');
      // Delete all individual openings
      await supabase.from('individual_openings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Reset system settings
      await supabase.from('system_settings').upsert([
        { key: 'locked', value: false },
        { key: 'currentSeason', value: 'season-3' },
        { key: 'registrationClose', value: '2099-12-31T23:59:00' }
      ]);

      // Re-insert initial registrations to match initial state
      await supabase.from('registrations').insert([
        { id: 'reg-1',  student_id: 'stu-1', course_id: 'kor-basic',      status: 'active', created_at: '2026-05-01T09:00:00Z' },
        { id: 'reg-2',  student_id: 'stu-1', course_id: 'eng-reading',    status: 'active', created_at: '2026-05-01T09:01:00Z' },
        { id: 'reg-3',  student_id: 'stu-1', course_id: 'math-basic',     status: 'active', created_at: '2026-05-01T09:02:00Z' },
        { id: 'reg-4',  student_id: 'stu-1', course_id: 'science-life',   status: 'active', created_at: '2026-05-01T09:03:00Z' },
        { id: 'reg-5',  student_id: 'stu-2', course_id: 'math-advanced',  status: 'active', created_at: '2026-05-01T09:05:00Z' },
        { id: 'reg-6',  student_id: 'stu-2', course_id: 'eng-reading',    status: 'active', created_at: '2026-05-01T09:06:00Z' },
        { id: 'reg-7',  student_id: 'stu-3', course_id: 'kor-basic',      status: 'active', created_at: '2026-05-01T09:10:00Z' },
        { id: 'reg-8',  student_id: 'stu-3', course_id: 'social-culture', status: 'active', created_at: '2026-05-01T09:11:00Z' },
        { id: 'reg-9',  student_id: 'stu-3', course_id: 'kor-literature', status: 'active', created_at: '2026-05-01T09:12:00Z' },
        { id: 'reg-10', student_id: 'stu-4', course_id: 'math-advanced',  status: 'active', created_at: '2026-05-01T09:15:00Z' },
        { id: 'reg-11', student_id: 'stu-4', course_id: 'eng-reading',    status: 'active', created_at: '2026-05-01T09:16:00Z' },
        { id: 'reg-12', student_id: 'stu-4', course_id: 'science-life',   status: 'active', created_at: '2026-05-01T09:17:00Z' },
        { id: 'reg-13', student_id: 'stu-4', course_id: 'social-culture', status: 'active', created_at: '2026-05-01T09:18:00Z' },
        { id: 'reg-14', student_id: 'stu-4', course_id: 'kor-literature', status: 'active', created_at: '2026-05-01T09:19:00Z' },
        { id: 'reg-15', student_id: 'stu-4', course_id: 'math-basic',     status: 'active', created_at: '2026-05-01T09:20:00Z' }
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
  const canModifySchedule = canStudentModifySchedule(state, getVerifiedNow(), activeStudentId);
  const isStudentSubmitted = Boolean(session?.role === 'student' && getCourseSubmission(state, activeStudentId));
  const isStudentConfirmed = Boolean(session?.role === 'student' && getConfirmedClassPick(state, activeStudentId));
  const hasLockedCourseSelection = isStudentSubmitted || isStudentConfirmed;
  const autoConfirmation = session?.role === 'student' ? getConfirmedClassPick(state, activeStudentId) : undefined;
  const showAutoConfirmationNotice = Boolean(
    autoConfirmation?.source === 'auto' && !autoConfirmation.warningAcknowledgedAt,
  );

  React.useEffect(() => {
    if (!hydrated || session?.role !== 'student') return;
    const nextState = autoConfirmStudentRegistration(state, activeStudentId);
    if (nextState === state) return;

    if (!isSupabaseConfigured) {
      persistDemoState(nextState);
    } else {
      setState(nextState);
    }
  }, [activeStudentId, hydrated, persistDemoState, session?.role, state]);

  function acknowledgeAutoConfirmNotice() {
    const nextState = acknowledgeAutoConfirmation(state, activeStudentId);
    if (nextState === state) return;

    if (!isSupabaseConfigured) {
      persistDemoState(nextState);
    } else {
      setState(nextState);
    }
  }

  async function cancelCourse(courseId: string) {
    if (hasLockedCourseSelection) {
      const result = submitChangeRequest(state, activeStudentId, 'drop', courseId, getVerifiedNow());
      if (result.ok) {
        if (!isSupabaseConfigured) persistDemoState(result.state);
        else setState(result.state);
        setMessage('강의 변경 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.');
      } else {
        setMessage(result.reason);
      }
      return;
    }

    if (!canModifySchedule) {
      setMessage('수강정정기간이 아니어서 취소할 수 없습니다.');
      return;
    }

    if (!isSupabaseConfigured) {
      persistDemoState(dropRegistration(state, activeStudentId, courseId));
      setMessage('강좌 신청을 취소했습니다.');
      return;
    }

    const { error } = await supabase
      .from('registrations')
      .update({ status: 'dropped' })
      .eq('student_id', activeStudentId)
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (error) {
      setMessage(`취소 실패: ${error.message}`);
    } else {
      setMessage('강좌 신청을 취소했습니다.');
      await loadState();
    }
  }

  if (view === 'login') {
    return <LoginScreen onLogin={setSession} />;
  }

  if (!session) {
    return (
      <Shell session={session} onSignOut={signOut}>
        <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <ShieldCheck className="h-12 w-12 text-brand" />
          <h1 className="mt-6 text-2xl font-semibold">로그인이 필요합니다</h1>
          <p className="mt-2 text-sm text-brand-text-muted">본인 계정으로 먼저 로그인한 후에 이용하실 수 있습니다.</p>
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
    <Shell
      session={session}
      onSignOut={signOut}
      darkMode={isAdminView && isAdminDarkMode}
      onToggleDarkMode={() => setIsAdminDarkMode(!isAdminDarkMode)}
    >
      {message ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300">
          <div className="rounded-lg border border-brand bg-brand-light shadow-xl px-5 py-4 flex items-center justify-between gap-3 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-brand shrink-0" />
              <p className="text-sm font-semibold text-brand-dark leading-normal">{message}</p>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-brand hover:text-brand-dark transition-colors p-1 rounded-md hover:bg-brand-bg shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <Modal
        open={showAutoConfirmationNotice}
        onClose={acknowledgeAutoConfirmNotice}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
              <AlertCircle className="h-5 w-5" style={{ color: '#DC2626' }} />
            </div>
            <span className="text-lg font-semibold text-gray-900">수강신청 자동 확정 안내</span>
          </div>
        }
        footer={
          <Button variant="primary" onClick={acknowledgeAutoConfirmNotice} icon={<Check className="h-4 w-4" />}>
            확인했습니다
          </Button>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm leading-relaxed text-gray-600">
            정정기간이 종료되어 현재 담긴 강좌로 수강신청이 자동 확정되었습니다.
          </p>
          <div className="rounded-md p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-xs font-semibold text-gray-900">확정 전 필수 확인</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-700">
              현재 진행 중인 시즌 동안 클래스픽은 고정되며 더 낮은 클래스픽으로 변경할 수 없습니다. 확정 이후 환불은 제공되지 않습니다.
            </p>
          </div>
        </div>
      </Modal>
      {(view === 'dashboard' || view === 'schedule') && (
        <StudentDashboard
          state={state}
          studentId={activeStudentId}
          canModify={canModifySchedule}
          isConfirmed={isStudentConfirmed}
          onCancel={cancelCourse}
        />
      )}
      {(view === 'catalog' || view === 'cart') && (
        <Catalog
          state={state}
          studentId={activeStudentId}
          canModify={canModifySchedule}
          isConfirmed={isStudentConfirmed}
          isSubmitted={isStudentSubmitted}
          onDrop={cancelCourse}
          onCourseSubmit={() => {
            const nextState = submitStudentCourseSelection(state, activeStudentId);
            if (!isSupabaseConfigured) {
              persistDemoState(nextState);
            } else {
              setState(nextState);
            }
            setMessage('수강신청이 완료되었습니다. 이후 변경은 관리자 승인 후 반영됩니다.');
          }}
          onSubmit={() => {
            const nextState = confirmStudentRegistration(state, activeStudentId);
            if (!isSupabaseConfigured) {
              persistDemoState(nextState);
            } else {
              setState(nextState);
            }
            setMessage('수강신청이 확정되었습니다.');
          }}
          onAdd={async (courseId) => {
            if (isStudentConfirmed) {
              const requestResult = submitChangeRequest(state, activeStudentId, 'add', courseId, getVerifiedNow());
              if (requestResult.ok) {
                if (!isSupabaseConfigured) persistDemoState(requestResult.state);
                else setState(requestResult.state);
                setMessage('강의 변경 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.');
              } else {
                setMessage(requestResult.reason);
              }
              return;
            }

            const checkResult = addRegistration(state, activeStudentId, courseId, getVerifiedNow());
            if (!checkResult.ok) {
              setMessage(checkResult.reason);
              return;
            }

            if (!isSupabaseConfigured) {
              persistDemoState(checkResult.state);
              setMessage('강좌를 신청했습니다.');
              return;
            }

            const { error } = await supabase.rpc('register_for_course', {
              p_student_id: activeStudentId,
              p_course_id: courseId,
            });

            if (error) {
              if (error.message?.includes('CAPACITY_EXCEEDED') || error.code === 'ERR90') {
                setMessage('해당 강좌가 방금 마감되었습니다.');
              } else if (error.message?.includes('ALREADY_REGISTERED')) {
                setMessage('이미 신청한 강좌입니다.');
              } else {
                setMessage(`신청 실패: ${error.message}`);
              }
            } else {
              setMessage('강좌를 신청했습니다.');
              await loadState();
            }
          }}
        />
      )}
      {view.startsWith('admin') && (
        <AdminConsole
          view={view}
          state={state}
          darkMode={isAdminDarkMode}
          onToggleLock={async () => {
            const nextLocked = !state.locked;
            if (!isSupabaseConfigured) {
              persistDemoState({ ...state, locked: nextLocked });
              setMessage(nextLocked ? '수강신청을 잠갔습니다.' : '수강신청을 열었습니다.');
              return;
            }

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
            const closeVal = open ? '2099-12-31T23:59:00' : '2000-01-01T00:00:00';
            if (!isSupabaseConfigured) {
              persistDemoState({ ...state, locked: false, registrationClose: closeVal });
              setMessage(open ? '수강정정기간을 열었습니다.' : '수강정정기간을 닫았습니다.');
              return;
            }

            const { error: err1 } = await supabase
              .from('system_settings')
              .upsert({ key: 'locked', value: false });

            const { error: err2 } = await supabase
              .from('system_settings')
              .upsert({ key: 'registrationClose', value: closeVal });

            if (err1 || err2) {
              setMessage('설정 변경 실패');
            } else {
              setMessage(open ? '수강정정기간을 열었습니다.' : '수강정정기간을 닫았습니다.');
              await loadState();
            }
          }}
          onUpdateSchedule={async (seasonId, registrationClose) => {
            if (!isSupabaseConfigured) {
              persistDemoState({ ...state, currentSeason: seasonId, registrationClose });
              setMessage('학사 일정을 저장했습니다.');
              return;
            }

            const { error } = await supabase
              .from('system_settings')
              .upsert([
                { key: 'currentSeason', value: seasonId },
                { key: 'registrationClose', value: registrationClose },
              ]);

            if (error) {
              setMessage(`일정 저장 실패: ${error.message}`);
            } else {
              setMessage('학사 일정을 저장했습니다.');
              await loadState();
            }
          }}
          onUpdateTemplates={async (templates) => {
            if (!isSupabaseConfigured) {
              persistDemoState({ ...state, seasonTemplates: templates });
              setMessage('시즌 템플릿을 저장했습니다.');
              return;
            }

            const { error } = await supabase
              .from('system_settings')
              .upsert({ key: 'seasonTemplates', value: JSON.stringify(templates) });

            if (error) {
              setMessage(`템플릿 저장 실패: ${error.message}`);
            } else {
              setMessage('시즌 템플릿을 저장했습니다.');
              await loadState();
            }
          }}
          onGrantStudentOpening={async (studentId) => {
            if (!isSupabaseConfigured) {
              persistDemoState({
                ...state,
                locked: false,
                individualOpenings: [
                  ...state.individualOpenings,
                  {
                    studentId,
                    open: '2026-05-01T00:00:00',
                    close: '2099-12-31T23:59:00',
                    reason: 'demo opening',
                  },
                ],
              });
              setMessage('해당 학생에게 개별 수강신청을 오픈했습니다.');
              return;
            }

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
          onAdminAddStudent={async (student) => {
            if (!session) return;
            const res = await adminAddStudentAction(session.id, student);
            if (res.success && res.student) {
              if (res.mock) {
                const nextStudents = [...state.students, res.student];
                persistDemoState({ ...state, students: nextStudents });
              } else {
                await loadState();
              }
              setMessage(`학생 '${res.student.name}'이 등록되었습니다.`);
            } else {
              setMessage(res.error || '학생 등록 실패');
            }
          }}
          onAdminDeleteStudents={async (studentIds) => {
            if (!session) return;
            const res = await adminDeleteStudentsAction(session.id, studentIds);
            if (res.success) {
              if (res.mock) {
                const studentIdsSet = new Set(studentIds);
                const nextStudents = state.students.filter((s) => !studentIdsSet.has(s.id));
                const nextRegistrations = state.registrations.filter((r) => !studentIdsSet.has(r.studentId));
                const nextOpenings = state.individualOpenings.filter((o) => !studentIdsSet.has(o.studentId));
                const nextRequests = state.changeRequests.filter((c) => !studentIdsSet.has(c.studentId));
                persistDemoState({
                  ...state,
                  students: nextStudents,
                  registrations: nextRegistrations,
                  individualOpenings: nextOpenings,
                  changeRequests: nextRequests,
                });
              } else {
                await loadState();
              }
              setMessage('선택한 학생 정보가 삭제되었습니다.');
            } else {
              setMessage(res.error || '학생 삭제 실패');
            }
          }}
          onAdminAddClass={async (studentId, courseId) => {
            if (!session) return;
            const res = await adminAddStudentClassAction(session.id, studentId, courseId);
            if (res.success) {
              if (res.mock) {
                const checkResult = adminAddStudentClass(state, studentId, courseId);
                if (checkResult.ok) persistDemoState(checkResult.state);
              } else {
                await loadState();
              }
              setMessage('관리자가 학생 강좌를 추가했습니다.');
            } else {
              setMessage(res.error || '추가 실패');
            }
          }}
          onAdminDropClass={async (studentId, courseId) => {
            if (!session) return;
            const res = await adminDropStudentClassAction(session.id, studentId, courseId);
            if (res.success) {
              if (res.mock) {
                persistDemoState(adminDropStudentClass(state, studentId, courseId));
              } else {
                await loadState();
              }
              setMessage('관리자가 학생 강좌를 제외했습니다.');
            } else {
              setMessage(res.error || '제외 실패');
            }
          }}
          onApproveChangeRequest={async (requestId) => {
            if (!session) return;
            const res = await approveChangeRequestAction(session.id, requestId);
            if (res.success) {
              if (res.mock) {
                const result = approveChangeRequest(state, requestId);
                if (result.ok) persistDemoState(result.state);
              } else {
                await loadState();
              }
              setMessage('강의 변경 신청을 승인했습니다.');
            } else {
              setMessage(res.error || '승인 실패');
            }
          }}
          onRejectChangeRequest={async (requestId) => {
            if (!session) return;
            const res = await rejectChangeRequestAction(session.id, requestId);
            if (res.success) {
              if (res.mock) {
                const result = rejectChangeRequest(state, requestId);
                if (result.ok) persistDemoState(result.state);
              } else {
                await loadState();
              }
              setMessage('강의 변경 신청을 반려했습니다.');
            } else {
              setMessage(res.error || '반려 실패');
            }
          }}
          onImportStudents={async (rows) => {
            const newStudents: PrototypeStudent[] = [];
            const newRegistrations: PrototypeRegistration[] = [];
            const existingStudents = [...state.students];
            const existingRegs = [...state.registrations];

            let importedStudentCount = 0;
            let importedRegCount = 0;

            rows.forEach((r, i) => {
              const name = (r.이름 || r.name || '').trim();
              if (!name) return;

              const cohortId = (r.반 || r.cohortId || '2027-final-6').trim();
              const school = (r.학교명 || r.school || '').trim();
              const level = (r.수준 || r.level || '종합').trim();
              const target = (r.목표 || r.target || '').trim();

              // Check if student with same name and cohort already exists in the system
              let student = existingStudents.find(
                (s) => s.name.toLowerCase() === name.toLowerCase() && s.cohortId.toLowerCase() === cohortId.toLowerCase()
              );

              let studentId = '';
              if (student) {
                studentId = student.id;
                // Optionally update metadata if supplied
                student.school = school || student.school;
                student.level = level || student.level;
                student.target = target || student.target;
              } else {
                studentId = `stu-import-${Date.now()}-${i}`;
                student = {
                  id: studentId,
                  name,
                  dob: '2007-01-01',
                  cohortId,
                  school,
                  level,
                  target,
                };
                existingStudents.push(student);
                newStudents.push(student);
                importedStudentCount++;
              }

              // Parse courses column
              const coursesStr = (
                r.신청강좌 ||
                r.신청_강좌 ||
                r.신청강좌목록 ||
                r.수강강좌 ||
                r.강좌 ||
                r.courses ||
                r['신청 강좌'] ||
                ''
              ).trim();

              if (coursesStr) {
                // Split by comma, semicolon or pipe symbol
                const courseTokens = coursesStr.split(/[,;|]+/).map((t) => t.trim()).filter(Boolean);
                courseTokens.forEach((token, j) => {
                  // Find course by title or code or ID (case-insensitive)
                  const course = state.courses.find(
                    (c) => c.title.toLowerCase() === token.toLowerCase() ||
                           c.code.toLowerCase() === token.toLowerCase() ||
                           c.id.toLowerCase() === token.toLowerCase()
                  );

                  if (course) {
                    // Check if already registered actively
                    const alreadyRegistered = existingRegs.some(
                      (reg) => reg.studentId === studentId && reg.courseId === course.id && reg.status === 'active'
                    );

                    if (!alreadyRegistered) {
                      const regId = `reg-import-${Date.now()}-${i}-${j}`;
                      const reg: PrototypeRegistration = {
                        id: regId,
                        studentId,
                        courseId: course.id,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                      };
                      existingRegs.push(reg);
                      newRegistrations.push(reg);
                      importedRegCount++;
                    }
                  }
                });
              }
            });

            if (importedStudentCount === 0 && importedRegCount === 0) {
              setMessage('새로 추가된 학생이나 강좌 신청 정보가 없습니다.');
              return;
            }

            if (!isSupabaseConfigured) {
              persistDemoState({
                ...state,
                students: existingStudents,
                registrations: existingRegs,
              });
              setMessage(`${importedStudentCount}명의 학생과 ${importedRegCount}건의 강좌 신청을 가져왔습니다.`);
              return;
            }

            try {
              // Supabase Mode
              // 1. Upsert all students
              const upsertList = existingStudents.map((s) => ({
                id: s.id,
                name: s.name,
                dob: s.dob,
                cohort_id: s.cohortId,
                school: s.school,
                level: s.level,
                target: s.target,
              }));

              const { error: studentError } = await supabase.from('students').upsert(
                upsertList,
                { onConflict: 'id' },
              );

              if (studentError) {
                setMessage(`학생 가져오기 실패: ${studentError.message}`);
                return;
              }

              // 2. Insert new registrations
              if (newRegistrations.length > 0) {
                const { error: regError } = await supabase.from('registrations').insert(
                  newRegistrations.map((r) => ({
                    id: r.id,
                    student_id: r.studentId,
                    course_id: r.courseId,
                    status: r.status,
                    created_at: r.createdAt,
                  }))
                );

                if (regError) {
                  setMessage(`학생 정보는 저장되었으나, 일부 강좌 등록이 실패했습니다: ${regError.message}`);
                } else {
                  setMessage(`${importedStudentCount}명의 학생과 ${importedRegCount}건의 강좌 신청을 가져왔습니다.`);
                }
              } else {
                setMessage(`${importedStudentCount}명의 학생을 가져왔습니다.`);
              }
              await loadState();
            } catch (err) {
              setMessage('학생 및 강좌 가져오기 중 오류가 발생했습니다.');
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
  const [identifier, setIdentifier] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const response = await loginAction(identifier, secret);
      if (!response.success || !response.session) {
        setError(response.error || '로그인 정보가 일치하지 않습니다.');
        return;
      }
      const session = response.session;
      window.localStorage.setItem(sessionKey, JSON.stringify(session));
      onLogin(session);
      router.push(session.role === 'student' ? '/dashboard' : '/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md space-y-6">
        <section className="text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium text-brand-dark">
            ETOOS 247 이천기숙학원
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            이천기숙학원 수강신청
          </h1>
        </section>

        <section className="rounded-lg border border-brand-border bg-white p-6 text-left shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-brand" />
            <div>
              <h2 className="font-semibold">로그인</h2>
              <p className="text-sm text-brand-text-muted">수강신청 시스템 로그인 정보를 입력하세요.</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">이름 또는 이메일</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="이름 또는 이메일을 입력하세요"
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-3 outline-none focus:border-brand text-brand-text"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">생년월일 6자리 또는 비밀번호</span>
              <input
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                type={identifier.includes('@') ? 'password' : 'text'}
                placeholder="생년월일 6자리(YYMMDD) 또는 비밀번호"
                className="mt-2 w-full rounded-md border border-brand-border px-3 py-3 outline-none focus:border-brand text-brand-text"
              />
            </label>
            {error ? <p className="text-sm text-brand-danger">{error}</p> : null}
            <button className="w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white">시작하기</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Shell({
  children,
  session,
  onSignOut,
  darkMode = false,
  onToggleDarkMode,
}: {
  children: React.ReactNode;
  session: PrototypeSession | null;
  onSignOut: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}) {
  return (
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-brand-text'}`}>
      <header className={`sticky top-0 z-10 border-b transition-colors duration-300 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white/95 border-brand-border backdrop-blur'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href={session?.role === 'admin' || session?.role === 'super_admin' ? '/admin' : '/dashboard'} className="font-semibold text-brand">
            ETOOS 247 수강신청
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {session?.role === 'student' ? (
              <>
                <Nav href="/dashboard" label="대시보드" darkMode={darkMode} />
                <Nav href="/catalog" label="수강신청" darkMode={darkMode} />
              </>
            ) : null}
            {session?.role === 'admin' || session?.role === 'super_admin' ? (
              <Nav href="/admin" label="관리자" darkMode={darkMode} />
            ) : null}
          </nav>
          <div className="flex items-center gap-3">
            {session ? <span className={`hidden text-sm sm:inline ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>{session.name}</span> : null}
            {onToggleDarkMode ? (
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-md border transition-colors ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700' : 'bg-white border-brand-border text-zinc-600 hover:bg-gray-50'
                }`}
                title={darkMode ? '라이트 모드' : '다크 모드'}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            ) : null}
            {session ? (
              <button onClick={onSignOut} className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors ${darkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-100' : 'border-brand-border hover:bg-gray-50 text-brand-text'}`}>
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

function Nav({ href, label, darkMode }: { href: string; label: string; darkMode?: boolean }) {
  return (
    <Link href={href} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${darkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-brand-text-muted hover:bg-brand-bg hover:text-brand-text'}`}>
      {label}
    </Link>
  );
}

function StudentDashboard({
  state,
  studentId,
  canModify,
  isConfirmed,
  onCancel,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  isConfirmed: boolean;
  onCancel: (courseId: string) => void | Promise<void>;
}) {
  const student = state.students.find((item) => item.id === studentId) ?? state.students[0];
  const courses = getStudentCourses(state, student.id);
  const classPick = getEffectiveClassPick(state, student.id);
  const pendingRequests = state.changeRequests.filter((request) => request.studentId === student.id && request.status === 'pending');
  const confirmed = getConfirmedClassPick(state, student.id);

  return (
    <Page title={`${student.name} 학생 대시보드`} description="신청 현황, 변경 요청, 내 시간표를 한 화면에서 확인하세요.">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="신청 강좌" value={`${courses.length}개`} icon={<BookOpen />} />
        <Metric label="클래스픽" value={classPick} icon={<ShoppingCart />} />
        <Metric label="신청 상태" value={confirmed ? '확정' : canModify ? '정정중' : '마감'} icon={<CheckCircle2 />} />
        <Metric label="변경 요청" value={`${pendingRequests.length}건`} icon={<CalendarDays />} />
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="내 신청 강좌">
          <CompactCourseSummary courses={courses} />
          {pendingRequests.length > 0 ? (
            <div className="mt-4 rounded-md bg-brand-light px-3 py-2 text-xs leading-relaxed text-brand-dark">
              승인 대기 중인 강의 변경 신청이 {pendingRequests.length}건 있습니다.
            </div>
          ) : null}
        </Panel>
        <Panel title="내 시간표">
          <ScheduleTable state={state} studentId={student.id} />
        </Panel>
      </div>
    </Page>
  );
}

function CompactCourseSummary({ courses }: { courses: PrototypeCourse[] }) {
  if (courses.length === 0) {
    return <p className="text-sm text-brand-text-muted">아직 신청한 강좌가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {courses.map((course) => (
        <div key={course.id} className="rounded-md border border-brand-border px-3 py-2">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold">{course.title}</p>
            <span className="shrink-0 rounded-full bg-brand-bg px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              {course.subject}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Catalog({
  state,
  studentId,
  canModify,
  isConfirmed,
  isSubmitted,
  onAdd,
  onDrop,
  onCourseSubmit,
  onSubmit,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  isConfirmed: boolean;
  isSubmitted: boolean;
  onAdd: (courseId: string) => void;
  onDrop: (courseId: string) => void;
  onCourseSubmit: () => void;
  onSubmit: () => void;
}) {
  const [query, setQuery] = React.useState('');
  const [subject, setSubject] = React.useState<PrototypeSubject | '전체'>('전체');
  const [addedId, setAddedId] = React.useState<string | null>(null);
  const active = getStudentCourses(state, studentId);
  const hasLockedCourseSelection = isSubmitted || isConfirmed;
  const filtered = state.courses.filter((course) => {
    const matchesSubject = subject === '전체' || course.subject === subject;
    const matchesQuery = `${course.title} ${course.instructor} ${course.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  function handleAdd(courseId: string) {
    onAdd(courseId);
    setAddedId(courseId);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <Page title="수강 신청">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
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
          {!canModify && !isConfirmed ? (
            <div className="mb-5 rounded-md border border-brand-warning-bg bg-brand-warning-light px-4 py-3 text-sm text-brand-warning">
              수강정정기간이 아니어서 강좌를 담거나 변경할 수 없습니다.
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((course) => {
              const enrolled = active.some((item) => item.id === course.id);
              const hasPendingAdd = state.changeRequests.some(
                (request) =>
                  request.studentId === studentId &&
                  request.courseId === course.id &&
                  request.type === 'add' &&
                  request.status === 'pending',
              );
              const hasPendingDrop = state.changeRequests.some(
                (request) =>
                  request.studentId === studentId &&
                  request.courseId === course.id &&
                  request.type === 'drop' &&
                  request.status === 'pending',
              );
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  actionLabel={hasPendingDrop ? '승인 대기' : enrolled ? '수강 중' : hasPendingAdd ? '승인 대기' : hasLockedCourseSelection ? '수강신청' : canModify ? '담기' : '정정기간 아님'}
                  disabled={hasPendingDrop || enrolled || (!enrolled && (hasPendingAdd || (!canModify && !hasLockedCourseSelection)))}
                  status={hasPendingDrop ? 'pending' : enrolled ? 'active' : hasPendingAdd ? 'pending' : 'default'}
                  onAction={() => {
                    if (enrolled) return;
                    handleAdd(course.id);
                  }}
                />
              );
            })}
          </div>
        </div>
        <RegistrationSummary
          state={state}
          studentId={studentId}
          canModify={canModify}
          isConfirmed={isConfirmed}
          isSubmitted={isSubmitted}
          onDrop={onDrop}
          onCourseSubmit={onCourseSubmit}
          onSubmit={onSubmit}
        />
      </div>
    </Page>
  );
}

function Schedule({ state, studentId }: { state: PrototypeState; studentId: string }) {
  return (
    <Page title="개인 시간표" description="요일별로 선택한 수업 시간을 확인하세요.">
      <ScheduleTable state={state} studentId={studentId} />
    </Page>
  );
}

function ScheduleTable({ state, studentId }: { state: PrototypeState; studentId: string }) {
  const scheduleRows = getPersonalScheduleRows(state, studentId);
  const lastVisibleRowIndex = scheduleRows.findIndex((row) => row.label === '4교시');
  const rows = lastVisibleRowIndex >= 0 ? scheduleRows.slice(0, lastVisibleRowIndex + 1) : scheduleRows;

  return (
    <div
      data-testid="schedule-table-frame"
      className="max-h-[calc(100vh-12rem)] overflow-auto rounded-md border border-brand-border bg-white"
    >
      <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="w-[12%] border-b border-r border-brand-border px-3 py-3 text-center font-semibold">교시</th>
              <th className="w-[16%] border-b border-r border-brand-border px-3 py-3 text-center font-semibold">시간</th>
              {weekDays.map((day) => (
                <th key={day} className="min-w-[132px] border-b border-r border-brand-border px-3 py-3 text-center font-semibold last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowLabel = row.label || row.content;

              if (!row.classBlock) {
                return (
                  <tr key={`${rowLabel}-${row.time}`} className="bg-gray-50">
                    <th className="border-b border-r border-brand-border px-3 py-2 text-center font-medium text-gray-700">
                      {rowLabel}
                    </th>
                    <td className="border-b border-r border-brand-border px-3 py-2 text-center text-gray-500">{row.time}</td>
                    <td colSpan={weekDays.length} className="border-b border-brand-border px-3 py-2 text-center text-gray-500">
                      <span className="whitespace-pre-line leading-5">{row.content}</span>
                    </td>
                  </tr>
                );
              }

              const classBlock = row.classBlock;

              return (
                <tr key={`${rowLabel}-${row.time}`} className="bg-white">
                  <th className="border-b border-r border-brand-border px-3 py-2 text-center font-medium text-brand-text-muted">
                    {rowLabel}
                  </th>
                  <td className="border-b border-r border-brand-border px-3 py-2 text-center text-brand-text-muted">{row.time}</td>
                  {weekDays.map((day) => {
                    const coursesForDay = row.courses.filter((course) =>
                      course.meetings.some((meeting) => meeting.day === day && meeting.block === classBlock),
                    );

                    return (
                      <td key={`${rowLabel}-${day}`} className="border-b border-r border-brand-border px-2 py-2 align-top last:border-r-0">
                        {coursesForDay.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {coursesForDay.map((course) => (
                              <div key={`${course.id}-${day}-${classBlock}`} className="rounded-md border border-brand bg-brand-light px-2.5 py-2 text-left">
                                <p className="font-semibold text-brand-dark">{course.title}</p>
                                <p className="mt-1 text-xs text-brand-text-muted">
                                  {course.instructor} · {blockLabels[classBlock]}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="block text-center text-brand-text-faint">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
      </table>
    </div>
  );
}

function RegistrationSummary({
  state,
  studentId,
  canModify,
  isConfirmed,
  isSubmitted,
  onDrop,
  onCourseSubmit,
  onSubmit,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  isConfirmed: boolean;
  isSubmitted: boolean;
  onDrop: (courseId: string) => void;
  onCourseSubmit: () => void;
  onSubmit: () => void;
}) {
  const [showCourseSubmitConfirm, setShowCourseSubmitConfirm] = React.useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
  const [cancelCourse, setCancelCourse] = React.useState<PrototypeCourse | null>(null);
  const courses = getStudentCourses(state, studentId);
  const confirmedClassPick = getConfirmedClassPick(state, studentId);
  const hasConfirmedClassPick = Boolean(confirmedClassPick);
  const courseSubmission = getCourseSubmission(state, studentId);
  const hasCourseSubmission = Boolean(courseSubmission) || isSubmitted || hasConfirmedClassPick;
  const classPick = getEffectiveClassPick(state, studentId);
  const classPickRange = {
    'Class A': '1~3개 강의',
    'Class B': '4~6개 강의',
    'Class C': '7~9개 강의',
    'Class D': '10개 강의 이상',
  }[classPick];

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <Panel title="신청 요약">
        <div className="space-y-3 text-sm">
          <Row label="강좌 수" value={`${courses.length}개`} />
          <Row label="클래스픽" value={classPick} />
        </div>
        {hasConfirmedClassPick ? (
          <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-xs leading-relaxed text-brand-dark">
            신청이 확정되어 현재 시즌의 클래스픽은 {confirmedClassPick?.classPick} 이상으로 유지됩니다.
          </p>
        ) : hasCourseSubmission ? (
          <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-xs leading-relaxed text-brand-dark">
            수강신청이 완료되어 강좌 취소와 변경은 관리자 승인 후 반영됩니다.
          </p>
        ) : null}
        <button
          onClick={() => setShowCourseSubmitConfirm(true)}
          disabled={courses.length === 0 || hasCourseSubmission || !canModify}
          className="mt-5 w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {hasCourseSubmission ? '수강신청 완료' : '수강신청하기'}
        </button>
        {hasCourseSubmission ? (
          <button
            onClick={() => setShowFinalConfirm(true)}
            disabled={courses.length === 0 || hasConfirmedClassPick}
            className="mt-3 w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {hasConfirmedClassPick ? '신청확정 완료' : '신청확정하기'}
          </button>
        ) : null}
        <div className="mt-5 space-y-3">
          {courses.length === 0 ? <p className="text-sm text-brand-text-muted">담은 강좌가 없습니다.</p> : null}
          {courses.map((course) => {
            const hasPendingDrop = state.changeRequests.some(
              (request) =>
                request.studentId === studentId &&
                request.courseId === course.id &&
                request.type === 'drop' &&
                request.status === 'pending',
            );
            return (
              <div key={course.id} className="rounded-md border border-brand-border p-3">
                <p className="text-sm font-semibold">{course.title}</p>
                <p className="mt-1 text-xs text-brand-text-muted">{course.meetings.map((meeting) => `${meeting.day} ${blockLabels[meeting.block]}`).join(', ')}</p>
                <button
                  onClick={() => {
                    if (hasCourseSubmission) {
                      setCancelCourse(course);
                    } else {
                      onDrop(course.id);
                    }
                  }}
                  disabled={hasPendingDrop || (!canModify && !hasCourseSubmission)}
                  className="mt-3 w-full rounded-md border border-brand-border px-3 py-2 text-xs hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {hasPendingDrop ? '승인 대기' : '수강취소'}
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Modal
        open={Boolean(cancelCourse)}
        onClose={() => setCancelCourse(null)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
              <AlertCircle className="h-5 w-5" style={{ color: '#DC2626' }} />
            </div>
            <span className="text-lg font-semibold text-gray-900">수강취소 확인</span>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelCourse(null)}>
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (cancelCourse) onDrop(cancelCourse.id);
                setCancelCourse(null);
              }}
            >
              수강취소
            </Button>
          </>
        }
      >
        <p className="py-2 text-sm leading-relaxed text-gray-600">
          {cancelCourse?.title} 강좌를 정말로 취소하시겠습니까?
        </p>
      </Modal>

      <Modal
        open={showCourseSubmitConfirm}
        onClose={() => setShowCourseSubmitConfirm(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50" style={{ backgroundColor: '#E8F5F3' }}>
              <Info className="h-5 w-5 text-brand" style={{ color: '#2DAE9D' }} />
            </div>
            <span className="text-lg font-semibold text-gray-900">수강신청 확인</span>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCourseSubmitConfirm(false)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowCourseSubmitConfirm(false);
                onCourseSubmit();
              }}
              icon={<Check className="h-4 w-4" />}
            >
              수강신청 완료
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            선택하신 <span className="font-semibold text-gray-900">{courses.length}개 강의</span>로 수강신청을 진행합니다.
          </p>
          <div className="rounded-md p-4 flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-semibold mb-1 text-gray-900">수강신청 후 변경 안내</p>
              <p>
                수강신청하기를 누르면 현재 선택한 강좌가 신청 완료 상태로 고정됩니다. 이후 강좌 취소와 변경은 관리자 승인 후 반영됩니다.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showFinalConfirm}
        onClose={() => setShowFinalConfirm(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50" style={{ backgroundColor: '#E8F5F3' }}>
              <Info className="h-5 w-5 text-brand" style={{ color: '#2DAE9D' }} />
            </div>
            <span className="text-lg font-semibold text-gray-900">신청확정 확인</span>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFinalConfirm(false)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowFinalConfirm(false);
                onSubmit();
              }}
              icon={<Check className="h-4 w-4" />}
            >
              확인하고 신청확정
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            선택하신 <span className="font-semibold text-gray-900">{courses.length}개 강의</span>로 신청을 최종 확정합니다.
          </p>
          <div className="rounded-md p-4" style={{ backgroundColor: '#F4FAF9', border: '1px solid #E8F5F3' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">배정 단계</span>
              <Pill color="teal" size="md">
                {classPick}
              </Pill>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              신청 강의 수 ({classPickRange})에 따라 <span className="font-semibold">{classPick}</span> 단계로 자동 배정됩니다.
            </p>
          </div>
          <div className="rounded-md p-4 flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-semibold mb-1 text-gray-900">확정 전 필수 확인</p>
              <p>
                신청 확정 후 현재 진행 중인 시즌 동안 클래스픽은 고정되며 더 낮은 클래스픽으로 변경할 수 없습니다. 확정 이후 환불은 제공되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </aside>
  );
}

function Cart({
  state,
  studentId,
  canModify,
  isConfirmed,
  onDrop,
  onSubmit,
}: {
  state: PrototypeState;
  studentId: string;
  canModify: boolean;
  isConfirmed: boolean;
  onDrop: (courseId: string) => void;
  onSubmit: () => void;
}) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const courses = getStudentCourses(state, studentId);
  const confirmedClassPick = getConfirmedClassPick(state, studentId);
  const hasConfirmedClassPick = Boolean(confirmedClassPick);
  const classPick = getEffectiveClassPick(state, studentId);

  const classPickRange = {
    'Class A': '1~3개 강의',
    'Class B': '4~6개 강의',
    'Class C': '7~9개 강의',
    'Class D': '10개 강의 이상',
  }[classPick];

  return (
    <Page title="장바구니" description="최종 신청 전 강좌 수와 클래스픽을 확인하세요.">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="담은 강좌">
          <div className="space-y-3">
            {!canModify && !isConfirmed ? <p className="rounded-md bg-brand-warning-light px-3 py-2 text-sm text-brand-warning">수강정정기간이 아니어서 변경할 수 없습니다.</p> : null}
            {isConfirmed ? <p className="rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">확정 이후 강의 변경은 관리자 승인 후 반영됩니다.</p> : null}
            {courses.length === 0 ? <p className="text-sm text-brand-text-muted">담은 강좌가 없습니다.</p> : null}
            {courses.map((course) => {
              const hasPendingDrop = state.changeRequests.some(
                (request) =>
                  request.studentId === studentId &&
                  request.courseId === course.id &&
                  request.type === 'drop' &&
                  request.status === 'pending',
              );
              return (
              <div key={course.id} className="flex items-center justify-between gap-4 rounded-md border border-brand-border p-4">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="mt-1 text-sm text-brand-text-muted">{course.meetings.map((meeting) => `${meeting.day} ${blockLabels[meeting.block]}`).join(', ')}</p>
                </div>
                <button
                  onClick={() => onDrop(course.id)}
                  disabled={hasPendingDrop || (!canModify && !isConfirmed)}
                  className="rounded-md border border-brand-border px-3 py-2 text-sm hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {hasPendingDrop ? '승인 대기' : isConfirmed ? '변경 신청' : '제외'}
                </button>
              </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="신청 요약">
          <div className="space-y-3 text-sm">
            <Row label="강좌 수" value={`${courses.length}개`} />
            <Row label="클래스픽" value={classPick} />
          </div>
          {hasConfirmedClassPick ? (
            <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-xs leading-relaxed text-brand-dark">
              신청이 확정되어 현재 시즌의 클래스픽은 {confirmedClassPick?.classPick} 이상으로 유지됩니다.
            </p>
          ) : null}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={courses.length === 0 || hasConfirmedClassPick}
            className="mt-5 w-full rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            신청 확정
          </button>
          {hasConfirmedClassPick ? (
            <Link
              href="/catalog"
              className="mt-3 block w-full rounded-md border border-brand px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-brand-light"
            >
              강의 변경 신청
            </Link>
          ) : null}
        </Panel>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50" style={{ backgroundColor: '#E8F5F3' }}>
              <Info className="h-5 w-5 text-brand" style={{ color: '#2DAE9D' }} />
            </div>
            <span className="text-lg font-semibold text-gray-900">수강신청 확인</span>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowConfirm(false);
                onSubmit();
              }}
              icon={<Check className="h-4 w-4" />}
            >
              확인하고 신청 완료
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            선택하신 <span className="font-semibold text-gray-900">{courses.length}개 강의</span>로 수강신청을 진행합니다.
          </p>

          <div className="rounded-md p-4" style={{ backgroundColor: '#F4FAF9', border: '1px solid #E8F5F3' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">배정 단계</span>
              <Pill color="teal" size="md">
                {classPick}
              </Pill>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              신청 강의 수 ({classPickRange})에 따라 <span className="font-semibold">{classPick}</span> 단계로 자동 배정됩니다.
            </p>
          </div>

          <div className="rounded-md p-4 flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-semibold mb-1 text-gray-900">확정 전 필수 확인</p>
              <p>
                신청 확정 후 현재 진행 중인 시즌 동안 클래스픽은 고정되며 더 낮은 클래스픽으로 변경할 수 없습니다. 확정 이후 환불은 제공되지 않습니다.
              </p>
            </div>
          </div>

        </div>
      </Modal>
    </Page>
  );
}

function AdminConsole({
  view,
  state,
  darkMode = false,
  onToggleLock,
  onSetCorrectionOpen,
  onUpdateSchedule,
  onUpdateTemplates,
  onGrantStudentOpening,
  onAdminAddClass,
  onAdminDropClass,
  onApproveChangeRequest,
  onRejectChangeRequest,
  onImportStudents,
  onReset,
  onAdminAddStudent,
  onAdminDeleteStudents,
}: {
  view: View;
  state: PrototypeState;
  darkMode?: boolean;
  onToggleLock: () => void;
  onSetCorrectionOpen: (open: boolean) => void;
  onUpdateSchedule: (seasonId: string, registrationClose: string) => void;
  onUpdateTemplates: (templates: SeasonTemplate[]) => void;
  onGrantStudentOpening: (studentId: string) => void;
  onAdminAddClass: (studentId: string, courseId: string) => void;
  onAdminDropClass: (studentId: string, courseId: string) => void;
  onApproveChangeRequest: (requestId: string) => void;
  onRejectChangeRequest: (requestId: string) => void;
  onImportStudents: (rows: Record<string, string>[]) => void;
  onReset: () => void;
  onAdminAddStudent: (student: Omit<PrototypeStudent, 'id'>) => void;
  onAdminDeleteStudents: (studentIds: string[]) => void;
}) {
  const activeRegistrations = state.registrations.filter((item) => item.status === 'active');
  const activeSeason = getActiveSeason(state);

  const [selectedSeason, setSelectedSeason] = React.useState(state.currentSeason);
  const [registrationClose, setRegistrationClose] = React.useState(state.registrationClose.slice(0, 16));
  const [showTemplateEditor, setShowTemplateEditor] = React.useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setSelectedSeason(state.currentSeason); }, [state.currentSeason]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setRegistrationClose(state.registrationClose.slice(0, 16)); }, [state.registrationClose]);

  const phase = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (now <= new Date(state.registrationClose).getTime()) return 'registration' as const;
    return 'closed' as const;
  }, [state.registrationClose]);

  const phaseLabel = {
    registration: '수강신청 진행 중',
    closed: '마감 완료',
  }[phase];

  function applySeasonTemplate(seasonId: string) {
    const template = getSeason(state.seasonTemplates, seasonId);
    if (!template) return;
    setSelectedSeason(seasonId);
    setRegistrationClose(template.registrationClose);
  }

  return (
    <Page title="관리자 콘솔" description="수강신청 운영을 위한 통합 제어판입니다." darkMode={darkMode}>
      <div className="mb-5 flex flex-wrap gap-2">
        <AdminTab href="/admin" label="요약" active={view === 'admin'} darkMode={darkMode} />
        <AdminTab href="/admin/students" label="학생" active={view === 'admin-students'} darkMode={darkMode} />
        <AdminTab href="/admin/courses" label="강좌" active={view === 'admin-courses'} darkMode={darkMode} />
        <AdminTab href="/admin/registrations" label="신청" active={view === 'admin-registrations'} darkMode={darkMode} />
      </div>

      {view === 'admin' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="전체 학생" value={`${state.students.length}명`} icon={<Users />} darkMode={darkMode} href="/admin/students" />
            <Metric label="개설 강좌" value={`${state.courses.length}개`} icon={<BookOpen />} darkMode={darkMode} href="/admin/courses" />
            <Metric label="활성 신청" value={`${activeRegistrations.length}건`} icon={<CheckCircle2 />} darkMode={darkMode} href="/admin/registrations" />
            <div className={`rounded-lg border p-4 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
              <div className={`flex items-center justify-between gap-3 ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
                <span className="text-sm">운영 상태</span>
                <Lock className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-3">
                <Pill color={state.locked ? 'red' : 'teal'} size="md">{state.locked ? '수강신청 잠김' : '수강신청 가능'}</Pill>
              </div>
            </div>
          </div>

          <AdminDashboard state={state} activeRegistrations={activeRegistrations} darkMode={darkMode} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4 text-brand" />
                학사 일정 및 마감 기한 설정
              </h2>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateSchedule(selectedSeason, `${registrationClose}:00`);
                }}
              >
                <label className="block text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-zinc-300' : ''}>운영 시즌 템플릿</span>
                    <button
                      type="button"
                      onClick={() => setShowTemplateEditor(true)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      템플릿 편집
                    </button>
                  </div>
                  <select
                    value={selectedSeason}
                    onChange={(e) => applySeasonTemplate(e.target.value)}
                    className={`mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
                      darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-brand'
                        : 'bg-white border-brand-border text-brand-text focus:border-brand'
                    }`}
                  >
                    {state.seasonTemplates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startDate} ~ {s.endDate})
                      </option>
                    ))}
                  </select>
                </label>
                <SmartDateInput
                  label="수강신청 마감일시"
                  value={registrationClose}
                  onChange={(v) => setRegistrationClose(v)}
                  type="end"
                  darkMode={darkMode}
                />
                <Button type="submit" variant="primary" size="md">
                  학사 일정 저장
                </Button>
              </form>

              <div className={`mt-6 border-t pt-5 ${darkMode ? 'border-zinc-800' : 'border-brand-border'}`}>
                <h3 className="mb-4 text-sm font-semibold">학사 운영 타임라인</h3>
                <Roadmap
                  phase={phase}
                  startDate={activeSeason?.startDate ?? '-'}
                  registrationClose={registrationClose}
                  endDate={activeSeason?.endDate ?? '-'}
                  darkMode={darkMode}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4 text-brand" />
                  글로벌 수강신청 제어
                </h2>
                <p className={`mb-3 text-sm ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
                  {state.locked
                    ? '수강신청이 잠겨 있어 학생의 신청/변경이 제한됩니다.'
                    : '수강신청이 열려 있어 학생이 자유롭게 신청/변경할 수 있습니다.'}
                </p>
                <div className={`flex overflow-hidden rounded-md border ${darkMode ? 'border-zinc-800' : 'border-brand-border'}`}>
                  <button
                    onClick={() => { if (state.locked) onToggleLock(); }}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: !state.locked ? '#2DAE9D' : (darkMode ? '#1F2937' : '#FFFFFF'),
                      color: !state.locked ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    신청 가능
                  </button>
                  <button
                    onClick={() => { if (!state.locked) onToggleLock(); }}
                    className={`flex-1 border-l px-4 py-2.5 text-sm font-semibold transition-colors ${darkMode ? 'border-zinc-800' : 'border-brand-border'}`}
                    style={{
                      backgroundColor: state.locked ? '#DC2626' : (darkMode ? '#1F2937' : '#FFFFFF'),
                      color: state.locked ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    신청 잠금
                  </button>
                </div>
              </div>

              <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  현재 학사 시즌 정보
                </h2>
                <div className="space-y-3 text-sm">
                  <Row
                    label="운영 시즌"
                    value={activeSeason ? activeSeason.name : '-'}
                    darkMode={darkMode}
                  />
                  <Row
                    label="시즌 기간"
                    value={activeSeason ? `${activeSeason.startDate} ~ ${activeSeason.endDate}` : '-'}
                    darkMode={darkMode}
                  />
                  <Row
                    label="현재 단계"
                    value={phaseLabel}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  운영 단축 프리셋
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => onSetCorrectionOpen(true)}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      darkMode
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                        : 'border-brand-border bg-white text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    정정기간 즉시 열기
                  </button>
                  <button
                    onClick={() => onSetCorrectionOpen(false)}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      darkMode
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                        : 'border-brand-border bg-white text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    정정기간 즉시 닫기
                  </button>
                  {!isSupabaseConfigured && (
                    <>
                      <hr className={darkMode ? 'border-zinc-800' : 'border-brand-border-light'} />
                      <button
                        onClick={onReset}
                        className={`w-full rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          darkMode
                            ? 'border-brand-danger bg-red-950/20 text-brand-danger hover:bg-red-950/40'
                            : 'border-brand-danger-bg bg-white text-brand-danger hover:bg-brand-danger-bg'
                        }`}
                      >
                        데모 데이터 초기화
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <SeasonTemplateEditor
            open={showTemplateEditor}
            templates={state.seasonTemplates}
            darkMode={darkMode}
            onSave={(templates) => {
              onUpdateTemplates(templates);
              setShowTemplateEditor(false);
            }}
            onClose={() => setShowTemplateEditor(false)}
          />
        </>
      ) : null}

      {view === 'admin-students' ? (
        <AdminStudents
          state={state}
          darkMode={darkMode}
          onAdminAddClass={onAdminAddClass}
          onAdminDropClass={onAdminDropClass}
          onGrantStudentOpening={onGrantStudentOpening}
          onImportStudents={onImportStudents}
          onAdminAddStudent={onAdminAddStudent}
          onAdminDeleteStudents={onAdminDeleteStudents}
        />
      ) : null}

      {view === 'admin-courses' ? (
        <AdminCourses state={state} darkMode={darkMode} />
      ) : null}

      {view === 'admin-registrations' ? (
        <AdminRegistrations
          state={state}
          darkMode={darkMode}
          onApproveChangeRequest={onApproveChangeRequest}
          onRejectChangeRequest={onRejectChangeRequest}
        />
      ) : null}
    </Page>
  );
}

function AddStudentModal({
  darkMode = false,
  onClose,
  onSave,
}: {
  darkMode?: boolean;
  onClose: () => void;
  onSave: (student: Omit<PrototypeStudent, 'id'>) => void;
}) {
  const [name, setName] = React.useState('');
  const [dob, setDob] = React.useState('2007-01-01');
  const [cohortId, setCohortId] = React.useState('2027-final-6');
  const [school, setSchool] = React.useState('');
  const [level, setLevel] = React.useState('종합 3등급');
  const [target, setTarget] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      dob,
      cohortId,
      school: school.trim(),
      level: level.trim(),
      target: target.trim(),
    });
  };

  return (
    <Modal
      title="신규 학생 등록"
      open={true}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            등록 완료
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-left">
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>이름 *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-gray-300'
            }`}
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>생년월일 *</label>
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>반 *</label>
          <input
            type="text"
            required
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-gray-300'
            }`}
            placeholder="2027-final-6"
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>학교명</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-gray-300'
            }`}
            placeholder="이천고등학교"
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>수준</label>
          <input
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-gray-300'
            }`}
            placeholder="종합 3등급"
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>목표</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-gray-300'
            }`}
            placeholder="국수영탐 균형 상승"
          />
        </div>
      </form>
    </Modal>
  );
}

function AdminStudents({
  state,
  darkMode = false,
  onAdminAddClass,
  onAdminDropClass,
  onGrantStudentOpening,
  onImportStudents,
  onAdminAddStudent,
  onAdminDeleteStudents,
}: {
  state: PrototypeState;
  darkMode?: boolean;
  onAdminAddClass: (studentId: string, courseId: string) => void;
  onAdminDropClass: (studentId: string, courseId: string) => void;
  onGrantStudentOpening: (studentId: string) => void;
  onImportStudents: (rows: Record<string, string>[]) => void;
  onAdminAddStudent: (student: Omit<PrototypeStudent, 'id'>) => void;
  onAdminDeleteStudents: (studentIds: string[]) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const filtered = state.students.filter((s) => {
    const q = query.toLowerCase();
    return `${s.name} ${s.cohortId} ${s.school} ${s.level}`.toLowerCase().includes(q);
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = await parseExcelFile(file);
    onImportStudents(rows);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <Panel title="학생 목록" darkMode={darkMode}>
      <div className="mb-4 flex gap-2 flex-wrap items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 반, 학교명, 수준 검색"
          className={`flex-1 min-w-[200px] rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-brand ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
              : 'bg-white border-brand-border text-brand-text placeholder-brand-text-faint'
          }`}
        />
        {selectedIds.size > 0 ? (
          <button
            onClick={() => {
              if (confirm(`선택한 ${selectedIds.size}명의 학생을 정말 삭제하시겠습니까?\n해당 학생들의 모든 수강 신청 내역도 함께 삭제됩니다.`)) {
                onAdminDeleteStudents(Array.from(selectedIds));
                setSelectedIds(new Set());
              }
            }}
            className="rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold transition-colors"
          >
            선택 삭제 ({selectedIds.size})
          </button>
        ) : null}
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-md bg-brand hover:bg-brand-dark text-white px-3 py-2 text-xs font-semibold transition-colors"
        >
          학생 등록
        </button>
        <button
          onClick={() => exportStudents(state.students)}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
            darkMode
              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-850 bg-zinc-800 hover:text-white'
              : 'border-brand-border text-brand-text hover:bg-brand-bg'
          }`}
        >
          Excel 내보내기
        </button>
        <label className={`cursor-pointer rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
          darkMode
            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-850 bg-zinc-800 hover:text-white'
            : 'border-brand-border text-brand-text hover:bg-brand-bg'
        }`}>
          Excel 가져오기
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-sm">
          <thead className={darkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-brand-bg'}>
            <tr>
              <th className={`border-b px-3 py-2 text-left font-semibold w-8 ${darkMode ? 'border-zinc-800' : 'border-brand-border'}`}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(filtered.map(s => s.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-brand focus:ring-brand"
                />
              </th>
              {['반', '이름', '학교명', '수준', '목표', '현재 강좌', '강좌 편집', '관리'].map((header) => (
                <th
                  key={header}
                  className={`border-b px-3 py-2 text-left font-semibold ${
                    darkMode ? 'border-zinc-800 text-zinc-300' : 'border-brand-border'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => {
              const opening = state.individualOpenings.find((item) => item.studentId === student.id);
              const studentCourses = getStudentCourses(state, student.id);
              const activeIds = new Set(studentCourses.map((course) => course.id));
              const availableCourses = state.courses.filter((course) => !activeIds.has(course.id));
              return (
                <tr
                  key={student.id}
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-brand-bg/40'
                  }`}
                >
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) {
                          next.add(student.id);
                        } else {
                          next.delete(student.id);
                        }
                        setSelectedIds(next);
                      }}
                      className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                  </td>
                  <td className={`border-b px-3 py-3 text-xs font-semibold ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border'}`}>{student.cohortId}</td>
                  <td className={`border-b px-3 py-3 font-semibold ${darkMode ? 'border-zinc-850 text-zinc-200' : 'border-brand-border'}`}>{student.name}</td>
                  <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-450' : 'border-brand-border'}`}>{student.school}</td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850 text-zinc-300' : 'border-brand-border'}`}>{student.level}</td>
                  <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border'}`}>{student.target}</td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <div className="space-y-1.5">
                      {studentCourses.length === 0 ? <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-muted'}`}>없음</span> : null}
                      {studentCourses.map((course) => (
                        <div key={course.id} className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1 ${
                          darkMode ? 'border-zinc-700 bg-zinc-800/30' : 'border-brand-border bg-white'
                        }`}>
                          <span className="text-xs">{course.title}</span>
                          <button
                            onClick={() => onAdminDropClass(student.id, course.id)}
                            className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
                              darkMode ? 'border-zinc-750 text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'border-brand-border text-brand-text hover:bg-brand-bg'
                            }`}
                          >
                            제외
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        onAdminAddClass(student.id, event.target.value);
                        event.target.value = '';
                      }}
                      className={`w-40 rounded-md border px-2 py-1.5 text-xs outline-none transition-colors ${
                        darkMode
                          ? 'bg-zinc-800 border-zinc-750 text-zinc-200 focus:border-brand'
                          : 'bg-white border-brand-border text-brand-text'
                      }`}
                    >
                      <option value="">강좌 추가</option>
                      {availableCourses.map((course) => (
                        <option key={course.id} value={course.id} className={darkMode ? 'bg-zinc-900 text-zinc-100' : ''}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onGrantStudentOpening(student.id)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                          darkMode
                            ? 'border-zinc-750 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            : 'border-brand-border text-brand-text hover:bg-brand-bg'
                        }`}
                      >
                        신규 입소생 오픈
                      </button>
                      {opening ? <span className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-brand-text-muted'}`}>오픈됨</span> : null}
                      <button
                        onClick={() => {
                          if (confirm(`학생 '${student.name}'을(를) 정말 삭제하시겠습니까?\n해당 학생의 모든 수강 신청 기록도 함께 삭제됩니다.`)) {
                            onAdminDeleteStudents([student.id]);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-semibold ml-2 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className={`px-3 py-8 text-center text-sm ${darkMode ? 'text-zinc-550' : 'text-brand-text-muted'}`}>검색 결과가 없습니다.</p>
        ) : null}
      </div>
      {showAddModal && (
        <AddStudentModal
          darkMode={darkMode}
          onClose={() => setShowAddModal(false)}
          onSave={(student) => {
            onAdminAddStudent(student);
            setShowAddModal(false);
          }}
        />
      )}
    </Panel>
  );
}

function AdminCourses({
  state,
  darkMode = false,
}: {
  state: PrototypeState;
  darkMode?: boolean;
}) {
  const [query, setQuery] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const filtered = state.courses.filter((c) => {
    const q = query.toLowerCase();
    return `${c.code} ${c.subject} ${c.title} ${c.instructor}`.toLowerCase().includes(q);
  });

  function studentsInCourse(courseId: string) {
    const regs = state.registrations.filter((r) => r.courseId === courseId && r.status === 'active');
    return regs.map((r) => state.students.find((s) => s.id === r.studentId)).filter(Boolean) as PrototypeStudent[];
  }

  return (
    <Panel title="강좌 목록" darkMode={darkMode}>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="코드, 과목, 강좌명, 강사 검색"
          className={`flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-brand ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
              : 'bg-white border-brand-border text-brand-text placeholder-brand-text-faint'
          }`}
        />
        <button
          onClick={() => {
            const enrollmentMap: Record<string, { cohortId: string; name: string; school: string }[]> = {};
            for (const c of state.courses) {
              enrollmentMap[c.code] = state.registrations
                .filter((r) => r.courseId === c.id && r.status === 'active')
                .map((r) => state.students.find((s) => s.id === r.studentId))
                .filter(Boolean)
                .map((s) => ({ cohortId: s!.cohortId, name: s!.name, school: s!.school }));
            }
            exportCourses(state.courses, enrollmentMap);
          }}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
            darkMode
              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-850 bg-zinc-800 hover:text-white'
              : 'border-brand-border text-brand-text hover:bg-brand-bg'
          }`}
        >
          Excel 내보내기
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className={darkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-brand-bg'}>
            <tr>
              {['', '코드', '과목', '강좌명', '강사', '정원'].map((header) => (
                <th
                  key={header}
                  className={`border-b px-3 py-2 text-left font-semibold ${
                    darkMode ? 'border-zinc-800 text-zinc-300' : 'border-brand-border'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((course) => {
              const enrolled = studentsInCourse(course.id);
              const isExpanded = expandedId === course.id;
              const pct = Math.round((course.enrolled / Math.max(course.capacity, 1)) * 100);
              return (
                <React.Fragment key={course.id}>
                  <tr
                    className={`cursor-pointer transition-colors ${
                      darkMode ? 'hover:bg-zinc-850/50' : 'hover:bg-brand-bg/40'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : course.id)}
                  >
                    <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-500' : 'border-brand-border text-brand-text-faint'}`}>
                      {isExpanded ? '▼' : '▶'}
                    </td>
                    <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border text-brand-text-faint'}`}>{course.code}</td>
                    <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border text-brand-text-faint'}`}>{course.subject}</td>
                    <td className={`border-b px-3 py-3 font-semibold ${darkMode ? 'border-zinc-850 text-zinc-200' : 'border-brand-border'}`}>{course.title}</td>
                    <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-300' : 'border-brand-border text-brand-text-muted'}`}>{course.instructor}</td>
                    <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850 text-zinc-200' : 'border-brand-border'}`}>
                      <span className="text-sm font-semibold">{course.enrolled}/{course.capacity}</span>
                      <span className={`ml-1 text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-faint'}`}>({pct}%)</span>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className={darkMode ? 'bg-zinc-950/30' : 'bg-brand-bg/40'}>
                      <td colSpan={6} className={`border-b px-6 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                        <p className={`mb-2 text-xs font-semibold ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
                          수강 학생 ({enrolled.length}명)
                        </p>
                        {enrolled.length === 0 ? (
                          <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-muted'}`}>수강 학생 없음</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {enrolled.map((s) => (
                              <span key={s.id} className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-brand-border text-brand-text'
                              }`}>
                                {s.name} ({s.cohortId})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className={`px-3 py-8 text-center text-sm ${darkMode ? 'text-zinc-550' : 'text-brand-text-muted'}`}>검색 결과가 없습니다.</p>
        ) : null}
      </div>
    </Panel>
  );
}

function AdminRegistrations({
  state,
  darkMode = false,
  onApproveChangeRequest,
  onRejectChangeRequest,
}: {
  state: PrototypeState;
  darkMode?: boolean;
  onApproveChangeRequest: (requestId: string) => void;
  onRejectChangeRequest: (requestId: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const pendingRequests = state.changeRequests.filter((request) => request.status === 'pending');
  const registered = state.students.filter((s) =>
    state.registrations.some((r) => r.studentId === s.id && r.status === 'active'),
  );
  const filtered = registered.filter((s) => {
    const q = query.toLowerCase();
    return `${s.name} ${s.cohortId} ${s.school}`.toLowerCase().includes(q);
  });

  const exportRows = filtered.map((student) => {
    const courses = getStudentCourses(state, student.id);
    return {
      cohortId: student.cohortId,
      name: student.name,
      school: student.school,
      courses: courses.map((c) => c.title).join(', '),
      count: courses.length,
      pick: calculateClassPick(courses.length),
    };
  });

  return (
    <div className="space-y-5">
      <Panel title="강의 변경 신청" darkMode={darkMode}>
        {pendingRequests.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-brand-text-muted'}`}>대기 중인 변경 신청이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const student = state.students.find((item) => item.id === request.studentId);
              const course = state.courses.find((item) => item.id === request.courseId);
              return (
                <div key={request.id} className={`flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between ${
                  darkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-brand-border bg-white'
                }`}>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-zinc-200' : 'text-brand-text'}`}>
                      {student?.name ?? '-'} · {request.type === 'add' ? '추가' : '제외'} 요청
                    </p>
                    <p className={`mt-1 text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-muted'}`}>
                      {course?.title ?? '-'} · {new Date(request.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onRejectChangeRequest(request.id)}>
                      반려
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => onApproveChangeRequest(request.id)}>
                      승인
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="신청 현황" darkMode={darkMode}>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 반, 학교명 검색"
          className={`flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-brand ${
            darkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
              : 'bg-white border-brand-border text-brand-text placeholder-brand-text-faint'
          }`}
        />
        <button
          onClick={() => exportRegistrations(exportRows)}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
            darkMode
              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-850 bg-zinc-800 hover:text-white'
              : 'border-brand-border text-brand-text hover:bg-brand-bg'
          }`}
        >
          Excel 내보내기
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className={darkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-brand-bg'}>
            <tr>
              {['반', '이름', '학교명', '신청 강좌', '개수', '상태'].map((header) => (
                <th
                  key={header}
                  className={`border-b px-3 py-2 text-left font-semibold ${
                    darkMode ? 'border-zinc-800 text-zinc-300' : 'border-brand-border'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => {
              const courses = getStudentCourses(state, student.id);
              const count = courses.length;
              const pick = calculateClassPick(count);
              return (
                <tr
                  key={student.id}
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-brand-bg/40'
                  }`}
                >
                  <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border text-brand-text-faint'}`}>{student.cohortId}</td>
                  <td className={`border-b px-3 py-3 font-semibold ${darkMode ? 'border-zinc-850 text-zinc-200' : 'border-brand-border'}`}>{student.name}</td>
                  <td className={`border-b px-3 py-3 text-xs ${darkMode ? 'border-zinc-850 text-zinc-400' : 'border-brand-border text-brand-text-faint'}`}>{student.school}</td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <div className="flex flex-wrap gap-1">
                      {courses.map((c) => (
                        <span key={c.id} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                          darkMode ? 'bg-brand/15 text-brand' : 'bg-brand-light text-brand-dark'
                        }`}>
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-zinc-200' : 'text-brand-text'}`}>{count}개</span>
                    <span className={`ml-1 text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-faint'}`}>{pick}</span>
                  </td>
                  <td className={`border-b px-3 py-3 ${darkMode ? 'border-zinc-850' : 'border-brand-border'}`}>
                    <Pill color="teal" size="sm">신청 완료</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className={`px-3 py-8 text-center text-sm ${darkMode ? 'text-zinc-550' : 'text-brand-text-muted'}`}>검색 결과가 없습니다.</p>
        ) : null}
      </div>
      </Panel>
    </div>
  );
}

function AdminDashboard({
  state,
  activeRegistrations,
  darkMode = false,
}: {
  state: PrototypeState;
  activeRegistrations: PrototypeRegistration[];
  darkMode?: boolean;
}) {
  const totalCapacity = state.courses.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = state.courses.reduce((s, c) => s + c.enrolled, 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const registeredStudentIds = new Set(activeRegistrations.map((r) => r.studentId));
  const unregistered = state.students.filter((s) => !registeredStudentIds.has(s.id)).length;

  const subjectCounts: Record<string, { enrolled: number; capacity: number }> = {};
  for (const c of state.courses) {
    if (!subjectCounts[c.subject]) subjectCounts[c.subject] = { enrolled: 0, capacity: 0 };
    subjectCounts[c.subject].enrolled += c.enrolled;
    subjectCounts[c.subject].capacity += c.capacity;
  }

  const maxEnrolled = Math.max(...state.courses.map((c) => c.enrolled), 1);

  const pickCounts: Record<string, number> = { 'Class A': 0, 'Class B': 0, 'Class C': 0, 'Class D': 0 };
  const pickLabels: Record<string, string> = { 'Class A': '1~3개', 'Class B': '4~6개', 'Class C': '7~9개', 'Class D': '10개+' };
  const pickColors: Record<string, string> = {
    'Class A': darkMode ? '#A1A1AA' : '#6B7280',
    'Class B': '#259387',
    'Class C': '#2DAE9D',
    'Class D': '#D97706',
  };
  for (const s of state.students) {
    const count = activeRegistrations.filter((r) => r.studentId === s.id).length;
    const pick = calculateClassPick(count);
    pickCounts[pick] = (pickCounts[pick] || 0) + 1;
  }
  const maxPickCount = Math.max(...Object.values(pickCounts), 1);
  const totalStudents = state.students.length;

  const instructorStats: { name: string; enrolled: number; capacity: number }[] = [];
  const instructorMap: Record<string, { enrolled: number; capacity: number }> = {};
  for (const c of state.courses) {
    if (!instructorMap[c.instructor]) instructorMap[c.instructor] = { enrolled: 0, capacity: 0 };
    instructorMap[c.instructor].enrolled += c.enrolled;
    instructorMap[c.instructor].capacity += c.capacity;
  }
  for (const [name, stats] of Object.entries(instructorMap)) {
    instructorStats.push({ name, ...stats });
  }
  instructorStats.sort((a, b) => b.enrolled - a.enrolled);
  const maxInstEnrolled = Math.max(...instructorStats.map((i) => i.enrolled), 1);

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-lg border p-4 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
          <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>전체 정원 충족률</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-2xl font-semibold text-brand">{fillRate}%</span>
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-brand-text-faint'}`}>{totalEnrolled}/{totalCapacity}</span>
          </div>
          <div className={`mt-2 h-1.5 w-full rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
            <div className="h-1.5 rounded-full bg-brand transition-all" style={{ width: `${fillRate}%` }} />
          </div>
        </div>

        <Link href="/admin/students" className="block no-underline">
          <div className={`rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:border-brand hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'
          }`}>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>신청 학생 수</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold">{registeredStudentIds.size}/{state.students.length}</span>
              <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>명</span>
            </div>
            {unregistered > 0 ? (
              <p className="mt-1 text-xs text-brand-warning">미신청 {unregistered}명</p>
            ) : (
              <p className="mt-1 text-xs text-brand">전원 신청 완료</p>
            )}
          </div>
        </Link>

        <Link href="/admin/registrations" className="block no-underline">
          <div className={`rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:border-brand hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'
          }`}>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>평균 신청 과목</p>
            <p className="mt-2 text-2xl font-semibold">
              {registeredStudentIds.size > 0 ? (activeRegistrations.length / registeredStudentIds.size).toFixed(1) : '0'}개
            </p>
            <p className={`mt-1 text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>전체 {activeRegistrations.length}건</p>
          </div>
        </Link>

        <Link href="/admin/courses" className="block no-underline">
          <div className={`rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:border-brand hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'
          }`}>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>운영 강좌</p>
            <p className="mt-2 text-2xl font-semibold">{state.courses.length}개</p>
            <p className={`mt-1 text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
              {state.courses.filter((c) => c.enrolled >= c.capacity).length}개 마감
            </p>
          </div>
        </Link>
      </div>

      <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
        <h3 className="mb-4 text-sm font-semibold">클래스픽(Class Pick) 분포</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(pickCounts).map(([pick, count]) => (
            <div key={pick} className="text-center">
              <p className="text-xs font-semibold" style={{ color: pickColors[pick] }}>{pick}</p>
              <p className="mt-1 text-2xl font-semibold">{count}명</p>
              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>{pickLabels[pick]} · {Math.round((count / totalStudents) * 100)}%</p>
              <div className={`mx-auto mt-2 h-1.5 w-full rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round((count / maxPickCount) * 100)}%`, backgroundColor: pickColors[pick] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
          <h3 className="mb-4 text-sm font-semibold">강좌별 신청 현황</h3>
          <div className="space-y-3">
            {state.courses.map((course) => {
              const pct = Math.round((course.enrolled / Math.max(course.capacity, 1)) * 100);
              const barWidth = Math.round((course.enrolled / maxEnrolled) * 100);
              return (
                <div key={course.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{course.title}</span>
                    <span className={`ml-2 shrink-0 ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>{course.enrolled}/{course.capacity}</span>
                  </div>
                  <div className={`mt-1 h-2 w-full rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: pct >= 95 ? '#DC2626' : '#2DAE9D',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
          <h3 className="mb-4 text-sm font-semibold">과목별 신청 분포</h3>
          <div className="space-y-3">
            {Object.entries(subjectCounts).map(([subject, counts]) => {
              const pct = Math.round((counts.enrolled / Math.max(counts.capacity, 1)) * 100);
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{subject}</span>
                    <span className={darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}>{counts.enrolled}/{counts.capacity} ({pct}%)</span>
                  </div>
                  <div className={`mt-1 h-2 w-full rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-brand-border text-brand-text'}`}>
          <h3 className="mb-4 text-sm font-semibold">선생님별 신청 현황</h3>
          <div className="space-y-3">
            {instructorStats.map((inst) => {
              const pct = Math.round((inst.enrolled / Math.max(inst.capacity, 1)) * 100);
              const barWidth = Math.round((inst.enrolled / maxInstEnrolled) * 100);
              return (
                <div key={inst.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{inst.name}</span>
                    <span className={`ml-2 shrink-0 ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>{inst.enrolled}명 ({pct}%)</span>
                  </div>
                  <div className={`mt-1 h-2 w-full rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: pct >= 95 ? '#DC2626' : '#2DAE9D',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Roadmap({
  phase,
  startDate,
  registrationClose,
  endDate,
  darkMode = false,
}: {
  phase: 'registration' | 'closed';
  startDate: string;
  registrationClose: string;
  endDate: string;
  darkMode?: boolean;
}) {
  const fmt = (v: string) => {
    if (!v.includes('T')) return v;
    const [d, t] = v.split('T');
    const [y, m, day] = d.split('-');
    return `${m}/${day} ${t}`;
  };

  const steps = [
    { key: 'registration' as const, label: '수강신청 진행', desc: `시즌 시작 ~ ${fmt(registrationClose)} 까지` },
    { key: 'closed' as const, label: '마감 및 확정', desc: `마감: ${fmt(registrationClose)}` },
    { key: 'end' as const, label: '시즌 종료', desc: `종료: ${endDate}` },
  ];
  const phaseIndex = phase === 'registration' ? 0 : steps.length;

  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isActive = phaseIndex === i;
        const isPast = phaseIndex > i;
        return (
          <div key={step.key} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-mono"
                style={{
                  backgroundColor: isActive ? '#2DAE9D' : isPast ? (darkMode ? '#1E293B' : '#E8F5F3') : (darkMode ? '#27272A' : '#F3F4F6'),
                  color: isActive ? '#FFFFFF' : isPast ? '#259387' : (darkMode ? '#71717A' : '#9CA3AF'),
                  boxShadow: isActive ? '0 0 0 4px rgba(45, 174, 157, 0.15)' : 'none',
                }}
              >
                {isPast ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <p
                className="mt-2 text-center text-xs font-semibold"
                style={{ color: isActive ? '#259387' : isPast ? (darkMode ? '#A1A1AA' : '#6B7280') : (darkMode ? '#52525B' : '#9CA3AF') }}
              >
                {step.label}
              </p>
              <p className={`mt-0.5 text-center text-[10px] leading-tight ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {step.desc}
              </p>
            </div>
            {i < steps.length - 1 ? (
              <div
                className="mx-1 mt-4 h-0.5 flex-1"
                style={{ backgroundColor: isPast ? '#2DAE9D' : (darkMode ? '#27272A' : '#E5E7EB') }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SeasonTemplateEditor({
  open,
  templates,
  darkMode = false,
  onSave,
  onClose,
}: {
  open: boolean;
  templates: SeasonTemplate[];
  darkMode?: boolean;
  onSave: (templates: SeasonTemplate[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<SeasonTemplate[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- Syncs draft when modal opens with fresh templates. */
  React.useEffect(() => {
    if (open) setDraft(templates.map((t) => ({ ...t })));
  }, [open, templates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function updateField(
    index: number,
    field: keyof SeasonTemplate,
    value: string,
  ) {
    setDraft((prev) => {
      const next = [...prev];
      if (field === 'startDate') {
        next[index] = { ...next[index], startDate: value, registrationClose: calculateAutoCloseDate(value) };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  }

  function removeTemplate(index: number) {
    if (draft.length <= 1) return;
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function addTemplate() {
    const maxId = draft.reduce((max, t) => {
      const match = t.id.match(/^season-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = `season-${maxId + 1}`;
    setDraft((prev) => [
      ...prev,
      {
        id: newId,
        name: `시즌 ${maxId + 1}`,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        registrationClose: calculateAutoCloseDate('2026-01-01'),
      },
    ]);
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      darkMode={darkMode}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: darkMode ? '#1F2937' : '#E8F5F3' }}>
            <CalendarDays className="h-5 w-5 text-brand" />
          </div>
          <span className={`text-lg font-semibold ${darkMode ? 'text-zinc-100' : 'text-gray-900'}`}>시즌 템플릿 편집</span>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            icon={<Check className="h-4 w-4" />}
            onClick={() => onSave(draft)}
          >
            템플릿 저장
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {draft.map((template, i) => (
          <div
            key={template.id}
            className={`rounded-lg border p-4 transition-colors ${
              darkMode ? 'bg-zinc-800 border-zinc-700' : 'border-brand-border bg-white'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-xs font-semibold ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
                {template.id}
              </span>
              {draft.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeTemplate(i)}
                  className={`rounded p-1 transition-colors ${
                    darkMode ? 'text-zinc-500 hover:bg-red-950/40 hover:text-red-400' : 'text-brand-text-faint hover:bg-brand-danger-bg hover:text-brand-danger'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-brand-text'}`}>
                시즌 제목
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => updateField(i, 'name', e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand ${
                    darkMode
                      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 focus:bg-zinc-800'
                      : 'bg-white border-brand-border text-brand-text'
                  }`}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <SmartDateInput
                  label="시작일"
                  value={`${template.startDate}T00:00`}
                  onChange={(v) => updateField(i, 'startDate', v.slice(0, 10))}
                  darkMode={darkMode}
                />
                <SmartDateInput
                  label="종료일"
                  value={`${template.endDate}T00:00`}
                  onChange={(v) => updateField(i, 'endDate', v.slice(0, 10))}
                  type="end"
                  darkMode={darkMode}
                />
              </div>
              <SmartDateInput
                label="수강신청 마감일시"
                value={template.registrationClose}
                onChange={(v) => updateField(i, 'registrationClose', v)}
                type="end"
                darkMode={darkMode}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTemplate}
          className={`w-full rounded-md border border-dashed px-4 py-3 text-sm font-semibold transition-colors ${
            darkMode
              ? 'border-zinc-700 text-zinc-400 hover:border-brand hover:text-brand bg-zinc-800/30'
              : 'border-brand-border text-brand-text-muted hover:border-brand hover:text-brand bg-white'
          }`}
        >
          + 시즌 템플릿 추가
        </button>
      </div>
    </Modal>
  );
}

function CourseCard({
  course,
  actionLabel,
  disabled,
  status = 'default',
  onAction,
}: {
  course: PrototypeCourse;
  actionLabel: string;
  disabled?: boolean;
  status?: 'default' | 'active' | 'pending';
  onAction: () => void;
}) {
  const isActive = status === 'active';
  const isPending = status === 'pending';

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        isActive
          ? 'border-brand bg-brand-light'
          : isPending
            ? 'border-brand-warning-bg bg-brand-warning-light'
            : 'border-brand-border bg-white'
      }`}
    >
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
        className={`mt-4 w-full rounded-md border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'border-brand bg-white text-brand disabled:border-brand disabled:bg-white disabled:text-brand'
            : isPending
              ? 'border-brand-warning-bg bg-white text-brand-warning disabled:border-brand-warning-bg disabled:bg-white disabled:text-brand-warning'
              : 'border-brand bg-brand text-white hover:bg-brand-dark active:scale-[0.98] disabled:border-brand-border disabled:bg-white disabled:text-brand-text-muted'
        }`}
      >
        {actionLabel === '신청됨' || actionLabel === '수강 중' ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {actionLabel}
          </span>
        ) : (
          actionLabel
        )}
      </button>
    </article>
  );
}

function CourseList({
  courses,
  empty,
  compact = false,
  actionLabel,
  actionDisabled = false,
  onAction,
}: {
  courses: PrototypeCourse[];
  empty: string;
  compact?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: (courseId: string) => void | Promise<void>;
}) {
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
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-brand-bg px-2 py-1 text-xs text-brand-dark">{course.level}</span>
              {actionLabel && onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    void onAction(course.id);
                  }}
                  disabled={actionDisabled}
                  className="rounded-md border border-brand-border px-2.5 py-1.5 text-xs font-medium text-brand-text-muted hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLabel}
                </button>
              ) : null}
            </div>
          </div>
          {!compact ? <p className="mt-3 text-sm text-brand-text-muted">{course.summary}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Page({
  title,
  description,
  children,
  darkMode = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  darkMode?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold tracking-normal ${darkMode ? 'text-zinc-100' : 'text-brand-text'}`}>{title}</h1>
        {description ? <p className={`mt-2 text-sm ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Panel({
  title,
  children,
  darkMode = false,
}: {
  title: string;
  children: React.ReactNode;
  darkMode?: boolean;
}) {
  return (
    <section className={`rounded-lg border p-5 transition-colors duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-brand-border'}`}>
      <h2 className={`mb-4 font-semibold ${darkMode ? 'text-zinc-100' : 'text-brand-text'}`}>{title}</h2>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
  darkMode = false,
  href,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  darkMode?: boolean;
  href?: string;
}) {
  const card = (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${
        darkMode
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
          : 'bg-white border-brand-border text-brand-text'
      } ${
        href
          ? 'cursor-pointer hover:border-brand dark:hover:border-brand hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      <div className={`flex items-center justify-between gap-3 ${darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}`}>
        <span className="text-sm">{label}</span>
        {icon ? <span className="text-brand [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {card}
      </Link>
    );
  }

  return card;
}

function Row({ label, value, darkMode = false }: { label: string; value: string; darkMode?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={darkMode ? 'text-zinc-400' : 'text-brand-text-muted'}>{label}</span>
      <span className={`text-right font-medium ${darkMode ? 'text-zinc-100' : 'text-brand-text'}`}>{value}</span>
    </div>
  );
}

function AdminTab({
  href,
  label,
  active,
  darkMode = false,
}: {
  href: string;
  label: string;
  active: boolean;
  darkMode?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-2 text-sm transition-colors duration-200 ${
        active
          ? 'border-brand bg-brand text-white'
          : darkMode
          ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          : 'border-brand-border bg-white text-brand-text hover:bg-brand-bg'
      }`}
    >
      {label}
    </Link>
  );
}
