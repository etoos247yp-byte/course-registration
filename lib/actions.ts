'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSession, createSessionToken, setSession, clearSession } from './auth-util';
import { authenticateUserWithSupabase, type PrototypeStudent } from './prototype-data';

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  mock?: boolean;
};

/**
 * Reusable utility to verify that the active session is a valid administrator
 * and matches the provided adminId.
 */
async function verifyAdminAuth(adminId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error('인증에 실패했습니다. 로그인이 필요합니다.');
  }
  
  if (session.role !== 'admin' && session.role !== 'super_admin') {
    throw new Error('권한이 없습니다. 관리자만 수행할 수 있습니다.');
  }
  
  if (session.userId !== adminId) {
    throw new Error('요청한 관리자 정보가 세션과 일치하지 않습니다.');
  }
  
  return session;
}

/**
 * Admin Action: Add a class to a student's schedule.
 */
export async function adminAddStudentClassAction(
  adminId: string,
  studentId: string,
  courseId: string
): Promise<ActionResponse> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} adding course ${courseId} to student ${studentId}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 강좌가 성공적으로 추가되었습니다 (Mock).',
      };
    }

    // 3. Check if registration already exists actively
    const { data: existing, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (checkError) {
      return { success: false, error: `수강 조회 실패: ${checkError.message}` };
    }

    if (existing && existing.length > 0) {
      return { success: false, error: '이미 해당 학생이 수강 중인 강좌입니다.' };
    }

    // 4. Retrieve course and check capacity constraints
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('capacity, enrolled')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return { success: false, error: '해당 강좌를 찾을 수 없습니다.' };
    }

    if (course.enrolled >= course.capacity) {
      return { success: false, error: '정원이 초과된 강좌는 추가할 수 없습니다.' };
    }

    // 5. Insert new active registration
    const { error: insertError } = await supabase
      .from('registrations')
      .insert({
        id: `reg-${Date.now()}-${courseId}`,
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      return { success: false, error: `수강 추가 실패: ${insertError.message}` };
    }

    return { success: true, message: '학생의 수강 강좌가 성공적으로 추가되었습니다.' };
  } catch (error: any) {
    console.error('adminAddStudentClassAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Admin Action: Drop a class from a student's schedule.
 */
export async function adminDropStudentClassAction(
  adminId: string,
  studentId: string,
  courseId: string
): Promise<ActionResponse> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} dropping course ${courseId} from student ${studentId}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 강좌가 성공적으로 제외되었습니다 (Mock).',
      };
    }

    // 3. Update the active registration status to 'dropped'
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (updateError) {
      return { success: false, error: `수강 제외 실패: ${updateError.message}` };
    }

    return { success: true, message: '학생의 수강 강좌가 성공적으로 제외되었습니다.' };
  } catch (error: any) {
    console.error('adminDropStudentClassAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Admin Action: Approve a student's course change request (add or drop).
 */
export async function approveChangeRequestAction(
  adminId: string,
  requestId: string
): Promise<ActionResponse> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} approving request ${requestId}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 변경 신청이 성공적으로 승인되었습니다 (Mock).',
      };
    }

    // 3. Retrieve change request from database
    const { data: request, error: fetchError } = await supabase
      .from('change_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: '해당 변경 신청 건을 찾을 수 없습니다.' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: '이미 처리 완료된 변경 신청 건입니다.' };
    }

    // 4. Perform the registration mutation based on request type
    if (request.type === 'add') {
      const addResult = await adminAddStudentClassAction(adminId, request.student_id, request.course_id);
      if (!addResult.success) {
        return { success: false, error: `승인 처리 중 오류: ${addResult.error}` };
      }
    } else if (request.type === 'drop') {
      const dropResult = await adminDropStudentClassAction(adminId, request.student_id, request.course_id);
      if (!dropResult.success) {
        return { success: false, error: `승인 처리 중 오류: ${dropResult.error}` };
      }
    } else {
      return { success: false, error: '지원하지 않는 변경 유형입니다.' };
    }

    // 5. Mark the request as approved
    const { error: updateError } = await supabase
      .from('change_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      return { success: false, error: `신청 상태 업데이트 실패: ${updateError.message}` };
    }

    return { success: true, message: '변경 신청이 성공적으로 승인 및 적용되었습니다.' };
  } catch (error: any) {
    console.error('approveChangeRequestAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Admin Action: Reject a student's course change request.
 */
export async function rejectChangeRequestAction(
  adminId: string,
  requestId: string
): Promise<ActionResponse> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} rejecting request ${requestId}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 변경 신청이 반려되었습니다 (Mock).',
      };
    }

    // 3. Mark the request as rejected
    const { error: updateError } = await supabase
      .from('change_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (updateError) {
      return { success: false, error: `신청 반려 실패: ${updateError.message}` };
    }

    return { success: true, message: '변경 신청이 성공적으로 반려되었습니다.' };
  } catch (error: any) {
    console.error('rejectChangeRequestAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Admin Action: Add a new student to the database.
 */
export async function adminAddStudentAction(
  adminId: string,
  student: Omit<PrototypeStudent, 'id'>
): Promise<ActionResponse & { student?: PrototypeStudent }> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    const studentId = 'stu-gen-' + Math.floor(100000 + Math.random() * 900000);
    const fullStudent: PrototypeStudent = {
      ...student,
      id: studentId,
    };

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} adding student ${student.name}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 학생이 등록되었습니다 (Mock).',
        student: fullStudent,
      };
    }

    // 3. Insert student record into Supabase
    const { error: insertError } = await supabase
      .from('students')
      .insert({
        id: studentId,
        name: student.name,
        dob: student.dob,
        cohort_id: student.cohortId,
        school: student.school,
        level: student.level,
        target: student.target,
      });

    if (insertError) {
      return { success: false, error: `학생 등록 실패: ${insertError.message}` };
    }

    return {
      success: true,
      message: '학생이 성공적으로 등록되었습니다.',
      student: fullStudent,
    };
  } catch (error: any) {
    console.error('adminAddStudentAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Admin Action: Delete one or multiple students (batch).
 */
export async function adminDeleteStudentsAction(
  adminId: string,
  studentIds: string[]
): Promise<ActionResponse> {
  try {
    // 1. Verify administrator credentials and role authorization
    await verifyAdminAuth(adminId);

    // 2. Mock mode fallback if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn(`[Mock Action] Admin ${adminId} deleting students: ${studentIds.join(', ')}`);
      return {
        success: true,
        mock: true,
        message: '데모 모드: 선택한 학생이 삭제되었습니다 (Mock).',
      };
    }

    // 3. Delete student records from Supabase.
    // Related tables like registrations cascade-delete on students(id) automatically in DB.
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .in('id', studentIds);

    if (deleteError) {
      return { success: false, error: `학생 삭제 실패: ${deleteError.message}` };
    }

    return { success: true, message: '선택한 학생 정보가 삭제되었습니다.' };
  } catch (error: any) {
    console.error('adminDeleteStudentsAction error:', error);
    return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * Authentication Action: Log in a student or an admin.
 * Verifies credentials and sets the HTTP-only session cookie.
 */
export async function loginAction(
  identifier: string,
  secret: string
): Promise<ActionResponse & { session?: any }> {
  try {
    const session = await authenticateUserWithSupabase(identifier, secret);
    if (!session) {
      return { success: false, error: '로그인 정보가 일치하지 않습니다.' };
    }

    // Create session token and write secure HTTP-only cookie
    const token = await createSessionToken({
      userId: session.id,
      role: session.role,
      name: session.name,
    });

    await setSession(token);

    return {
      success: true,
      message: '성공적으로 로그인했습니다.',
      session,
    };
  } catch (error: any) {
    console.error('loginAction error:', error);
    return { success: false, error: error.message || '로그인 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * Authentication Action: Log out the current user by clearing their cookie.
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    await clearSession();
    return { success: true, message: '로그아웃되었습니다.' };
  } catch (error: any) {
    console.error('logoutAction error:', error);
    return { success: false, error: error.message || '로그아웃 중 오류가 발생했습니다.' };
  }
}

/**
 * Utility Action: Retrieve the current secure Next.js server system time.
 */
export async function getServerTimeAction(): Promise<string> {
  return new Date().toISOString();
}

