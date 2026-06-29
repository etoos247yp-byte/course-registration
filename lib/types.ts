export type Role = 'student' | 'admin' | 'super_admin' | 'teacher';

export type Subject = '국어' | '수학' | '영어' | '탐구';
export type SubKor = '독서' | '문학' | '화작' | '언매' | '실모' | '수1' | '수2' | '미적분' | string;
export type CourseType = '개념기출' | '유형테마' | 'N제실모';
export type LevelTag = '1-2등급' | '3등급' | '3-4등급' | '5등급 이하' | '전체' | string;
export type BlockId = 'A' | 'B' | 'C' | 'D';
export type DayKor = '월' | '화' | '수' | '목' | '금';

export type Meeting = { day: DayKor; block: BlockId };

export type Course = {
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
  classroom?: string;
};

export type Student = {
  id: string;
  name: string;
  dob: string;
  cohortId: string;
  diagnostic: Record<Subject, string>;
  electives: { 국어선택?: string; 수학선택?: string; 탐구1?: string; 탐구2?: string };
};

export type Cohort = {
  id: string;
  name: string;
  targetExamDate: string;
  seasons: { id: '1' | '2'; startDate: string; endDate: string }[];
  registrationOpen: string;
  registrationClose: string;
  modifyDeadline: string;
  manuallyLocked: boolean;
  pricingTiers: { id: 'A'|'B'|'C'|'D'; min: number; max: number; fee: number }[];
};

export type Registration = {
  id: string;
  studentId: string;
  courseId: string;
  cohortId: string;
  status: 'active' | 'dropped';
  createdAt: string;
  droppedAt?: string;
};

export type Extension = {
  id: string;
  studentId: string;
  cohortId: string;
  scope: 'add_only' | 'drop_only' | 'add_and_drop';
  courseId?: string;
  newDeadline: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorRole: Role;
  action: string;
  targetType: 'student'|'course'|'registration'|'cohort'|'extension'|'pricing'|'lock'|'notification'|'admin';
  targetId: string;
  diff?: { before?: unknown; after?: unknown };
};

export type SyllabusEntry = { week: number; date: string; topic: string; special?: 'exam'|'break'; season?: 1|2 };

export type AdminAccount = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'teacher';
  cohortId?: string;
  passwordHash: string;
  lastLoginAt?: string;
};
