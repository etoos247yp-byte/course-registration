import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PrototypeApp } from '../PrototypeApp';
import { createInitialPrototypeState } from '@/lib/prototype-data';

const routerPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

// Mock window.localStorage with proper type
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('PrototypeApp', () => {
  beforeEach(() => {
    localStorageMock.removeItem('course-registration-prototype-state');
    localStorageMock.removeItem('course-registration-prototype-session');
    routerPush.mockClear();
  });

  test('uses local demo data without querying Supabase when env variables are missing', () => {
    render(<PrototypeApp view="login" />);
    expect(screen.getByText('ETOOS 247 이천기숙학원')).toBeInTheDocument();
  });

  test('shows readable Korean confirmation after adding a course in local demo mode', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );
    render(<PrototypeApp view="catalog" />);

    const addButtons = await screen.findAllByRole('button', { name: '담기' });
    await userEvent.click(addButtons[0]);

    expect(await screen.findByText('강좌를 신청했습니다.')).toBeInTheDocument();
  });

  test('shows the requested catalog header without helper text', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );
    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByRole('heading', { name: /수강 신청/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '강좌 탐색' })).not.toBeInTheDocument();
    expect(screen.queryByText('시간 충돌과 정원 상태를 보면서 수강할 강좌를 담으세요.')).not.toBeInTheDocument();
  });

  test('only allows canceling selected classes from the right summary', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByRole('heading', { name: /수강 신청/ })).toBeInTheDocument();
    const selectedCardStatuses = screen.getAllByRole('button', { name: '수강 중' });
    selectedCardStatuses.forEach((button) => expect(button).toBeDisabled());

    const cancelButtons = screen.getAllByRole('button', { name: '수강취소' });
    expect(cancelButtons).toHaveLength(4);
    await userEvent.click(cancelButtons[0]);

    expect(await screen.findByText('강좌 신청을 취소했습니다.')).toBeInTheDocument();
  });

  test('dashboard is a read-only status page with timetable preview', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="dashboard" />);

    expect((await screen.findAllByText('독서 기본기 회복')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: '내 시간표' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '변경 신청' })).not.toBeInTheDocument();
  });

  test('shows selected classes in a weekly student calendar', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="dashboard" />);

    for (const day of ['월', '화', '수', '목', '금']) {
      expect(await screen.findByRole('columnheader', { name: day })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: '평일' })).not.toBeInTheDocument();
    expect(screen.getAllByText('독서 기본기 회복').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('영어 빈칸과 순서').length).toBeGreaterThanOrEqual(2);
  });

  test('includes timetable rows through 4교시 only', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="dashboard" />);

    expect(await screen.findByText('아침식사')).toBeInTheDocument();
    expect(screen.getAllByText('점심식사').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4교시')).toBeInTheDocument();
    expect(screen.queryByText('저녁식사')).not.toBeInTheDocument();
    expect(screen.queryByText('종례 B')).not.toBeInTheDocument();
    expect(screen.queryByText('야간 자기주도학습 1차')).not.toBeInTheDocument();
    expect(screen.queryByText('야간 자기주도학습 2차')).not.toBeInTheDocument();
    expect(screen.getAllByText('휴식').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByTestId('schedule-table-frame')).toHaveClass('max-h-[calc(100vh-12rem)]', 'overflow-auto');
    expect(screen.getByText('아침식사').closest('tr')).toHaveClass('bg-gray-50');
    expect(screen.getAllByText('점심식사')[0].closest('tr')).toHaveClass('bg-gray-50');
  });

  test('combined course registration page separates course submission from final confirmation', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByRole('heading', { name: /수강 신청/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '신청 요약' })).toBeInTheDocument();
    expect(screen.getByText('Class B')).toBeInTheDocument();

    const submitCourseBtn = screen.getByRole('button', { name: '수강신청하기' });
    await userEvent.click(submitCourseBtn);

    expect(await screen.findByText('수강신청 확인')).toBeInTheDocument();
    expect(screen.getByText(/선택하신/)).toBeInTheDocument();
    expect(screen.getByText(/로 수강신청을 진행합니다/)).toBeInTheDocument();
    expect(screen.getByText('수강신청 후 변경 안내')).toBeInTheDocument();
    expect(screen.getByText(/현재 선택한 강좌가 신청 완료 상태로 고정됩니다/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '수강신청 완료' }));

    expect(await screen.findByText('수강신청이 완료되었습니다. 이후 변경은 관리자 승인 후 반영됩니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수강신청 완료' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '신청확정하기' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: '신청확정하기' }));

    expect(await screen.findByText('신청확정 확인')).toBeInTheDocument();
    expect(screen.getByText(/신청을 최종 확정합니다/)).toBeInTheDocument();
    expect(screen.getAllByText('Class B')[0]).toBeInTheDocument();
    expect(screen.getByText(/4~6개 강의/)).toBeInTheDocument();
    expect(screen.getByText('확정 전 필수 확인')).toBeInTheDocument();
    expect(screen.getByText(/클래스픽은 고정되며 더 낮은 클래스픽으로 변경할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByText(/환불은 제공되지 않습니다/)).toBeInTheDocument();
    expect(screen.queryByText('결제 안내 [추후 확정]')).not.toBeInTheDocument();

    const modalConfirmBtn = screen.getByRole('button', { name: '확인하고 신청확정' });
    await userEvent.click(modalConfirmBtn);

    expect(await screen.findByText('수강신청이 확정되었습니다.')).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '수강신청 완료' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '신청확정 완료' })).toBeDisabled();
    expect(screen.getByText(/현재 시즌의 클래스픽은 Class B 이상으로 유지됩니다/)).toBeInTheDocument();
  });

  test('shows auto-confirmation warning modal after correction period closes', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = { ...createInitialPrototypeState(), registrationClose: '2000-01-01T00:00:00' };
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByText('수강신청 자동 확정 안내')).toBeInTheDocument();
    expect(screen.getByText(/정정기간이 종료되어 현재 담긴 강좌로 수강신청이 자동 확정되었습니다/)).toBeInTheDocument();
    expect(screen.getByText(/더 낮은 클래스픽으로 변경할 수 없습니다/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '확인했습니다' }));

    expect(screen.queryByText('수강신청 자동 확정 안내')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수강신청 완료' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '신청확정 완료' })).toBeDisabled();
  });

  test('left-hand side course card button turns to 승인 대기 when course is pending drop', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    // Simulate that the student has submitted their course selection (so hasLockedCourseSelection is true)
    state.courseSubmissions.push({
      studentId: 'stu-1',
      seasonId: state.currentSeason,
      submittedAt: new Date().toISOString(),
    });
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByRole('heading', { name: /수강 신청/ })).toBeInTheDocument();
    
    // The course "독서 기본기 회복" should initially be '수강 중'
    const leftCardButton = screen.getAllByRole('button', { name: '수강 중' })[0];
    expect(leftCardButton).toBeDisabled();

    // Now click '수강취소' on the right summary panel
    const cancelButtons = screen.getAllByRole('button', { name: '수강취소' });
    await userEvent.click(cancelButtons[0]);

    // Confirm cancel in the modal
    const confirmCancelBtn = screen.getAllByRole('button', { name: '수강취소' }).at(-1)!;
    await userEvent.click(confirmCancelBtn);

    // Verify right-side button turns into '승인 대기'
    expect(await screen.findByText('강의 변경 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.')).toBeInTheDocument();
    
    // Verify that the left-hand side card's button has now turned to '승인 대기'
    const updatedLeftButtons = screen.getAllByRole('button', { name: '승인 대기' });
    // There should be at least one on the left card and one in the right summary card
    expect(updatedLeftButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('adds a course with admin approval if student has submitted but not confirmed yet', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'student', id: 'stu-1', name: '김민준' }),
    );

    const state = createInitialPrototypeState();
    // Student has completed 수강신청 완료 (isSubmitted is true)
    state.courseSubmissions.push({
      studentId: 'stu-1',
      seasonId: state.currentSeason,
      submittedAt: new Date().toISOString(),
    });
    // Let's drop "영어 빈칸과 순서" (id: eng-reading) to free up some space
    state.registrations = state.registrations.filter((r) => r.courseId !== 'eng-reading');
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="catalog" />);

    expect(await screen.findByRole('heading', { name: /수강 신청/ })).toBeInTheDocument();
    
    const engReadingCard = screen.getByText('영어 빈칸과 순서').closest('article')!;
    const addButton = within(engReadingCard).getByRole('button', { name: '수강신청' });
    
    await userEvent.click(addButton);

    // Verify it is NOT automatically added, but instead goes to change request
    expect(await screen.findByText('강의 변경 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.')).toBeInTheDocument();

    // Verify that the left-hand side card's button has turned to '승인 대기'
    expect(within(engReadingCard).getByRole('button', { name: '승인 대기' })).toBeInTheDocument();
  });

  test('allows admin to reset the demo data', async () => {
    window.localStorage.setItem(
      'course-registration-prototype-session',
      JSON.stringify({ role: 'admin', id: 'admin-1', name: '관리자' }),
    );

    const state = createInitialPrototypeState();
    // Modify the state significantly so we can verify if it gets reset
    state.locked = true;
    state.currentSeason = 'season-4';
    window.localStorage.setItem('course-registration-prototype-state', JSON.stringify(state));

    render(<PrototypeApp view="admin" />);

    expect(await screen.findByRole('heading', { name: '관리자 콘솔' })).toBeInTheDocument();
    expect(screen.getByText('수강신청 잠김')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: '데모 데이터 초기화' });
    await userEvent.click(resetBtn);

    // It should display a message confirming reset
    expect(await screen.findByText('데모 데이터가 초기화되었습니다.')).toBeInTheDocument();
    
    // Check that the state is restored to initial defaults
    expect(screen.getByText('수강신청 가능')).toBeInTheDocument();
  });
});
