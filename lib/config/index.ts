export const BLOCKS = [
  { id: 'A' as const, label: '1·2교시', time: '08:20–10:00', periods: [1, 2] },
  { id: 'B' as const, label: '3·4교시', time: '10:20–12:00', periods: [3, 4] },
  { id: 'C' as const, label: '5·6교시', time: '14:30–16:10', periods: [5, 6] },
  { id: 'D' as const, label: '7·8교시', time: '16:30–18:10', periods: [7, 8] },
];

export const DAYS = ['월', '화', '수', '목', '금'] as const;

export const DEFAULT_COHORT_ID = '2027-재수정규-6평';
