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

export function exportStudents(students: { cohortId: string; name: string; dob: string; school: string; level: string; target: string }[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('학생 목록');
  ws.columns = [
    { header: '반', key: 'cohortId', width: 16 },
    { header: '이름', key: 'name', width: 12 },
    { header: '생년월일', key: 'dob', width: 14 },
    { header: '학교명', key: 'school', width: 20 },
    { header: '수준', key: 'level', width: 14 },
    { header: '목표', key: 'target', width: 24 },
  ];
  ws.getRow(1).font = { bold: true };
  students.forEach((s) => ws.addRow(s));
  downloadXlsx(wb, 'students.xlsx');
}

export function exportAttendanceSheet(
  course: { title: string; subject: string; instructor: string; textbook: string },
  students: { cohortId: string; name: string; school: string; level: string; dob: string }[]
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('출석부');

  ws.views = [{ showGridLines: true }];

  // 1. Title Block (Row 2)
  const now = new Date();
  const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  ws.mergeCells('A2:F2');
  const timeCell = ws.getCell('A2');
  timeCell.value = formattedDateTime;
  timeCell.font = { name: '맑은 고딕', size: 16, bold: true };
  timeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. Info grid (Row 3-4)
  // 과목
  ws.mergeCells('B3:C3');
  ws.getCell('B3').value = '과목';
  ws.mergeCells('B4:C4');
  ws.getCell('B4').value = course.subject;

  // 강사
  ws.mergeCells('D3:E3');
  ws.getCell('D3').value = '강사';
  ws.mergeCells('D4:E4');
  ws.getCell('D4').value = course.instructor;

  // 교재
  ws.mergeCells('F3:I3');
  ws.getCell('F3').value = '교재';
  ws.mergeCells('F4:I4');
  ws.getCell('F4').value = course.textbook || '자체 교재';

  // Logo / Academy Title
  ws.mergeCells('R3:U4');
  const logoCell = ws.getCell('R3');
  logoCell.value = 'ETOOS 247 이천기숙학원';
  logoCell.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FF2DAE9D' } };
  logoCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Style Info labels & values
  const infoRow3 = ws.getRow(3);
  const infoRow4 = ws.getRow(4);
  infoRow3.height = 20;
  infoRow4.height = 25;

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } }
  };

  ['B3', 'D3', 'F3'].forEach((cellId) => {
    const cell = ws.getCell(cellId);
    cell.font = { name: '맑은 고딕', size: 10, bold: true };
    cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEAECEE' } };
    cell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
  });

  ['B4', 'D4', 'F4'].forEach((cellId) => {
    const cell = ws.getCell(cellId);
    cell.font = { name: '맑은 고딕', size: 11, bold: true };
    cell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
  });
  
  for (let r = 3; r <= 4; r++) {
    for (let c = 2; c <= 9; c++) {
      ws.getCell(r, c).border = thinBorder;
    }
  }

  // 3. Accident note (Row 8)
  ws.getCell('A8').value = '*사고: 원내 없음 (외박, 개인사유 등)';
  ws.getCell('A8').font = { name: '맑은 고딕', size: 10, bold: true };

  // 4. Attendance Column Headers (Row 8, 9, 10)
  const startCol = 10; // J is column 10
  for (let i = 0; i < 6; i++) {
    const colIdx = startCol + i * 2;
    ws.mergeCells(8, colIdx, 8, colIdx + 1);
    const dayCell = ws.getCell(8, colIdx);
    dayCell.value = '월';
    dayCell.font = { name: '맑은 고딕', size: 9, bold: true };
    dayCell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
    dayCell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF2F2F2' } };
    dayCell.border = thinBorder;
    ws.getCell(8, colIdx + 1).border = thinBorder;

    ws.mergeCells(9, colIdx, 9, colIdx + 1);
    const labelCell = ws.getCell(9, colIdx);
    labelCell.value = i % 2 === 0 ? '요일' : '일';
    labelCell.font = { name: '맑은 고딕', size: 9, bold: true };
    labelCell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
    labelCell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF9F9F9' } };
    labelCell.border = thinBorder;
    ws.getCell(9, colIdx + 1).border = thinBorder;

    const checkCell = ws.getCell(10, colIdx);
    checkCell.value = '출석체크';
    checkCell.font = { name: '맑은 고딕', size: 9, bold: true };
    checkCell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
    checkCell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEAECEE' } };
    checkCell.border = thinBorder;

    const reasonCell = ws.getCell(10, colIdx + 1);
    reasonCell.value = '결석사유';
    reasonCell.font = { name: '맑은 고딕', size: 9, bold: true };
    reasonCell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
    reasonCell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEAECEE' } };
    reasonCell.border = thinBorder;
  }

  // Roster Column Headers (Row 10)
  const rosterHeaders = [
    { label: '', col: 1 }, // Column A (No)
    { label: '이름', col: 2 }, // Column B
    { label: '반', col: 3 }, // Column C
    { label: '성', col: 4 }, // Column D
    { label: '학년', col: 5 }, // Column E
    { label: '입소일', col: 6 }, // Column F
    { label: '사고', col: 7 }, // Column G
    { label: '교재', col: 8 }, // Column H
  ];

  rosterHeaders.forEach((h) => {
    const cell = ws.getCell(10, h.col);
    cell.value = h.label;
    cell.font = { name: '맑은 고딕', size: 10, bold: true };
    cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEAECEE' } };
    cell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
    cell.border = thinBorder;
  });

  ws.getRow(10).height = 24;

  // Set specific column widths
  ws.getColumn(1).width = 4;   // No
  ws.getColumn(2).width = 12;  // 이름
  ws.getColumn(3).width = 8;   // 반
  ws.getColumn(4).width = 5;   // 성
  ws.getColumn(5).width = 12;  // 학년
  ws.getColumn(6).width = 12;  // 입소일
  ws.getColumn(7).width = 8;   // 사고
  ws.getColumn(8).width = 8;   // 교재
  ws.getColumn(9).width = 3;   // Spacer column (I)

  for (let c = 10; c <= 21; c++) {
    ws.getColumn(c).width = c % 2 === 0 ? 8 : 10;
  }

  // 5. Populate Data Rows (Row 11 onwards)
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  sortedStudents.forEach((student, idx) => {
    const rowNum = 11 + idx;
    const row = ws.getRow(rowNum);
    row.height = 20;

    ws.getCell(rowNum, 1).value = idx + 1; // No
    ws.getCell(rowNum, 2).value = student.name;
    ws.getCell(rowNum, 3).value = student.cohortId;
    ws.getCell(rowNum, 4).value = ''; // 성 (Gender) - blank
    ws.getCell(rowNum, 5).value = student.level; // 학년 - level
    ws.getCell(rowNum, 6).value = ''; // 입소일 - blank
    ws.getCell(rowNum, 7).value = ''; // 사고 - blank
    ws.getCell(rowNum, 8).value = ''; // 교재 - blank

    for (let c = 1; c <= 8; c++) {
      const cell = ws.getCell(rowNum, c);
      cell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const };
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 10 };
    }

    for (let c = 10; c <= 21; c++) {
      const cell = ws.getCell(rowNum, c);
      cell.border = thinBorder;
    }
  });

  downloadXlsx(wb, `출석부_${course.title}.xlsx`);
}

export function exportCourses(
  courses: { code: string; subject: string; title: string; instructor: string; textbook?: string; enrolled: number; capacity: number }[],
  enrollments: Record<string, { cohortId: string; name: string; school: string }[]>,
) {
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('강좌 목록');
  ws.columns = [
    { header: '코드', key: 'code', width: 12 },
    { header: '과목', key: 'subject', width: 12 },
    { header: '강좌명', key: 'title', width: 24 },
    { header: '강사', key: 'instructor', width: 12 },
    { header: '교재', key: 'textbook', width: 24 },
    { header: '신청', key: 'enrolled', width: 8 },
    { header: '정원', key: 'capacity', width: 8 },
    { header: '충족률', key: 'rate', width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  courses.forEach((c) => ws.addRow({ ...c, rate: `${Math.round((c.enrolled / c.capacity) * 100)}%`, textbook: c.textbook || '자체 교재' }));

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
    { header: '생년월일', key: 'dob', width: 14 },
    { header: '학교명', key: 'school', width: 20 },
    { header: '수준', key: 'level', width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  
  // Add sample rows for illustration
  ws.addRow({ cohortId: '2027-final-6', name: '홍길동', dob: '2007-03-18', school: '서울고등학교', level: '종합' });
  ws.addRow({ cohortId: '2027-final-6', name: '성춘향', dob: '2007-05-22', school: '부산고등학교', level: '수학' });
  
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
