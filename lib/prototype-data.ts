import { supabase } from '@/lib/supabase';

export type PrototypeRole = 'student' | 'admin' | 'super_admin';
export const prototypeSubjects = ['국어', '수학', '영어', '사회탐구', '과학탐구'] as const;
export type PrototypeSubject = (typeof prototypeSubjects)[number];
export type PrototypeDay = '월' | '화' | '수' | '목' | '금';
export type PrototypeBlock = 'A' | 'B' | 'C' | 'D';

export type PrototypeStudent = {
  id: string;
  name: string;
  dob: string;
  cohortId: string;
  level: string;
  target: string;
};

export type PrototypeCourse = {
  id: string;
  code: string;
  subject: PrototypeSubject;
  title: string;
  instructor: string;
  level: string;
  credits: number;
  capacity: number;
  enrolled: number;
  meetings: { day: PrototypeDay; block: PrototypeBlock; time: string }[];
  summary: string;
};

export type PrototypeRegistration = {
  id: string;
  studentId: string;
  courseId: string;
  status: 'active' | 'dropped';
  createdAt: string;
};

export type IndividualOpening = {
  studentId: string;
  open: string;
  close: string;
  reason: string;
};

export type PrototypeState = {
  students: PrototypeStudent[];
  courses: PrototypeCourse[];
  registrations: PrototypeRegistration[];
  locked: boolean;
  deadline: string;
  correctionOpen: string;
  correctionClose: string;
  individualOpenings: IndividualOpening[];
};

export type PrototypeSession = {
  role: PrototypeRole;
  id: string;
  name: string;
};

export type PrototypeArea = 'student' | 'admin';
export type DailyScheduleRow = {
  label: string;
  time: string;
  content: string;
  classBlock?: PrototypeBlock;
};

export type PersonalScheduleRow = DailyScheduleRow & {
  courses: PrototypeCourse[];
};

export const blockLabels: Record<PrototypeBlock, string> = {
  A: '1-2교시',
  B: '3-4교시',
  C: '5-6교시',
  D: '7-8교시',
};

export const dailyScheduleRows: DailyScheduleRow[] = [
  { label: '', time: '06:30', content: '기상' },
  { label: '아침식사', time: '06:30~07:40', content: '세면 / 아침식사' },
  { label: '0교시', time: '07:40~08:15', content: '학습 플래너 작성 / 일일 TEST / 인원 점검' },
  { label: '1교시', time: '08:20~10:00', content: '선택 수업\n(또는 인강 & 자기주도학습)', classBlock: 'A' },
  { label: '2교시', time: '10:20~12:00', content: '선택 수업\n(또는 인강 & 자기주도학습)', classBlock: 'B' },
  { label: '점심식사', time: '12:00~13:10', content: '점심식사' },
  { label: '종례 A', time: '13:10~13:30', content: '종례 및 인원 확인' },
  { label: '질의응답', time: '13:30~14:20', content: '질의응답 및 과목 상담' },
  { label: '3교시', time: '14:30~16:10', content: '선택 수업\n(또는 인강 & 자기주도학습)', classBlock: 'C' },
  { label: '4교시', time: '16:30~18:10', content: '선택 수업\n(또는 인강 & 자기주도학습)', classBlock: 'D' },
  { label: '저녁식사', time: '18:10~19:20', content: '저녁식사' },
  { label: '종례 B', time: '19:20~19:40', content: '종례 및 인원 확인' },
  { label: '야간 자기주도학습 1차', time: '19:40~21:20', content: '인강 & 자기주도학습\n(질의응답 & 1:1 담임 멘토링)' },
  { label: '야간 자기주도학습 2차', time: '21:40~22:40', content: '인강 & 자기주도학습\n(질의응답 & 1:1 담임 멘토링)' },
  { label: '', time: '22:50~23:30', content: '일과 종료 / 세면 / 점호' },
];

const students: PrototypeStudent[] = [
  { id: 'stu-1', name: '김민준', dob: '2007-03-18', cohortId: '2027-final-6', level: '종합 3등급', target: '국수영탐 균형 상승' },
  { id: 'stu-2', name: '이서연', dob: '2007-05-22', cohortId: '2027-final-6', level: '상위권', target: '수학 고난도 보강' },
  { id: 'stu-3', name: '박지호', dob: '2007-08-04', cohortId: '2027-final-6', level: '중위권', target: '개념 누수 점검' },
  { id: 'stu-4', name: '최예린', dob: '2007-07-08', cohortId: '2027-final-6', level: '최상위권', target: '실전 감각 유지' },
];

const courses: PrototypeCourse[] = [
  {
    id: 'kor-basic',
    code: 'KOR-101',
    subject: '국어',
    title: '독서 기본기 회복',
    instructor: '정하늘',
    level: '3-4등급',
    credits: 2,
    capacity: 24,
    enrolled: 17,
    meetings: [{ day: '월', block: 'A', time: '08:20-10:00' }, { day: '수', block: 'A', time: '08:20-10:00' }],
    summary: '지문 구조 읽기와 선지 판단 루틴을 반복합니다.',
  },
  {
    id: 'math-basic',
    code: 'MAT-201',
    subject: '수학',
    title: '수학 공통 개념 압축',
    instructor: '한도윤',
    level: '4등급 이하',
    credits: 2,
    capacity: 20,
    enrolled: 19,
    meetings: [{ day: '월', block: 'A', time: '08:20-10:00' }, { day: '목', block: 'A', time: '08:20-10:00' }],
    summary: '수1, 수2의 빈출 개념을 문제 풀이 흐름으로 정리합니다.',
  },
  {
    id: 'eng-reading',
    code: 'ENG-110',
    subject: '영어',
    title: '영어 빈칸과 순서',
    instructor: '오유진',
    level: '2-3등급',
    credits: 2,
    capacity: 28,
    enrolled: 21,
    meetings: [{ day: '화', block: 'B', time: '10:20-12:00' }, { day: '목', block: 'B', time: '10:20-12:00' }],
    summary: '논리 연결어와 문장 기능을 기준으로 고난도 유형을 풉니다.',
  },
  {
    id: 'math-advanced',
    code: 'MAT-330',
    subject: '수학',
    title: '미적분 실전 N제',
    instructor: '강서준',
    level: '1-2등급',
    credits: 2,
    capacity: 18,
    enrolled: 14,
    meetings: [{ day: '화', block: 'C', time: '14:30-16:10' }, { day: '금', block: 'C', time: '14:30-16:10' }],
    summary: '준킬러와 킬러 문항의 발상 전환을 훈련합니다.',
  },
  {
    id: 'science-life',
    code: 'SCI-210',
    subject: '과학탐구',
    title: '생명과학 도표 특강',
    instructor: '문채원',
    level: '전체',
    credits: 1,
    capacity: 30,
    enrolled: 23,
    meetings: [{ day: '수', block: 'D', time: '16:30-18:10' }],
    summary: '유전, 신경, 항상성 도표를 시간 안에 처리하는 강좌입니다.',
  },
  {
    id: 'social-culture',
    code: 'SOC-120',
    subject: '사회탐구',
    title: '사회문화 자료 분석',
    instructor: '서지윤',
    level: '전체',
    credits: 1,
    capacity: 30,
    enrolled: 18,
    meetings: [{ day: '목', block: 'D', time: '16:30-18:10' }],
    summary: '표, 그래프, 개념 비교 문항을 빠르게 분류하고 풉니다.',
  },
  {
    id: 'kor-literature',
    code: 'KOR-240',
    subject: '국어',
    title: '문학 선지 감각',
    instructor: '백소은',
    level: '전체',
    credits: 1,
    capacity: 26,
    enrolled: 16,
    meetings: [{ day: '금', block: 'B', time: '10:20-12:00' }],
    summary: '작품 암기가 아니라 표현과 정서의 판단 기준을 세웁니다.',
  },
];

const registrations: PrototypeRegistration[] = [
  { id: 'reg-1', studentId: 'stu-2', courseId: 'math-advanced', status: 'active', createdAt: '2026-05-01T09:00:00' },
  { id: 'reg-2', studentId: 'stu-2', courseId: 'eng-reading', status: 'active', createdAt: '2026-05-01T09:05:00' },
  { id: 'reg-3', studentId: 'stu-3', courseId: 'kor-basic', status: 'active', createdAt: '2026-05-01T10:00:00' },
];

export function createInitialPrototypeState(): PrototypeState {
  return {
    students: structuredClone(students),
    courses: structuredClone(courses),
    registrations: structuredClone(registrations),
    locked: false,
    deadline: '2026-05-30T23:59:00',
    correctionOpen: '2026-05-01T00:00:00',
    correctionClose: '2026-05-30T23:59:00',
    individualOpenings: [],
  };
}

export function hydratePrototypeState(savedState: PrototypeState): PrototypeState {
  const initial = createInitialPrototypeState();
  const savedCoursesById = new Map(savedState.courses.map((course) => [course.id, course]));
  const courses = initial.courses.map((currentCourse) => {
    const savedCourse = savedCoursesById.get(currentCourse.id);
    return savedCourse ? { ...savedCourse, subject: currentCourse.subject } : currentCourse;
  });

  return {
    ...initial,
    ...savedState,
    courses,
  };
}

export function authenticateDemoUser(identifier: string, secret: string): PrototypeSession | null {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    if (trimmed === 'admin@etoos247.kr' && secret === 'admin1234') {
      return { role: 'admin', id: 'admin-1', name: '관리자' };
    }
    if (trimmed === 'super@etoos247.kr' && secret === 'super1234') {
      return { role: 'super_admin', id: 'admin-2', name: '최고관리자' };
    }
    return null;
  }

  const student = students.find((item) => item.name === trimmed && toDob6(item.dob) === secret);
  return student ? { role: 'student', id: student.id, name: student.name } : null;
}

export async function authenticateUserWithSupabase(identifier: string, secret: string): Promise<PrototypeSession | null> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    // Admin login
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', trimmed)
      .single();

    if (error) {
      console.error('Admin auth error:', error);
      return null;
    }

    if (admin && admin.password === secret) {
      return { role: admin.role as PrototypeRole, id: admin.id, name: admin.name };
    }
    return null;
  }

  // Student login
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('name', trimmed)
    .single();

  if (error) {
    console.error('Student auth error:', error);
    return null;
  }

  if (student && toDob6(student.dob) === secret) {
    return { role: 'student', id: student.id, name: student.name };
  }
  return null;
}

export function canAccessPrototypeArea(role: PrototypeRole, area: PrototypeArea): boolean {
  if (area === 'student') return role === 'student';
  return role === 'admin' || role === 'super_admin';
}

export function canStudentModifySchedule(state: PrototypeState, now = new Date(), studentId?: string): boolean {
  if (state.locked) return false;
  const currentTime = now.getTime();
  const globallyOpen = currentTime >= new Date(state.correctionOpen).getTime() && currentTime <= new Date(state.correctionClose).getTime();
  if (globallyOpen) return true;
  if (!studentId) return false;

  return state.individualOpenings.some((opening) => {
    return (
      opening.studentId === studentId &&
      currentTime >= new Date(opening.open).getTime() &&
      currentTime <= new Date(opening.close).getTime()
    );
  });
}

export function updateCorrectionPeriod(state: PrototypeState, openDate: string, closeDate: string): PrototypeState {
  return {
    ...state,
    correctionOpen: `${openDate}T00:00:00`,
    correctionClose: `${closeDate}T23:59:00`,
  };
}

export function getActiveRegistrations(state: PrototypeState, studentId: string) {
  return state.registrations.filter((registration) => registration.studentId === studentId && registration.status === 'active');
}

export function getStudentCourses(state: PrototypeState, studentId: string) {
  const active = getActiveRegistrations(state, studentId);
  return active
    .map((registration) => state.courses.find((course) => course.id === registration.courseId))
    .filter((course): course is PrototypeCourse => Boolean(course));
}

export function getPersonalScheduleRows(state: PrototypeState, studentId: string): PersonalScheduleRow[] {
  const studentCourses = getStudentCourses(state, studentId);
  return dailyScheduleRows.map((row) => ({
    ...row,
    courses: row.classBlock
      ? studentCourses.filter((course) => course.meetings.some((meeting) => meeting.block === row.classBlock))
      : [],
  }));
}

export function getHeldPersonalScheduleRows(state: PrototypeState, studentId: string): PersonalScheduleRow[] {
  return getPersonalScheduleRows(state, studentId).filter((row) => row.courses.length > 0);
}

export function addRegistration(
  state: PrototypeState,
  studentId: string,
  courseId: string,
  now = new Date(),
): { ok: true; state: PrototypeState } | { ok: false; reason: string; state: PrototypeState } {
  if (!canStudentModifySchedule(state, now, studentId)) return { ok: false, reason: '수강정정기간이 아닙니다.', state };
  return addRegistrationWithoutPeriodCheck(state, studentId, courseId, now);
}

export function adminAddStudentClass(
  state: PrototypeState,
  studentId: string,
  courseId: string,
  now = new Date(),
): { ok: true; state: PrototypeState } | { ok: false; reason: string; state: PrototypeState } {
  return addRegistrationWithoutPeriodCheck(state, studentId, courseId, now);
}

function addRegistrationWithoutPeriodCheck(
  state: PrototypeState,
  studentId: string,
  courseId: string,
  now = new Date(),
): { ok: true; state: PrototypeState } | { ok: false; reason: string; state: PrototypeState } {
  if (state.locked) return { ok: false, reason: '수강신청이 잠겨 있습니다.', state };

  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return { ok: false, reason: '강좌를 찾을 수 없습니다.', state };

  const activeCourses = getStudentCourses(state, studentId);
  if (activeCourses.some((item) => item.id === courseId)) {
    return { ok: false, reason: '이미 신청한 강좌입니다.', state };
  }

  if (course.enrolled >= course.capacity) {
    return { ok: false, reason: '정원이 마감된 강좌입니다.', state };
  }

  const hasConflict = activeCourses.some((activeCourse) =>
    activeCourse.meetings.some((meeting) =>
      course.meetings.some((candidate) => candidate.day === meeting.day && candidate.block === meeting.block),
    ),
  );
  if (hasConflict) {
    return { ok: false, reason: '같은 시간대의 강좌가 이미 있습니다.', state };
  }

  const nextState = structuredClone(state);
  nextState.registrations.push({
    id: `reg-${Date.now()}-${courseId}`,
    studentId,
    courseId,
    status: 'active',
    createdAt: now.toISOString(),
  });
  const nextCourse = nextState.courses.find((item) => item.id === courseId);
  if (nextCourse) nextCourse.enrolled += 1;
  return { ok: true, state: nextState };
}

export function dropRegistration(state: PrototypeState, studentId: string, courseId: string, now = new Date()): PrototypeState {
  if (!canStudentModifySchedule(state, now, studentId)) return state;
  return dropRegistrationWithoutPeriodCheck(state, studentId, courseId);
}

export function adminDropStudentClass(state: PrototypeState, studentId: string, courseId: string, now = new Date()): PrototypeState {
  void now;
  return dropRegistrationWithoutPeriodCheck(state, studentId, courseId);
}

function dropRegistrationWithoutPeriodCheck(state: PrototypeState, studentId: string, courseId: string): PrototypeState {
  const nextState = structuredClone(state);
  const registration = nextState.registrations.find(
    (item) => item.studentId === studentId && item.courseId === courseId && item.status === 'active',
  );
  if (registration) {
    registration.status = 'dropped';
    const course = nextState.courses.find((item) => item.id === courseId);
    if (course) course.enrolled = Math.max(0, course.enrolled - 1);
  }
  return nextState;
}

export function calculateFee(state: PrototypeState, studentId: string): number {
  const count = getActiveRegistrations(state, studentId).length;
  if (count <= 1) return 0;
  if (count <= 3) return 100000;
  if (count <= 5) return 200000;
  return 300000;
}

export function calculateClassPick(classCount: number): 'Class A' | 'Class B' | 'Class C' | 'Class D' {
  if (classCount <= 3) return 'Class A';
  if (classCount <= 6) return 'Class B';
  if (classCount <= 9) return 'Class C';
  return 'Class D';
}

export function formatKrw(value: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
}

function toDob6(dob: string): string {
  const [year, month, day] = dob.split('-');
  return `${year.slice(2)}${month}${day}`;
}
