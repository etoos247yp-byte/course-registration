import ExcelJS from 'exceljs';

export function downloadXlsx(workbook: ExcelJS.Workbook, filename: string) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function exportStudents(students: { cohortId: string; name: string; school: string; level: string; target: string }[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('학생 목록');
  ws.columns = [
    { header: '반', key: 'cohortId', width: 16 },
    { header: '이름', key: 'name', width: 12 },
    { header: '학교명', key: 'school', width: 20 },
    { header: '수준', key: 'level', width: 14 },
    { header: '목표', key: 'target', width: 24 },
  ];
  ws.getRow(1).font = { bold: true };
  students.forEach((s) => ws.addRow(s));
  downloadXlsx(wb, 'students.xlsx');
}

export function exportCourses(
  courses: { code: string; subject: string; title: string; instructor: string; enrolled: number; capacity: number }[],
  enrollments: Record<string, { cohortId: string; name: string; school: string }[]>,
) {
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('강좌 목록');
  ws.columns = [
    { header: '코드', key: 'code', width: 12 },
    { header: '과목', key: 'subject', width: 12 },
    { header: '강좌명', key: 'title', width: 24 },
    { header: '강사', key: 'instructor', width: 12 },
    { header: '신청', key: 'enrolled', width: 8 },
    { header: '정원', key: 'capacity', width: 8 },
    { header: '충족률', key: 'rate', width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  courses.forEach((c) => ws.addRow({ ...c, rate: `${Math.round((c.enrolled / c.capacity) * 100)}%` }));

  for (const course of courses) {
    const students = enrollments[course.code] || [];
    if (students.length === 0) continue;
    const cws = wb.addWorksheet(course.code.replace(/[/\\?*[\]:]/g, '-'));
    cws.columns = [
      { header: '반', key: 'cohortId', width: 16 },
      { header: '이름', key: 'name', width: 12 },
      { header: '학교명', key: 'school', width: 20 },
    ];
    cws.getRow(1).font = { bold: true };
    students.forEach((s) => cws.addRow(s));
  }

  downloadXlsx(wb, 'courses.xlsx');
}

export function exportRegistrations(rows: { cohortId: string; name: string; school: string; courses: string; count: number; pick: string }[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('신청 현황');
  ws.columns = [
    { header: '반', key: 'cohortId', width: 16 },
    { header: '이름', key: 'name', width: 12 },
    { header: '학교명', key: 'school', width: 20 },
    { header: '신청 강좌', key: 'courses', width: 50 },
    { header: '개수', key: 'count', width: 8 },
    { header: '클래스픽', key: 'pick', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  downloadXlsx(wb, 'registrations.xlsx');
}

export async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: Record<string, string>[] = [];
  const headers: string[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => headers.push(String(cell.value ?? '')));
    } else {
      const obj: Record<string, string> = {};
      row.eachCell((cell, colNumber) => {
        obj[headers[colNumber - 1] || `col_${colNumber}`] = String(cell.value ?? '');
      });
      if (Object.values(obj).some((v) => v.trim())) rows.push(obj);
    }
  });
  return rows;
}

export function downloadStudentTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('학생 업로드 양식');
  ws.columns = [
    { header: '반', key: 'cohortId', width: 16 },
    { header: '이름', key: 'name', width: 12 },
    { header: '학교명', key: 'school', width: 20 },
    { header: '수준', key: 'level', width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  
  // Add sample rows for illustration
  ws.addRow({ cohortId: '2027-final-6', name: '홍길동', school: '서울고등학교', level: '종합' });
  ws.addRow({ cohortId: '2027-final-6', name: '성춘향', school: '부산고등학교', level: '수학' });
  
  downloadXlsx(wb, 'student_upload_template.xlsx');
}

export function downloadCourseTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('강좌 업로드 양식');
  ws.columns = [
    { header: '과목', key: 'subject', width: 12 },
    { header: '강좌명', key: 'title', width: 24 },
    { header: '추천대상', key: 'level', width: 16 },
    { header: '교재', key: 'textbook', width: 24 },
    { header: '강사', key: 'instructor', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  
  // Add sample rows for illustration
  ws.addRow({ subject: '국어', title: '국어 독서 개념/기출', level: '3등급 이하', textbook: '[이투스] 독서 BLUE', instructor: '김독서' });
  ws.addRow({ subject: '수학', title: '미적분 실전 N제', level: '1-2등급', textbook: '자체 프린트', instructor: '박수학' });
  
  downloadXlsx(wb, 'course_upload_template.xlsx');
}

