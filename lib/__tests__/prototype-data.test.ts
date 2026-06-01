import { describe, expect, test } from 'vitest';
import {
  addRegistration,
  adminAddStudentClass,
  adminDropStudentClass,
  authenticateDemoUser,
  authenticateUserWithSupabase,
  canStudentModifySchedule,
  canAccessPrototypeArea,
  calculateClassPick,
  calculateFee,
  createInitialPrototypeState,
  dailyScheduleRows,
  getActiveRegistrations,
  getCourseSubmission,
  getConfirmedClassPick,
  getHeldPersonalScheduleRows,
  getPersonalScheduleRows,
  getEffectiveClassPick,
  confirmStudentRegistration,
  autoConfirmStudentRegistration,
  acknowledgeAutoConfirmation,
  approveChangeRequest,
  rejectChangeRequest,
  submitChangeRequest,
  submitStudentCourseSelection,
  hydratePrototypeState,
  prototypeSubjects,
} from '@/lib/prototype-data';

describe('prototype data layer', () => {
  test('authenticates the seeded student and admin demo users', () => {
    const student = authenticateDemoUser('김민준', '070318');
    const admin = authenticateDemoUser('admin@etoos247.kr', 'admin1234');

    expect(student).toMatchObject({ role: 'student', name: '김민준' });
    expect(admin).toMatchObject({ role: 'admin', name: '관리자' });
  });

  test('uses demo auth when Supabase environment variables are missing', async () => {
    const demoStudent = createInitialPrototypeState().students[0];
    const student = await authenticateUserWithSupabase(demoStudent.name, '070318');

    expect(student).toMatchObject({ role: 'student', id: demoStudent.id, name: demoStudent.name });
  });

  test('prevents duplicate and conflicting course registrations', () => {
    const state = createInitialPrototypeState();
    // Force math-basic to conflict with kor-basic (월 A) for this test
    const mathBasic = state.courses.find((c) => c.id === 'math-basic')!;
    mathBasic.meetings = [
      { day: '월', block: 'A', time: '08:20-10:00' },
      { day: '목', block: 'A', time: '08:20-10:00' },
    ];

    const first = addRegistration(state, 'stu-2', 'kor-basic');
    const duplicate = addRegistration(first.state, 'stu-2', 'kor-basic');
    const conflict = addRegistration(first.state, 'stu-2', 'math-basic');

    expect(first.ok).toBe(true);
    expect(duplicate).toMatchObject({ ok: false, reason: '이미 신청한 강좌입니다.' });
    expect(conflict).toMatchObject({ ok: false, reason: '같은 시간대의 강좌가 이미 있습니다.' });
  });

  test('allows schedule changes before registration close, blocks after', () => {
    const state = createInitialPrototypeState();

    expect(canStudentModifySchedule(state, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(true);
    expect(canStudentModifySchedule({ ...state, locked: true }, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(false);

    const pastClose = { ...state, registrationClose: '2000-01-01T00:00:00' };
    expect(canStudentModifySchedule(pastClose, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(false);
    const closedAttempt = addRegistration(pastClose, 'stu-1', 'kor-basic', new Date('2026-05-21T12:00:00'));
    expect(closedAttempt).toMatchObject({ ok: false, reason: '수강정정기간이 아닙니다.' });
  });

  test('individual opening lets a selected new student auto approve outside the global period', () => {
    const state = {
      ...createInitialPrototypeState(),
      registrationClose: '2000-01-01T00:00:00',
      individualOpenings: [
        {
          studentId: 'stu-1',
          open: '2026-06-10T00:00:00',
          close: '2026-06-17T23:59:00',
          reason: '신규 입소생',
        },
      ],
    };
    const now = new Date('2026-06-12T12:00:00');

    expect(canStudentModifySchedule(state, now, 'stu-1')).toBe(true);
    expect(canStudentModifySchedule(state, now, 'stu-2')).toBe(false);

    const result = addRegistration(state, 'stu-1', 'kor-literature', now);
    expect(result.ok).toBe(true);
    expect(result.state.registrations.find((registration) => registration.studentId === 'stu-1')?.status).toBe('active');
  });

  test('admin can override the registration close date', () => {
    const state = { ...createInitialPrototypeState(), registrationClose: '2026-06-01T00:00:00' };

    expect(canStudentModifySchedule(state, new Date('2026-06-05T12:00:00'), 'stu-1')).toBe(false);
    expect(canStudentModifySchedule(state, new Date('2026-05-21T12:00:00'), 'stu-1')).toBe(true);
  });

  test('admin can add and drop student classes outside student opening dates', () => {
    const closedState = { ...createInitialPrototypeState(), registrationClose: '2026-05-20T00:00:00' };
    const now = new Date('2026-05-21T12:00:00');

    const studentAttempt = addRegistration(closedState, 'stu-1', 'kor-basic', now);
    const adminAttempt = adminAddStudentClass(closedState, 'stu-1', 'social-culture', now);
    const afterDrop = adminAttempt.ok ? adminDropStudentClass(adminAttempt.state, 'stu-1', 'social-culture', now) : closedState;

    expect(studentAttempt.ok).toBe(false);
    expect(adminAttempt.ok).toBe(true);
    expect(getActiveRegistrations(adminAttempt.state, 'stu-1')).toHaveLength(5);
    expect(getActiveRegistrations(afterDrop, 'stu-1')).toHaveLength(4);
  });

  test('calculates tuition from active registrations', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'math-advanced');
    const second = addRegistration(first.state, 'stu-1', 'social-culture');

    expect(calculateFee(second.state, 'stu-1')).toBe(300000);
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

  test('keeps confirmed class pick as a downgrade floor while allowing upgrades', () => {
    const state = createInitialPrototypeState();
    const confirmed = confirmStudentRegistration(state, 'stu-4', new Date('2026-05-21T12:00:00Z'));
    const droppedOne = adminDropStudentClass(confirmed, 'stu-4', 'math-advanced');
    const droppedTwo = adminDropStudentClass(droppedOne, 'stu-4', 'eng-reading');
    const upgradeCandidate = {
      ...state.courses[0],
      id: 'extra-upgrade',
      code: 'EXT-701',
      title: '추가 심화 특강',
      capacity: 20,
      enrolled: 0,
      meetings: [],
    };
    const upgraded = adminAddStudentClass(
      { ...confirmed, courses: [...confirmed.courses, upgradeCandidate] },
      'stu-4',
      'extra-upgrade',
    );

    expect(getEffectiveClassPick(confirmed, 'stu-4')).toBe('Class B');
    expect(getEffectiveClassPick(droppedTwo, 'stu-4')).toBe('Class B');
    expect(upgraded.ok).toBe(true);
    expect(getEffectiveClassPick(upgraded.state, 'stu-4')).toBe('Class C');
  });

  test('auto-confirms after correction period and tracks warning acknowledgement', () => {
    const state = { ...createInitialPrototypeState(), registrationClose: '2026-05-10T23:59:00' };
    const beforeClose = autoConfirmStudentRegistration(state, 'stu-1', new Date('2026-05-10T12:00:00Z'));
    const afterClose = autoConfirmStudentRegistration(state, 'stu-1', new Date('2026-05-11T00:00:00Z'));
    const acknowledged = acknowledgeAutoConfirmation(afterClose, 'stu-1', new Date('2026-05-11T00:05:00Z'));

    expect(beforeClose).toBe(state);
    expect(afterClose.confirmedClassPicks[0]).toMatchObject({
      studentId: 'stu-1',
      seasonId: 'season-3',
      classPick: 'Class B',
      source: 'auto',
      warningAcknowledgedAt: undefined,
    });
    expect(acknowledged.confirmedClassPicks[0].warningAcknowledgedAt).toBe('2026-05-11T00:05:00.000Z');
  });

  test('locks selected classes after course submission before final confirmation', () => {
    const state = createInitialPrototypeState();
    const submitted = submitStudentCourseSelection(state, 'stu-1', new Date('2026-05-10T12:00:00Z'));
    const dropRequest = submitChangeRequest(submitted, 'stu-1', 'drop', 'kor-basic', new Date('2026-05-10T12:01:00Z'));

    expect(getCourseSubmission(submitted, 'stu-1')).toMatchObject({
      studentId: 'stu-1',
      seasonId: 'season-3',
      submittedAt: '2026-05-10T12:00:00.000Z',
    });
    expect(getConfirmedClassPick(submitted, 'stu-1')).toBeUndefined();
    expect(dropRequest.ok).toBe(true);
    expect(dropRequest.state.changeRequests[0]).toMatchObject({
      studentId: 'stu-1',
      courseId: 'kor-basic',
      type: 'drop',
      status: 'pending',
    });
    expect(getActiveRegistrations(dropRequest.state, 'stu-1').map((registration) => registration.courseId)).toContain('kor-basic');
  });

  test('submits and approves confirmed-student add and drop change requests', () => {
    const state = confirmStudentRegistration(createInitialPrototypeState(), 'stu-1', new Date('2026-05-21T12:00:00Z'));
    const addRequest = submitChangeRequest(state, 'stu-1', 'add', 'math-advanced', new Date('2026-05-21T12:01:00Z'));
    const approvedAdd = addRequest.ok ? approveChangeRequest(addRequest.state, addRequest.requestId, new Date('2026-05-21T12:02:00Z')) : addRequest;
    const dropRequest = approvedAdd.ok ? submitChangeRequest(approvedAdd.state, 'stu-1', 'drop', 'kor-basic', new Date('2026-05-21T12:03:00Z')) : approvedAdd;
    const approvedDrop = dropRequest.ok ? approveChangeRequest(dropRequest.state, dropRequest.requestId, new Date('2026-05-21T12:04:00Z')) : dropRequest;

    expect(addRequest.ok).toBe(true);
    expect(approvedAdd.ok).toBe(true);
    expect(getActiveRegistrations(approvedAdd.state, 'stu-1').map((r) => r.courseId)).toContain('math-advanced');
    expect(dropRequest.ok).toBe(true);
    expect(approvedDrop.ok).toBe(true);
    expect(getActiveRegistrations(approvedDrop.state, 'stu-1').map((r) => r.courseId)).not.toContain('kor-basic');
    expect(approvedDrop.state.changeRequests.map((request) => request.status)).toEqual(['approved', 'approved']);
    expect(getEffectiveClassPick(approvedDrop.state, 'stu-1')).toBe('Class B');
  });

  test('rejects pending change requests without changing active classes', () => {
    const state = confirmStudentRegistration(createInitialPrototypeState(), 'stu-1', new Date('2026-05-21T12:00:00Z'));
    const requested = submitChangeRequest(state, 'stu-1', 'drop', 'kor-basic', new Date('2026-05-21T12:01:00Z'));
    const rejected = requested.ok ? rejectChangeRequest(requested.state, requested.requestId, new Date('2026-05-21T12:02:00Z')) : requested;

    expect(requested.ok).toBe(true);
    expect(rejected.ok).toBe(true);
    expect(getActiveRegistrations(rejected.state, 'stu-1').map((r) => r.courseId)).toContain('kor-basic');
    expect(rejected.state.changeRequests[0]).toMatchObject({ status: 'rejected' });
  });

  test('cart summary uses class count and class pick only', () => {
    const state = createInitialPrototypeState();
    const first = addRegistration(state, 'stu-1', 'math-advanced');
    const second = addRegistration(first.state, 'stu-1', 'social-culture');
    const classCount = second.state.registrations.filter((registration) => registration.studentId === 'stu-1' && registration.status === 'active').length;

    expect(classCount).toBe(6);
    expect(calculateClassPick(classCount)).toBe('Class B');
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

    const rows = getPersonalScheduleRows(state, 'stu-1');
    const firstPeriod = rows.find((row) => row.classBlock === 'A');
    const secondPeriod = rows.find((row) => row.classBlock === 'B');
    const fourthPeriod = rows.find((row) => row.classBlock === 'D');

    expect(firstPeriod?.courses.map((course) => course.title)).toContain('독서 기본기 회복');
    expect(secondPeriod?.courses.map((course) => course.title)).toContain('영어 빈칸과 순서');
    expect(fourthPeriod?.courses.map((course) => course.title)).toContain('생명과학 도표 특강');
  });

  test('filters personal schedule to only rows with selected classes', () => {
    const state = createInitialPrototypeState();
    const rows = getHeldPersonalScheduleRows(state, 'stu-1');

    expect(rows.map((row) => row.time)).toEqual(['08:20~10:00', '10:20~12:00', '16:30~18:10']);
    expect(rows.every((row) => row.courses.length > 0)).toBe(true);
  });
});
