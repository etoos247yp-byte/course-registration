import { describe, expect, test } from 'vitest';
import {
  addRegistration,
  adminAddStudentClass,
  adminDropStudentClass,
  authenticateDemoUser,
  canStudentModifySchedule,
  canAccessPrototypeArea,
  calculateClassPick,
  calculateFee,
  createInitialPrototypeState,
  dailyScheduleRows,
  getActiveRegistrations,
  getHeldPersonalScheduleRows,
  getPersonalScheduleRows,
  hydratePrototypeState,
  prototypeSubjects,
  updateCorrectionPeriod,
} from '@/lib/prototype-data';

describe('prototype data layer', () => {
  test('authenticates the seeded student and admin demo users', () => {
    const student = authenticateDemoUser('김민준', '070318');
    const admin = authenticateDemoUser('admin@etoos247.kr', 'admin1234');

    expect(student).toMatchObject({ role: 'student', name: '김민준' });
    expect(admin).toMatchObject({ role: 'admin', name: '관리자' });
  });

  test('prevents duplicate and conflicting course registrations', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'kor-basic');
    const duplicate = addRegistration(first.state, 'stu-1', 'kor-basic');
    const conflict = addRegistration(first.state, 'stu-1', 'math-basic');

    expect(first.ok).toBe(true);
    expect(duplicate).toMatchObject({ ok: false, reason: '이미 신청한 강좌입니다.' });
    expect(conflict).toMatchObject({ ok: false, reason: '같은 시간대의 강좌가 이미 있습니다.' });
  });

  test('allows schedule changes only during the correction period', () => {
    const state = createInitialPrototypeState();

    expect(canStudentModifySchedule(state, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(true);
    expect(canStudentModifySchedule(state, new Date('2026-06-01T12:00:00'), 'stu-1')).toBe(false);
    expect(canStudentModifySchedule({ ...state, locked: true }, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(false);

    const closedAttempt = addRegistration(state, 'stu-1', 'kor-basic', new Date('2026-06-01T12:00:00'));
    expect(closedAttempt).toMatchObject({ ok: false, reason: '수강정정기간이 아닙니다.' });
  });

  test('individual opening lets a selected new student auto approve outside the global period', () => {
    const state = {
      ...createInitialPrototypeState(),
      individualOpenings: [
        {
          studentId: 'stu-1',
          open: '2026-06-01T00:00:00',
          close: '2026-06-07T23:59:00',
          reason: '신규 입소생',
        },
      ],
    };
    const now = new Date('2026-06-03T12:00:00');

    expect(canStudentModifySchedule(state, now, 'stu-1')).toBe(true);
    expect(canStudentModifySchedule(state, now, 'stu-2')).toBe(false);

    const result = addRegistration(state, 'stu-1', 'kor-basic', now);
    expect(result.ok).toBe(true);
    expect(result.state.registrations.find((registration) => registration.studentId === 'stu-1')?.status).toBe('active');
  });

  test('admin can update the global correction period dates', () => {
    const state = createInitialPrototypeState();
    const updated = updateCorrectionPeriod(state, '2026-06-01', '2026-06-10');

    expect(updated.correctionOpen).toBe('2026-06-01T00:00:00');
    expect(updated.correctionClose).toBe('2026-06-10T23:59:00');
    expect(canStudentModifySchedule(updated, new Date('2026-06-05T12:00:00'), 'stu-1')).toBe(true);
    expect(canStudentModifySchedule(updated, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(false);
  });

  test('admin can add and drop student classes outside student opening dates', () => {
    const closedState = updateCorrectionPeriod(createInitialPrototypeState(), '2026-06-01', '2026-06-10');
    const now = new Date('2026-05-21T12:00:00');

    const studentAttempt = addRegistration(closedState, 'stu-1', 'kor-basic', now);
    const adminAttempt = adminAddStudentClass(closedState, 'stu-1', 'kor-basic', now);
    const afterDrop = adminAttempt.ok ? adminDropStudentClass(adminAttempt.state, 'stu-1', 'kor-basic', now) : closedState;

    expect(studentAttempt.ok).toBe(false);
    expect(adminAttempt.ok).toBe(true);
    expect(getActiveRegistrations(adminAttempt.state, 'stu-1')).toHaveLength(1);
    expect(getActiveRegistrations(afterDrop, 'stu-1')).toHaveLength(0);
  });

  test('calculates tuition from active registrations', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'kor-basic');
    const second = addRegistration(first.state, 'stu-1', 'eng-reading');

    expect(calculateFee(second.state, 'stu-1')).toBe(100000);
  });

  test('calculates class pick tier from active registration count', () => {
    expect(calculateClassPick(0)).toBe('Class A');
    expect(calculateClassPick(3)).toBe('Class A');
    expect(calculateClassPick(4)).toBe('Class B');
    expect(calculateClassPick(6)).toBe('Class B');
    expect(calculateClassPick(7)).toBe('Class C');
    expect(calculateClassPick(9)).toBe('Class C');
    expect(calculateClassPick(10)).toBe('Class D');
  });

  test('cart summary uses class count and class pick only', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'kor-basic');
    const second = addRegistration(first.state, 'stu-1', 'eng-reading');
    const classCount = second.state.registrations.filter((registration) => registration.studentId === 'stu-1' && registration.status === 'active').length;

    expect(classCount).toBe(2);
    expect(calculateClassPick(classCount)).toBe('Class A');
  });

  test('blocks students from admin prototype areas', () => {
    expect(canAccessPrototypeArea('student', 'admin')).toBe(false);
    expect(canAccessPrototypeArea('student', 'student')).toBe(true);
    expect(canAccessPrototypeArea('admin', 'admin')).toBe(true);
    expect(canAccessPrototypeArea('super_admin', 'admin')).toBe(true);
  });

  test('separates exploration subjects into social studies and science studies', () => {
    expect(prototypeSubjects).toContain('사회탐구');
    expect(prototypeSubjects).toContain('과학탐구');
    expect(prototypeSubjects).not.toContain('탐구');
  });

  test('hydrates older saved prototype state with current exploration subjects', () => {
    const legacy = createInitialPrototypeState();
    legacy.courses = legacy.courses.filter((course) => course.id !== 'social-culture');
    legacy.courses.find((course) => course.id === 'science-life')!.subject = '탐구' as never;

    const hydrated = hydratePrototypeState(legacy);

    expect(hydrated.courses.find((course) => course.id === 'science-life')?.subject).toBe('과학탐구');
    expect(hydrated.courses.find((course) => course.id === 'social-culture')?.subject).toBe('사회탐구');
  });
  test('provides the academy daily schedule structure', () => {
    expect(dailyScheduleRows.map((row) => row.time)).toContain('08:20~10:00');
    expect(dailyScheduleRows.map((row) => row.time)).toContain('16:30~18:10');
    expect(dailyScheduleRows.at(-1)).toMatchObject({ time: '22:50~23:30' });
    expect(dailyScheduleRows.filter((row) => row.classBlock).map((row) => row.classBlock)).toEqual(['A', 'B', 'C', 'D']);
  });

  test('builds personal schedule rows from the student selected classes', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'kor-basic');
    const second = addRegistration(first.state, 'stu-1', 'eng-reading');

    const rows = getPersonalScheduleRows(second.state, 'stu-1');
    const firstPeriod = rows.find((row) => row.classBlock === 'A');
    const secondPeriod = rows.find((row) => row.classBlock === 'B');
    const fourthPeriod = rows.find((row) => row.classBlock === 'D');

    expect(firstPeriod?.courses.map((course) => course.title)).toContain('독서 기본기 회복');
    expect(secondPeriod?.courses.map((course) => course.title)).toContain('영어 빈칸과 순서');
    expect(fourthPeriod?.courses).toEqual([]);
  });

  test('filters personal schedule to only rows with selected classes', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'kor-basic');
    const second = addRegistration(first.state, 'stu-1', 'eng-reading');

    const rows = getHeldPersonalScheduleRows(second.state, 'stu-1');

    expect(rows.map((row) => row.time)).toEqual(['08:20~10:00', '10:20~12:00']);
    expect(rows.every((row) => row.courses.length > 0)).toBe(true);
  });
});
