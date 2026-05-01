import React, { useState, useMemo } from 'react';
import {
  Search, BookOpen, ChevronRight, ChevronLeft, Clock, MapPin,
  User, Users, CheckCircle2, AlertCircle, ArrowLeft, Plus, X, LogOut,
  Bell, GraduationCap, Check, Info, CalendarDays, Trash2, Mail, Lock,
  Download, Printer, Sparkles, Target, BookMarked, Filter,
  Award, BarChart3, AlertTriangle, ChevronDown
} from 'lucide-react';

// ─── Brand Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#2DAE9D', primaryDark: '#259387', primaryLight: '#E8F5F3', primaryBg: '#F4FAF9',
  text: '#111827', textMuted: '#6B7280', textFaint: '#9CA3AF',
  border: '#EAECEE', borderLight: '#F3F4F6', surface: '#FAFAFA',
  warning: '#D97706', warningBg: '#FEF3C7', warningLight: '#FFFBEB',
  danger: '#DC2626', dangerBg: '#FEE2E2',
};
const FONT = "'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR','Segoe UI',Roboto,sans-serif";

// ─── 시간표 블록 정의 ───────────────────────────────────────────────────────
// 8교시를 4개 블록으로 묶어 표시 (대부분 강의는 2교시 연속)
const BLOCKS = [
  { id: 'A', label: '1·2교시', time: '08:20–10:00', periods: [1, 2] },
  { id: 'B', label: '3·4교시', time: '10:20–12:00', periods: [3, 4] },
  { id: 'C', label: '5·6교시', time: '14:30–16:10', periods: [5, 6] },
  { id: 'D', label: '7·8교시', time: '16:30–18:10', periods: [7, 8] },
];
const DAYS = ['월', '화', '수', '목', '금'];

// ─── Course Data (PDF에서 추출) ────────────────────────────────────────────
// meetings: [{day,block}] — 같은 강의가 주 2회 만나는 경우 2개 항목
const COURSES = [
  // 국어 — 독서
  { id:'r-cg-1-mon-b', code:'독서_개념기출_1_월34', subject:'국어', sub:'독서', type:'개념기출', level:'1-2등급', instructor:'황의재',
    textbook:'[이투스] 독서 BLUE', duration:10, season:'1-2', meetings:[{day:'월',block:'B'}],
    concept:'평가원 스타일과 매력적 오답 분석을 통한 1등급 안정화. 26학년도 6/9평 상위 오답 방식 집중 분석, 평가원 문해력 강화, 고난도 지문 심층 강독.',
    objective:'평가원 스타일과 필수 유형에 대한 확실한 접근법 체득' },
  { id:'r-cg-3-mon-d', code:'독서_개념기출_3_월78', subject:'국어', sub:'독서', type:'개념기출', level:'3-4등급', instructor:'황의재',
    textbook:'[이투스] 독서 BLUE', duration:10, season:'1-2', meetings:[{day:'월',block:'D'}],
    concept:'평가원 스타일 분석과 문해력 강화로 안정적인 등급 상승. 상호 토의와 질의응답을 통한 능동적 수업.',
    objective:'평가원 스타일과 필수 유형에 대한 확실한 접근법 체득' },
  { id:'r-cg-3-fri-a', code:'독서_개념기출_3_금12', subject:'국어', sub:'독서', type:'개념기출', level:'3등급', instructor:'최원창',
    title:'흔들림 없는 독서', textbook:'[이투스] 독서 BLUE', duration:10, season:'1-2', meetings:[{day:'금',block:'A'}],
    concept:'문장 읽기부터 지문 분석 방법까지. 기본부터 차근차근, 천천히. 매시간 강의 + TEST + 문제 풀이.',
    objective:'난이도에 흔들리지 않는 독서 실력 배양' },
  { id:'r-cg-5-wed-a', code:'독서_개념기출_5_수12', subject:'국어', sub:'독서', type:'개념기출', level:'5등급 이하', instructor:'권경민',
    title:'국어게인 독서 개념/기출', textbook:'[이투스] 독서 BLUE', duration:15, season:'1-2', meetings:[{day:'수',block:'A'}],
    concept:'독서 지문에 대한 독해의 기본을 잡는 수업. ‘절대기준점’을 통해 글을 이해하고 정보 처리 방법을 익힘.',
    objective:'평가원이 요구하는 지문 읽기의 방향성과 정확한 문제풀이 기준 정립' },
  { id:'r-tt-3-tue-a', code:'독서_유형테마_3_화12', subject:'국어', sub:'독서', type:'유형테마', level:'3-4등급', instructor:'전재림',
    textbook:'강사 개인 교재', duration:10, season:'1-2', meetings:[{day:'화',block:'A'}],
    concept:'8가지 테마로 정리하는 평가원 기출 독서 독해법의 모든 것. 평가원 기출(08~26학년도) 분석.',
    objective:'평가원 기출코드 완전분석' },

  // 국어 — 문학
  { id:'l-cg-3-tue-d', code:'문학_개념기출_3_화78', subject:'국어', sub:'문학', type:'개념기출', level:'3-4등급', instructor:'황의재',
    textbook:'[이투스] 문학 BLUE', duration:10, season:'1-2', meetings:[{day:'화',block:'D'}],
    concept:'평가원의 시각과 매력적 오답. 산문/운문 문학의 출제 포인트 체화. 수능 필수 출제용어 총정리.',
    objective:'장르별 평가원의 출제 포인트를 확실하게 체득' },
  { id:'l-cg-3-mon-a', code:'문학_개념기출_3_월12', subject:'국어', sub:'문학', type:'개념기출', level:'3등급', instructor:'최원창',
    title:'두려움 없는 고전시가', textbook:'EBS 수능 특강 + 프린트', duration:10, season:'1-2', meetings:[{day:'월',block:'A'}],
    concept:'수능 필수 가사·시조 완벽 정리. EBS 수능 특강 연계 고전 시가 완벽 정리.',
    objective:'고전 시가도 막힘없이! 두려움 없이!' },
  { id:'l-tt-1-wed-d', code:'문학_유형테마_1_수78', subject:'국어', sub:'문학', type:'유형테마', level:'1-2등급', instructor:'조한균',
    textbook:'[이투스] 문학 BLUE', duration:5, season:'1', meetings:[{day:'수',block:'D'}],
    concept:'백분위 100을 위해서는 문학 풀이는 빠르고 정확해야 한다. 태도의 변화→시야의 확대→수능적 사고의 완성.',
    objective:'태도의 변화-시야의 확대-수능적 사고의 완성' },

  // 국어 — 화작/언매 (선택)
  { id:'hj-thu-a', code:'화작_개념기출_전체_목12', subject:'국어', sub:'화작', type:'개념기출', level:'전체', instructor:'김선영',
    elective:'화법과작문', textbook:'강사 개인 교재', duration:15, season:'1-2', meetings:[{day:'목',block:'A'}],
    concept:'유형별 주요 개념 학습 및 심화 수업. 화법과 작문 출제 포인트와 문제 접근법 제시.',
    objective:'20분 35점 완성하기 (화법과 작문, 독서론, 어휘)' },
  { id:'em-thu-c', code:'언매_개념기출_전체_목56', subject:'국어', sub:'언매', type:'개념기출', level:'전체', instructor:'김선영',
    elective:'언어와매체', textbook:'강사 개인 교재', duration:15, season:'1-2', meetings:[{day:'목',block:'C'}],
    concept:'통사론·의미론·화용론·국어사 영역별 주요 개념 학습 및 심화 수업.',
    objective:'20분 35점 완성하기 (언어와 매체, 독서론, 어휘)' },

  // 국어 — 실모
  { id:'k-nje-thu-b', code:'국어(공통)_N제실모_전체_목34', subject:'국어', sub:'실모', type:'N제실모', level:'전체', instructor:'황의재',
    textbook:'한수 모의고사', duration:10, season:'1-2', meetings:[{day:'목',block:'B'}],
    concept:'콘텐츠 상위 오답 문항 심층 분석. 관련 평가원 기출 지문으로 심화 적용. 실전 전략 체득.',
    objective:'독서+문학의 실전적 운용 전략 체득' },

  // 수학 — 수1
  { id:'m1-cg-1-mon-b', code:'수1_개념기출_1_월34', subject:'수학', sub:'수1', type:'개념기출', level:'1-3등급', instructor:'여왕모',
    textbook:'[이투스] 수능개념 수학1 BLACK', duration:5, season:'1', meetings:[{day:'월',block:'B'}],
    concept:'최근 수능에 나오는 핵심 유형 공략을 위한 유형+실전 연습. 까다로운 3점 유형부터 어려운 4점 유형까지 최신 유형 분석.',
    objective:'6월 모평에서 2등급 이상을 만들자' },
  { id:'m1-cg-3-thu-b', code:'수1_개념기출_3_목34', subject:'수학', sub:'수1', type:'개념기출', level:'3-4등급', instructor:'여왕모',
    textbook:'[이투스] 수능개념 수학1 BLUE', duration:5, season:'1', meetings:[{day:'목',block:'B'}],
    concept:'최근 수능에 나오는 핵심 유형 공략을 위한 유형+실전 연습. 기초부터 확실하게 다지고 실전적응력을 키우자.',
    objective:'6월 모평에서 3등급 이상을 만들자' },
  { id:'m1-cg-5-monwed-a', code:'수1_개념기출_5_월수12', subject:'수학', sub:'수1', type:'개념기출', level:'5등급 이하', instructor:'한덕원',
    textbook:'[이투스] 수능개념 수학1 BLUE', duration:15, season:'1-2', meetings:[{day:'월',block:'A'},{day:'수',block:'A'}],
    concept:'학습에 어려움을 겪었거나 학습의 단절이 있었던 학생들이 기본 개념을 학습할 수 있도록. 정~~말 천천히 쉽게.',
    objective:'기본 개념을 갖추고 쉬운 4점 문항까지 해결하는 능력 배양' },
  { id:'m1-tt-1-thu-a', code:'수1_유형테마_1_목12', subject:'수학', sub:'수1', type:'유형테마', level:'1-2등급', instructor:'조시훈',
    textbook:'TACTICS 수학1, ALL IN ONE 수학1', duration:15, season:'1-2', meetings:[{day:'목',block:'A'}],
    concept:'실전개념+도구정리+유형학습+기출분석(30%)+비기출 N제(70%). 수능날 낯선 문제를 만났을 때 내 힘으로 뚫어낼 수 있도록 개념을 내면화.',
    objective:'6월 평가원 모의고사 1등급' },

  // 수학 — 수2
  { id:'m2-cg-3-tue-c', code:'수2_개념기출_3_화56', subject:'수학', sub:'수2', type:'개념기출', level:'3-4등급', instructor:'여왕모',
    textbook:'[이투스] 수능개념 수학2 BLUE', duration:5, season:'1', meetings:[{day:'화',block:'C'}],
    concept:'최근 수능에 나오는 핵심 유형 공략. 틀리기 쉬운 유형부터 까다로운 4점 유형 정복하기.',
    objective:'6월 모평에서 2등급 이상을 만들자' },
  { id:'m2-tt-5-thu-c', code:'수2_유형테마_5_목56', subject:'수학', sub:'수2', type:'유형테마', level:'5등급 이하', instructor:'조시훈',
    textbook:'WEEKLY TRAINING 3점·쉬운 4점 집중', duration:15, season:'1-2', meetings:[{day:'목',block:'C'}],
    concept:'세 단어만 기억하세요: 이해, 모방, 반복. 강의 내용을 완벽하게 체화하면 6월 평가원에서 2점·3점·쉬운 4점 다 맞힐 수 있도록 구성.',
    objective:'6월 평가원 모의고사에서 2점·3점·쉬운 4점 다 맞기' },

  // 수학 — 미적분 (선택)
  { id:'cal-cg-3-thu-a', code:'미적분_개념기출_3_목12', subject:'수학', sub:'미적분', type:'개념기출', level:'3-4등급', instructor:'한덕원',
    elective:'미적분', textbook:'[이투스] 수능개념 미적분 BLACK', duration:10, season:'1', meetings:[{day:'목',block:'A'}],
    concept:'수열의 극한과 미분법 단원에서 자주 출제되는 기출 조건 해석 연습. 6월 평가원 시험 이후 적분법으로 이어진다.',
    objective:'개념을 문제 풀이에 연결하여 28·29번을 해결할 수 있는 능력 배양' },
  { id:'cal-tt-3-mon-a', code:'미적분_유형테마_3_월12', subject:'수학', sub:'미적분', type:'유형테마', level:'3-4등급', instructor:'계능',
    title:'미적분 4점 그래프', elective:'미적분', textbook:'프린트', duration:10, season:'1-2', meetings:[{day:'월',block:'A'}],
    concept:'수능 미적분 4점의 핵심은 그래프를 그릴 수 있느냐. 그래프 4단계 "그리기, 만지기, 다듬기, 완성하기"로 구성.',
    objective:'미적분 4점은 보통 3개 이상의 필수개념이 복합 적용. 단계별 분석과 통합 훈련.' },

  // 수학 — 확률과 통계 (선택)
  { id:'pr-cg-3-wed-c', code:'확통_개념기출_3_수56', subject:'수학', sub:'확통', type:'개념기출', level:'3-4등급', instructor:'한덕원',
    elective:'확률과통계', textbook:'프린트', duration:10, season:'1', meetings:[{day:'수',block:'C'}],
    concept:'35분 동안 8문항 풀 수 있는 시간 제공. 등급을 결정하는 #27~30 수준의 문항 해결 원리 설명.',
    objective:'시간 내에 배웠던 개념을 문항에 적용하여 시험장에서 발휘할 수 있는 최상의 능력 끌어내기' },

  // 수학 — 기하 (선택)
  { id:'geo-mon-d', code:'기하_개념기출_전체_월78', subject:'수학', sub:'기하', type:'개념기출', level:'전체', instructor:'여왕모',
    elective:'기하', textbook:'자체 프린트', duration:5, season:'1', meetings:[{day:'월',block:'D'}],
    concept:'최근 수능·평가원에 나오는 핵심 유형 공략. 까다로운 3점 유형부터 어려운 4점 유형까지.',
    objective:'6월 모평에서 2등급 이상을 만들자' },

  // 영어 — 구문
  { id:'eg-cg-2-thu-c', code:'구문_개념기출_2_목56', subject:'영어', sub:'구문', type:'개념기출', level:'2등급 이하', instructor:'이장원',
    title:'구문미장원', textbook:'[이투스] 구문 HS', duration:10, season:'1', meetings:[{day:'목',block:'C'}],
    concept:'문법 용어의 사용을 최대한 배제. 실전에서 사용하기 쉽게 해석 패턴화. 문법 1도 몰라도 제대로 읽을 수 있다.',
    objective:'수능 실전용 해석 연습' },
  { id:'eg-cg-all-mon-a', code:'구문_개념기출_전체_월12', subject:'영어', sub:'구문', type:'개념기출', level:'3등급', instructor:'김영석',
    title:'손에 잡히는 구문독해', textbook:'손에 잡히는 구문독해 2.0', duration:15, season:'1-2', meetings:[{day:'월',block:'A'}],
    concept:'흔들리지 않는 영어의 뼈대 세우기. 영어 어순과 덩어리로 읽기. 길고 복잡한 문장 읽기에 익숙해지기.',
    objective:'문장 해석의 뼈대를 세우자' },

  // 영어 — 독해
  { id:'er-cg-3-wed-a', code:'독해_개념기출_3_수12', subject:'영어', sub:'독해', type:'개념기출', level:'2등급 이하', instructor:'이장원',
    title:'독해미장원', textbook:'[이투스] 유형 CLEAR 대의파악·빈칸 BLUE', duration:15, season:'1-2', meetings:[{day:'수',block:'A'}],
    concept:'수능을 수능답게! 평가원의 CODE를 이해하고 출제자의 의도를 정확히 파악하여 대의파악/빈칸추론 문제 유형 MASTER.',
    objective:'수능 필수 유형 3대장 중 대의파악·빈칸 추론' },
  { id:'er-cg-1-thu-b', code:'독해_개념기출_1_목34', subject:'영어', sub:'독해', type:'개념기출', level:'1-2등급', instructor:'구성연',
    textbook:'[이투스] 어법·어휘·간접쓰기 BLUE', duration:15, season:'1-2', meetings:[{day:'목',block:'B'}],
    concept:'안정적인 1등급을 위한 본질적인 심화 독해 강좌. 수능 기출 문제 분석을 보다 심도있게 접근.',
    objective:'수능에서의 안정적인 1등급' },

  // 영어 — 어휘 / 듣기
  { id:'voc-thu-a', code:'어휘_개념기출_4_목12', subject:'영어', sub:'어휘', type:'개념기출', level:'4등급 이하', instructor:'이장원',
    title:'어휘미장원', textbook:'자체 프린트', duration:15, season:'1-2', meetings:[{day:'목',block:'A'}],
    concept:'필수 기출 문장과 함께 보는 필수 어휘. 어휘 - 어원/다의어/반의어 등 + TEST + 누적 TEST.',
    objective:'어휘 확장 PROJECT' },
  { id:'lis-wed-b', code:'듣기_개념기출_4_수34', subject:'영어', sub:'듣기', type:'개념기출', level:'4등급 이하', instructor:'이장원',
    title:'듣기미장원', textbook:'EBS 수능특강 영어 듣기', duration:15, season:'1-2', meetings:[{day:'수',block:'B'}],
    concept:'수능 영어 듣기 실전 연습. 유형별 풀이법 제시. 끊어 듣기를 통해 듣기에서의 문제점을 정확히 진단.',
    objective:'듣기는 다 맞혀야지' },

  // 탐구 — 사회/과학 (2개 선택)
  { id:'eth-tue-a', code:'생윤_개념기출_전체_화12', subject:'탐구', sub:'생활과윤리', type:'개념기출', level:'전체', instructor:'정홍배',
    elective:'생활과윤리', textbook:'EBS 수능 특강', duration:15, season:'1-2', meetings:[{day:'화',block:'A'}],
    concept:'핵심 개념을 이해하고 수능 원리에 적용. 배경 사상을 보다 쉽고 재미있게 이해할 수 있도록 강의.',
    objective:'배운 내용을 확인하고 적용. 수능을 예측하고 대비.' },
  { id:'soc-tue-c', code:'사문_개념기출_전체_화56', subject:'탐구', sub:'사회문화', type:'개념기출', level:'전체', instructor:'박창신',
    elective:'사회문화', textbook:'Perfect Society & Culture', duration:15, season:'1-2', meetings:[{day:'화',block:'C'}],
    concept:'사회·문화 교과목의 출제 항목별 테마 정리 수업. 출제 항목별 기초·심화 개념을 가장 쉽고 정확하게 설명.',
    objective:'2027학년도 사회문화 최소 2등급 이상 목표' },
  { id:'bio-tue-b', code:'생명_개념기출_전체_화34', subject:'탐구', sub:'생명과학1', type:'개념기출', level:'전체', instructor:'김은주',
    elective:'생명과학1', textbook:'생명과학 1, 시작', duration:10, season:'1', meetings:[{day:'화',block:'B'}],
    concept:'생명과학1의 단단한 1 CYCLING. 전 범위의 60% 정리. 무의식이 답을 찾을 때까지!',
    objective:'즐겁게! 그러나 확실하게! 매주 1~2 테마의 완전정복' },
  { id:'ear-fri-a', code:'지학_개념기출_전체_금12', subject:'탐구', sub:'지구과학1', type:'개념기출', level:'3등급 이상', instructor:'홍인왕',
    elective:'지구과학1', textbook:'매실주 VOL 1, 2, 3 / 기출1208제', duration:15, season:'1-2', meetings:[{day:'금',block:'A'}],
    concept:'빠른 개념 정리 후 주요 기출 문항을 통한 개념 적용 연습.',
    objective:'6평 대비 전 필수 개념 및 기출 정리' },
];

// 풍부한 syllabus 예시 (1개 강의에만 풀로, 나머지는 약식)
const SYLLABUS_FULL = {
  'r-cg-3-mon-d': [
    { week:1,  date:'2/23(월)', topic:'평가원 스타일 ❶' },
    { week:2,  date:'3/2(월)',  topic:'평가원 스타일 ❷' },
    { week:3,  date:'3/9(월)',  topic:'평가원 문해력 강화 ❶' },
    { week:4,  date:'3/16(월)', topic:'모의고사', special:'exam' },
    { week:5,  date:'3/23(월)', topic:'정기휴가', special:'break' },
    { week:6,  date:'3/30(월)', topic:'평가원 문해력 강화 ❷' },
    { week:7,  date:'4/6(월)',  topic:'평가원 문해력 강화 ❸' },
    { week:8,  date:'4/13(월)', topic:'고난도 지문 ❶ [과학/기술]' },
    { week:9,  date:'4/20(월)', topic:'고난도 지문 ❷ [법률/경제]' },
    { week:10, date:'4/27(월)', topic:'고난도 지문 ❸ [논리/철학]' },
    { week:11, date:'5/4(월)',  topic:'평가원 문해력 심화', season:2 },
    { week:12, date:'5/11(월)', topic:'고난이도 유형 ❶ [추론 특화]', season:2 },
    { week:13, date:'5/18(월)', topic:'고난이도 유형 ❷ [<보기> 특화]', season:2 },
    { week:14, date:'5/25(월)', topic:'정기휴가', special:'break', season:2 },
    { week:15, date:'6/1(월)',  topic:'6평 대비 실전 시험 운용 매뉴얼', season:2 },
  ],
};

// ─── 학생 프로필 ───────────────────────────────────────────────────────────
const STUDENT = {
  name: '김민준',
  studentId: '2027-0142',
  cohort: '6평 완성반',
  diagnostic: { 국어:'3등급', 수학:'4등급', 영어:'2등급', 탐구:'3등급' },
  // 선택과목 (확정된 것만)
  electives: { 국어선택: '화법과작문', 수학선택: '미적분', 탐구1: '생명과학1', 탐구2: '사회문화' },
};

// 6평 D-Day
const TARGET_DATE = new Date('2026-06-04');
const TODAY = new Date('2026-04-28');
const D_DAY = Math.ceil((TARGET_DATE - TODAY) / (1000*60*60*24));

// ─── 수강료 단계 (Class Pick) ──────────────────────────────────────────────
const PRICING_TIERS = [
  { id:'A', label:'Class A', range:'1–3강의',     min:1,  max:3,  fee:0,      desc:'무료' },
  { id:'B', label:'Class B', range:'4–6강의',     min:4,  max:6,  fee:100000, desc:'월 100,000원' },
  { id:'C', label:'Class C', range:'7–9강의',     min:7,  max:9,  fee:200000, desc:'월 200,000원' },
  { id:'D', label:'Class D', range:'10강의 이상', min:10, max:99, fee:300000, desc:'월 300,000원' },
];
const getTier = (n) => n===0 ? null : (PRICING_TIERS.find(t=>n>=t.min && n<=t.max) || null);
const formatKRW = (n) => n===0 ? '무료' : `${n.toLocaleString()}원`;

// ─── Shared Components ─────────────────────────────────────────────────────
const Logo = ({ size='md' }) => {
  const s = size==='lg' ? { brand:'text-3xl', pill:'text-xs px-2 py-0.5', sub:'text-base' } : { brand:'text-xl', pill:'text-[10px] px-1.5 py-0.5', sub:'text-sm' };
  return (
    <div className="flex items-center gap-2">
      <span className={`${s.brand} font-bold tracking-tight`} style={{color:C.primary}}>ETOOS</span>
      <span className={`${s.pill} font-bold text-white rounded`} style={{backgroundColor:C.primary}}>247</span>
      <span className={`${s.sub} text-gray-600 font-medium`}>이천기숙학원</span>
    </div>
  );
};

const Pill = ({ children, color='gray', size='sm' }) => {
  const colors = {
    gray:{bg:'#F3F4F6',text:'#4B5563'},
    teal:{bg:C.primaryLight,text:C.primaryDark},
    warn:{bg:'#FEF3C7',text:'#92400E'},
    red:{bg:'#FEE2E2',text:'#991B1B'},
    green:{bg:'#D1FAE5',text:'#065F46'},
    slate:{bg:'#F1F5F9',text:'#334155'},
  };
  const c = colors[color];
  const p = size==='sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return <span className={`inline-flex items-center gap-1 ${p} rounded font-medium`} style={{backgroundColor:c.bg,color:c.text}}>{children}</span>;
};

const Button = ({ children, variant='primary', size='md', onClick, disabled, className='', icon }) => {
  const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-5 py-3.5 text-sm' };
  const base = `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${className}`;
  if (variant==='primary') return <button onClick={onClick} disabled={disabled} className={`${base} text-white hover:opacity-90 active:scale-[0.98]`} style={{backgroundColor:C.primary}}>{icon}{children}</button>;
  if (variant==='ghost') return <button onClick={onClick} disabled={disabled} className={`${base} text-gray-700 hover:bg-gray-50`}>{icon}{children}</button>;
  if (variant==='danger') return <button onClick={onClick} disabled={disabled} className={`${base} bg-white border border-red-200 text-red-700 hover:bg-red-50`}>{icon}{children}</button>;
  return <button onClick={onClick} disabled={disabled} className={`${base} bg-white border text-gray-800 hover:bg-gray-50`} style={{borderColor:C.border}}>{icon}{children}</button>;
};

const Input = ({ icon, ...props }) => (
  <div className="relative">
    {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
    <input {...props} className={`w-full ${icon?'pl-10':'pl-4'} pr-4 py-2.5 border rounded-md text-sm bg-white focus:outline-none transition-colors`}
      style={{borderColor:C.border}}
      onFocus={(e)=>e.target.style.borderColor=C.primary}
      onBlur={(e)=>e.target.style.borderColor=C.border} />
  </div>
);

// 등급 → 색상
const levelColor = (level) => {
  if (level.startsWith('1')) return 'teal';
  if (level.startsWith('2') && level.includes('이하')) return 'teal';
  if (level.startsWith('3')) return 'green';
  if (level.startsWith('4')) return 'warn';
  if (level.startsWith('5')) return 'red';
  return 'gray';
};

// ─── Header ────────────────────────────────────────────────────────────────
const Header = ({ page, setPage, cartCount, onLogout }) => {
  const navItems = [
    { id:'dashboard', label:'대시보드' },
    { id:'schedule',  label:'시간표' },
    { id:'catalog',   label:'강의 검색' },
  ];
  return (
    <header className="border-b bg-white sticky top-0 z-20" style={{borderColor:C.border}}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button onClick={()=>setPage('dashboard')}><Logo /></button>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = page===item.id;
              return (
                <button key={item.id} onClick={()=>setPage(item.id)}
                  className="relative px-4 py-2 text-sm font-medium transition-colors"
                  style={{color: active ? C.primary : C.textMuted}}>
                  {item.label}
                  {active && <div className="absolute -bottom-[17px] left-4 right-4 h-0.5" style={{backgroundColor:C.primary}} />}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md" style={{backgroundColor:C.primaryBg}}>
            <Target size={14} style={{color:C.primary}}/>
            <span className="text-xs font-medium" style={{color:C.primaryDark}}>6평까지 D-{D_DAY}</span>
          </div>
          <button onClick={()=>setPage('cart')} className="relative p-2 rounded-md hover:bg-gray-50">
            <BookMarked size={18} className="text-gray-600" />
            {cartCount>0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{backgroundColor:C.primary}}>{cartCount}</span>}
          </button>
          <button className="p-2 rounded-md hover:bg-gray-50"><Bell size={18} className="text-gray-600" /></button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{backgroundColor:C.primary}}>{STUDENT.name.charAt(0)}</div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900 leading-tight">{STUDENT.name}</div>
              <div className="text-xs text-gray-500 leading-tight">{STUDENT.studentId}</div>
            </div>
            <button onClick={onLogout} className="ml-1 p-2 rounded-md hover:bg-gray-50"><LogOut size={16} className="text-gray-400" /></button>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Login ─────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8"><Logo size="lg" /></div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">수강신청</h1>
          <p className="text-sm text-gray-500 leading-relaxed">2027학년도 재수정규 6평 완성반<br/>수강신청 페이지입니다.</p>
        </div>
        <div className="space-y-3">
          <Input icon={<User size={16}/>} placeholder="학번" defaultValue="2027-0142" />
          <Input icon={<Lock size={16}/>} type="password" placeholder="비밀번호" defaultValue="••••••••" />
          <Button onClick={onLogin} size="lg" className="w-full mt-4">로그인</Button>
        </div>
      </div>
    </div>
    <footer className="py-8 text-center text-xs text-gray-400 border-t" style={{borderColor:C.borderLight}}>© 2026 ETOOS 247 이천기숙학원</footer>
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = ({ registered, setPage }) => {
  const myCourses = COURSES.filter(c=>registered.includes(c.id));
  const totalSlots = myCourses.reduce((s,c)=>s+c.meetings.length, 0);
  const currentTier = getTier(myCourses.length);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="text-sm text-gray-500 mb-1">안녕하세요,</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{STUDENT.name} 학생</h1>
          <Pill color="teal" size="md">{STUDENT.cohort}</Pill>
        </div>
        <p className="text-sm text-gray-500 mt-2">학번 {STUDENT.studentId} · 진단 등급 국어 {STUDENT.diagnostic.국어} · 수학 {STUDENT.diagnostic.수학} · 영어 {STUDENT.diagnostic.영어}</p>
      </div>

      {/* 핵심 카드: D-Day와 시즌 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="md:col-span-2 rounded-lg border p-6" style={{borderColor:C.primaryLight,backgroundColor:C.primaryBg}}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{backgroundColor:'white'}}>
                <Target size={18} style={{color:C.primary}} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">2027학년도 6월 모의평가</h3>
                <p className="text-xs text-gray-500 mt-0.5">2026년 6월 4일 (목)</p>
              </div>
            </div>
            <Pill color="teal">진행 중</Pill>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter" style={{color:C.primary}}>D-{D_DAY}</span>
            <span className="text-sm text-gray-500">남았습니다</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t" style={{borderColor:C.primaryLight}}>
            <div>
              <p className="text-xs text-gray-500 mb-1">SEASON 1</p>
              <p className="text-sm font-semibold text-gray-900">2/23 ~ 5/2</p>
              <p className="text-xs text-gray-500 mt-0.5">10주 · 마무리 주차</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">SEASON 2</p>
              <p className="text-sm font-semibold text-gray-900">5/4 ~ 6/6</p>
              <p className="text-xs text-gray-500 mt-0.5">5주 · 6평 마무리</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-6" style={{borderColor:C.border}}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500">신청 현황</p>
            {currentTier ? <Pill color="teal" size="sm">{currentTier.label}</Pill> : <Award size={16} className="text-gray-400" />}
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">{myCourses.length}</span>
            <span className="text-sm text-gray-500">강의</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">주 {totalSlots}교시 수강</p>
          <div className="pt-3 border-t" style={{borderColor:C.borderLight}}>
            <p className="text-xs text-gray-500 mb-2">변경 마감</p>
            <p className="text-sm font-semibold text-gray-900">5/2 (토) 23:59</p>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard icon={<CalendarDays size={18}/>} title="시간표 짜기" desc="시간표 그리드에서 빈 칸을 클릭해 강의를 추가하세요." onClick={()=>setPage('schedule')} primary />
          <ActionCard icon={<Search size={18}/>}       title="강의 검색"   desc="과목·등급별로 강의를 검색하고 비교하세요."         onClick={()=>setPage('catalog')} />
          <ActionCard icon={<Download size={18}/>}     title="시간표 PDF"  desc="확정된 시간표를 PDF로 받습니다."                    onClick={()=>setPage('schedule')} />
        </div>
      </section>
    </main>
  );
};

const ActionCard = ({ icon, title, desc, onClick, primary }) => (
  <button onClick={onClick} className="text-left border rounded-lg p-5 hover:border-gray-300 transition-all group"
    style={{borderColor: primary?C.primary:C.border, backgroundColor: primary?C.primaryBg:'white'}}>
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{backgroundColor:C.primaryLight,color:C.primary}}>{icon}</div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ChevronRight size={16} className="text-gray-300 ml-auto group-hover:text-gray-500" />
    </div>
    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
  </button>
);

// ─── 시간표 (Schedule Grid) ─────────────────────────────────────────────────
const ScheduleGrid = ({ registered, setPage, openSlot, removeCourse, viewCourse }) => {
  const myCourses = COURSES.filter(c=>registered.includes(c.id));

  // (day, block) → course mapping
  const grid = {};
  myCourses.forEach(c => c.meetings.forEach(m => { grid[`${m.day}-${m.block}`] = c; }));

  const totalSlots = myCourses.reduce((s,c)=>s+c.meetings.length,0);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">내 시간표</h1>
          <p className="text-sm text-gray-500">{myCourses.length}개 강의 · 주 {totalSlots}교시 · 빈 칸을 클릭해 강의를 추가하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Printer size={14}/>}>인쇄</Button>
          <Button variant="secondary" icon={<Download size={14}/>}>PDF 다운로드</Button>
        </div>
      </div>

      {/* 시간표 그리드 */}
      <div className="border rounded-lg overflow-hidden bg-white" style={{borderColor:C.border}}>
        <div className="grid" style={{gridTemplateColumns:'120px repeat(5, 1fr)'}}>
          {/* 헤더 */}
          <div className="border-b border-r p-3" style={{borderColor:C.border, backgroundColor:C.surface}}></div>
          {DAYS.map(d => (
            <div key={d} className="border-b border-r last:border-r-0 p-3 text-center" style={{borderColor:C.border, backgroundColor:C.surface}}>
              <div className="text-sm font-semibold text-gray-900">{d}요일</div>
            </div>
          ))}
          {/* 블록 행 */}
          {BLOCKS.map(block => (
            <React.Fragment key={block.id}>
              <div className="border-b border-r p-3 last:border-b-0" style={{borderColor:C.border, backgroundColor:C.surface}}>
                <div className="text-sm font-semibold text-gray-900">{block.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{block.time}</div>
              </div>
              {DAYS.map(day => {
                const c = grid[`${day}-${block.id}`];
                return (
                  <div key={`${day}-${block.id}`} className="border-b border-r last:border-r-0 p-1.5 last:border-b-0 relative" style={{borderColor:C.border, minHeight:96}}>
                    {c ? (
                      <button onClick={()=>viewCourse(c.id)} className="w-full h-full text-left rounded-md p-2.5 transition-colors hover:opacity-90 group"
                        style={{backgroundColor:C.primaryLight, borderLeft:`3px solid ${C.primary}`}}>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-[10px] font-mono text-gray-500">{c.subject}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <Pill color={levelColor(c.level)} size="sm">{c.level}</Pill>
                        </div>
                        <div className="text-xs font-semibold text-gray-900 leading-tight mb-1">{c.title || `${c.sub} ${c.type}`}</div>
                        <div className="text-[10px] text-gray-600">{c.instructor}</div>
                        <button onClick={(e)=>{e.stopPropagation(); removeCourse(c.id);}}
                          className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white"
                          title="제거">
                          <X size={11} className="text-gray-500"/>
                        </button>
                      </button>
                    ) : (
                      <button onClick={()=>openSlot(day, block.id)}
                        className="w-full h-full rounded-md flex items-center justify-center transition-colors hover:bg-gray-50 border-2 border-dashed"
                        style={{borderColor:C.borderLight}}>
                        <Plus size={16} className="text-gray-300" />
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 신청 강의 목록 */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">신청 강의 목록 ({myCourses.length})</h2>
        <div className="border rounded-lg divide-y bg-white" style={{borderColor:C.border}}>
          {myCourses.length===0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              아직 신청한 강의가 없습니다. 위 시간표에서 빈 칸을 클릭해 강의를 추가하세요.
            </div>
          ) : myCourses.map(c => (
            <div key={c.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-1 h-10 rounded-full" style={{backgroundColor:C.primary}}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-mono text-gray-400">{c.code}</span>
                  <Pill color={levelColor(c.level)} size="sm">{c.level}</Pill>
                  <span className="text-xs text-gray-500">{c.duration}주</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{c.title || `${c.sub} ${c.type}`}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.instructor} · {c.meetings.map(m => `${m.day} ${BLOCKS.find(b=>b.id===m.block).label}`).join(', ')}</p>
              </div>
              <button onClick={()=>viewCourse(c.id)} className="text-xs font-medium hover:underline" style={{color:C.primary}}>상세</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

// ─── 강의 선택 Drawer (시간표에서 빈 칸 클릭 시) ────────────────────────────
const SlotPicker = ({ slot, registered, onClose, addCourse, viewCourse }) => {
  if (!slot) return null;
  const block = BLOCKS.find(b=>b.id===slot.block);
  // 해당 슬롯에 만나는 강의들
  const eligible = COURSES.filter(c => c.meetings.some(m => m.day===slot.day && m.block===slot.block));
  // 학생 진단 등급 기준 추천
  const recommendForLevel = (lvl) => {
    if (lvl==='전체') return true;
    if (STUDENT.diagnostic.국어==='3등급' && (lvl.includes('3') || lvl==='3등급 이상')) return true;
    if (lvl.includes('2') && lvl.includes('이하')) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} style={{backgroundColor:'rgba(0,0,0,0.4)'}}>
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white flex flex-col" onClick={(e)=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{borderColor:C.border}}>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">강의 추가</p>
            <h2 className="text-lg font-semibold text-gray-900">{slot.day}요일 {block.label}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{block.time}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18} className="text-gray-500"/></button>
        </div>
        <div className="overflow-auto flex-1 px-6 py-4">
          {eligible.length===0 ? (
            <div className="text-center py-12 text-sm text-gray-500">이 시간대에는 강의가 개설되어 있지 않습니다.</div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-4">{eligible.length}개 강의 개설 · 추천 등급 강의가 위에 표시됩니다.</p>
              <div className="space-y-2">
                {eligible.sort((a,b)=> (recommendForLevel(b.level)?1:0) - (recommendForLevel(a.level)?1:0)).map(c => {
                  const isReg = registered.includes(c.id);
                  const recommended = recommendForLevel(c.level);
                  return (
                    <div key={c.id} className="border rounded-lg p-4" style={{borderColor: recommended?C.primaryLight:C.border, backgroundColor: recommended?C.primaryBg:'white'}}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-gray-500">{c.code}</span>
                            <Pill color="gray" size="sm">{c.subject} · {c.sub}</Pill>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">{c.title || `${c.sub} ${c.type}`}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{c.instructor} · {c.duration}주 · {c.textbook}</p>
                        </div>
                        <Pill color={levelColor(c.level)}>{c.level}</Pill>
                      </div>
                      {recommended && <div className="flex items-center gap-1 mb-2"><Sparkles size={11} style={{color:C.primary}}/><span className="text-[11px] font-medium" style={{color:C.primaryDark}}>내 진단 등급에 추천</span></div>}
                      <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{c.concept}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={()=>viewCourse(c.id)}>상세</Button>
                        {isReg ? <Button size="sm" variant="secondary" disabled>이미 신청함</Button> : <Button size="sm" onClick={()=>{addCourse(c.id); onClose();}}>이 강의 신청</Button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Catalog ───────────────────────────────────────────────────────────────
const Catalog = ({ registered, addCourse, viewCourse }) => {
  const [query, setQuery] = useState('');
  const [subj, setSubj] = useState('전체');
  const [type, setType] = useState('전체');
  const [recommend, setRecommend] = useState(false);

  const subjects = ['전체','국어','수학','영어','탐구'];
  const types = ['전체','개념기출','유형테마','N제실모'];

  const filtered = COURSES.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q || c.code.toLowerCase().includes(q) || (c.title||'').toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || c.sub.includes(query);
    const matchS = subj==='전체' || c.subject===subj;
    const matchT = type==='전체' || c.type===type;
    let matchR = true;
    if (recommend) {
      if (c.level==='전체') matchR = true;
      else if (STUDENT.diagnostic[c.subject]?.startsWith('3') && (c.level.includes('3')||c.level==='3등급 이상')) matchR = true;
      else if (STUDENT.diagnostic.영어==='2등급' && c.subject==='영어' && c.level.includes('2') && c.level.includes('이하')) matchR = true;
      else matchR = false;
    }
    return matchQ && matchS && matchT && matchR;
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">강의 검색</h1>
        <p className="text-sm text-gray-500">2027학년도 6평 완성반 · 총 {COURSES.length}개 강의 개설</p>
      </div>

      <div className="mb-5">
        <Input icon={<Search size={16}/>} placeholder="강의명, 학수번호, 교수명, 세부 과목으로 검색" value={query} onChange={(e)=>setQuery(e.target.value)} />
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 mr-1">과목</span>
          {subjects.map(s => (
            <button key={s} onClick={()=>setSubj(s)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{borderColor: subj===s?C.primary:C.border, backgroundColor: subj===s?C.primary:'white', color: subj===s?'white':C.textMuted}}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 mr-1">강좌 구분</span>
          {types.map(t => (
            <button key={t} onClick={()=>setType(t)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{borderColor: type===t?C.primary:C.border, backgroundColor: type===t?C.primary:'white', color: type===t?'white':C.textMuted}}>{t}</button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setRecommend(!recommend)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all"
              style={{borderColor: recommend?C.primary:C.border, backgroundColor: recommend?C.primaryBg:'white', color: recommend?C.primaryDark:C.textMuted}}>
              <Sparkles size={12}/> 내 진단 등급 추천만
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">{filtered.length}개 강의</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(c => {
          const isReg = registered.includes(c.id);
          return (
            <div key={c.id} className="border rounded-lg p-5 bg-white hover:border-gray-300 transition-all" style={{borderColor:C.border}}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{c.code}</span>
                  </div>
                  <button onClick={()=>viewCourse(c.id)} className="text-base font-semibold text-gray-900 hover:underline text-left">{c.title || `${c.sub} ${c.type}`}</button>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Pill color={levelColor(c.level)}>{c.level}</Pill>
                  {isReg && <Pill color="green"><Check size={10}/> 신청 완료</Pill>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Pill color="teal">{c.subject}</Pill>
                <Pill color="gray">{c.sub}</Pill>
                <Pill color="slate">{c.type}</Pill>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User size={12} className="text-gray-400"/><span>{c.instructor}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock size={12} className="text-gray-400"/>
                  <span>{c.meetings.map(m=>`${m.day} ${BLOCKS.find(b=>b.id===m.block).label}`).join(', ')} · {c.duration}주</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <BookOpen size={12} className="text-gray-400"/><span>{c.textbook}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">{c.concept}</p>
              <div className="flex justify-end gap-2 pt-3 border-t" style={{borderColor:C.borderLight}}>
                <Button size="sm" variant="secondary" onClick={()=>viewCourse(c.id)}>상세</Button>
                {!isReg && <Button size="sm" onClick={()=>addCourse(c.id)} icon={<Plus size={12}/>}>신청</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

// ─── Course Detail ─────────────────────────────────────────────────────────
const CourseDetail = ({ course, registered, addCourse, removeCourse, conflictingCourse, setPage }) => {
  if (!course) return null;
  const isReg = registered.includes(course.id);
  const syllabus = SYLLABUS_FULL[course.id];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <button onClick={()=>setPage('catalog')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8">
        <ArrowLeft size={14}/> 강의 검색으로
      </button>

      {/* 헤더 */}
      <div className="mb-8 pb-8 border-b" style={{borderColor:C.border}}>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <span className="text-sm font-mono text-gray-500">{course.code}</span>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">{course.title || `${course.sub} ${course.type}`}</h1>
        {course.title && <p className="text-sm text-gray-500 mb-4">학수 {course.sub} · {course.type}</p>}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Pill color="teal">{course.subject}</Pill>
          <Pill color="gray">{course.sub}</Pill>
          <Pill color="slate">{course.type}</Pill>
          <Pill color={levelColor(course.level)}>{course.level}</Pill>
          <Pill color="gray">{course.duration}주</Pill>
        </div>
        <p className="text-base text-gray-700 leading-relaxed">{course.concept}</p>
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Meta icon={<User size={14}/>}      label="강사"       value={course.instructor} />
        <Meta icon={<Clock size={14}/>}     label="강의 시간"  value={course.meetings.map(m=>`${m.day} ${BLOCKS.find(b=>b.id===m.block).label}`).join(', ')} />
        <Meta icon={<BookOpen size={14}/>}  label="교재"       value={course.textbook} />
        <Meta icon={<CalendarDays size={14}/>} label="진행 시즌"  value={course.season==='1'?'SEASON 1':course.season==='2'?'SEASON 2':'SEASON 1+2'} />
      </div>

      {/* 강의 목표 */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">강의 목표</h2>
        <div className="border rounded-lg p-5 flex items-start gap-3" style={{borderColor:C.primaryLight, backgroundColor:C.primaryBg}}>
          <Target size={18} style={{color:C.primary}} className="flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-gray-800 leading-relaxed">{course.objective}</p>
        </div>
      </section>

      {/* 주차별 강의계획서 */}
      {syllabus && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">주차별 강의계획서</h2>
          <p className="text-xs text-gray-500 mb-3">※ 주차별 세부 계획은 변동될 수 있습니다.</p>
          <div className="border rounded-lg overflow-hidden bg-white" style={{borderColor:C.border}}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500" style={{borderColor:C.border, backgroundColor:C.surface}}>
                  <th className="text-left px-4 py-3 font-medium w-20">주차</th>
                  <th className="text-left px-4 py-3 font-medium w-28">일자</th>
                  <th className="text-left px-4 py-3 font-medium">강의 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor:C.borderLight}}>
                {syllabus.map(w => (
                  <tr key={w.week} style={{backgroundColor: w.special==='break'?C.surface:w.special==='exam'?'#FEF3C7':'transparent'}}>
                    <td className="px-4 py-3 text-xs font-medium text-gray-600">
                      {w.week}주차 {w.season===2 && <Pill color="teal" size="sm">S2</Pill>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{w.date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span style={{color: w.special?'#92400E':C.text}}>{w.topic}</span>
                      {w.special==='exam' && <Pill color="warn" size="sm" className="ml-2">모의고사</Pill>}
                      {w.special==='break' && <Pill color="gray" size="sm" className="ml-2">휴강</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!syllabus && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">주차별 강의계획서</h2>
          <div className="border rounded-lg p-8 text-center text-sm text-gray-500" style={{borderColor:C.border}}>
            세부 강의계획서는 강의 시작 1주 전에 공개됩니다.
          </div>
        </section>
      )}

      {/* 액션 바 */}
      <div className="sticky bottom-6 mt-10 border rounded-lg p-4 flex items-center justify-between bg-white shadow-lg" style={{borderColor:C.border}}>
        <div>
          <p className="text-xs text-gray-500">시간</p>
          <p className="text-sm font-semibold text-gray-900">{course.meetings.map(m=>`${m.day} ${BLOCKS.find(b=>b.id===m.block).label}`).join(', ')}</p>
        </div>
        {isReg ? (
          <Button variant="danger" onClick={()=>removeCourse(course.id)} icon={<Trash2 size={14}/>}>신청 취소</Button>
        ) : conflictingCourse ? (
          <div className="flex items-center gap-3">
            <div className="text-xs text-right">
              <p className="font-semibold text-red-700">시간 충돌</p>
              <p className="text-gray-600">{conflictingCourse.title || conflictingCourse.sub}</p>
            </div>
            <Button disabled>신청 불가</Button>
          </div>
        ) : (
          <Button onClick={()=>addCourse(course.id)} icon={<Plus size={14}/>} size="lg">이 강의 신청하기</Button>
        )}
      </div>
    </main>
  );
};

const Meta = ({ icon, label, value }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
      <span className="text-gray-400">{icon}</span><span>{label}</span>
    </div>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

// ─── Cart / Confirm ────────────────────────────────────────────────────────
const Cart = ({ registered, removeCourse, onSubmit, setPage }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const myCourses = COURSES.filter(c=>registered.includes(c.id));

  // 영역별 그룹
  const byArea = {
    국어: myCourses.filter(c=>c.subject==='국어'),
    수학: myCourses.filter(c=>c.subject==='수학'),
    영어: myCourses.filter(c=>c.subject==='영어'),
    탐구: myCourses.filter(c=>c.subject==='탐구'),
  };

  // 수강료 단계
  const currentTier = getTier(myCourses.length);
  const atBoundary = [3,6,9].includes(myCourses.length);
  const nextTier = atBoundary ? PRICING_TIERS.find(t => t.min === myCourses.length+1) : null;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">신청 검토</h1>
        <p className="text-sm text-gray-500">아래 강의로 신청을 확정합니다. 변경 마감일까지 수정할 수 있습니다.</p>
      </div>

      {myCourses.length===0 ? (
        <div className="border-2 border-dashed rounded-lg py-16 px-6 text-center" style={{borderColor:C.border}}>
          <BookMarked size={32} className="text-gray-300 mx-auto mb-4"/>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">신청한 강의가 없습니다</h3>
          <p className="text-xs text-gray-500 mb-5">시간표에서 빈 칸을 클릭하거나 강의 검색에서 강의를 추가하세요.</p>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={()=>setPage('catalog')} icon={<Search size={14}/>}>강의 검색</Button>
            <Button onClick={()=>setPage('schedule')} icon={<CalendarDays size={14}/>}>시간표 짜기</Button>
          </div>
        </div>
      ) : (
        <>
          {/* 영역별 신청 강의 */}
          {Object.entries(byArea).map(([area, courses]) => courses.length>0 && (
            <section key={area} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{area} ({courses.length})</h3>
              <div className="border rounded-lg divide-y bg-white" style={{borderColor:C.border}}>
                {courses.map(c => (
                  <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{c.code}</span>
                        <Pill color={levelColor(c.level)} size="sm">{c.level}</Pill>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{c.title || `${c.sub} ${c.type}`}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{c.instructor} · {c.meetings.map(m=>`${m.day} ${BLOCKS.find(b=>b.id===m.block).label}`).join(', ')} · {c.duration}주</p>
                    </div>
                    <button onClick={()=>removeCourse(c.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Class Pick — 단계 안내 */}
          <section className="border rounded-lg p-5 mb-6 bg-white" style={{borderColor:C.border}}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Class Pick</h3>
                <p className="text-xs text-gray-500 mt-0.5">신청한 강의 수에 따라 자동으로 단계가 결정됩니다.</p>
              </div>
              {currentTier && <Pill color="teal" size="md">{currentTier.label} 적용</Pill>}
            </div>

            <div className="space-y-2">
              {PRICING_TIERS.map((t, i) => {
                const active = currentTier?.id === t.id;
                const passed = currentTier && PRICING_TIERS.findIndex(x=>x.id===currentTier.id) > i;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-md" style={{backgroundColor: active ? C.primaryBg : 'transparent'}}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      backgroundColor: active ? C.primary : passed ? '#D1FAE5' : C.surface,
                      color: active ? 'white' : passed ? '#065F46' : C.textFaint,
                    }}>
                      {(active || passed) ? <Check size={12}/> : <span className="text-[10px] font-bold">{t.id}</span>}
                    </div>
                    <span className="text-sm font-semibold w-20" style={{color: active ? C.primaryDark : passed ? C.text : C.textMuted}}>{t.label}</span>
                    <span className="text-sm flex-1" style={{color: active ? C.text : C.textMuted}}>{t.range}</span>
                  </div>
                );
              })}
            </div>

            {nextTier && (
              <div className="mt-4 px-4 py-3 rounded-md flex items-start gap-2.5" style={{backgroundColor: C.warningLight}}>
                <Info size={14} style={{color: C.warning}} className="flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-gray-700 leading-relaxed">
                  강의를 1개 더 추가하면 <span className="font-semibold">{nextTier.label}</span> 단계로 변경됩니다.
                </p>
              </div>
            )}
          </section>

          {/* 제출 */}
          <div className="flex items-center justify-between p-5 border rounded-lg" style={{borderColor:C.border, backgroundColor:C.primaryBg}}>
            <div>
              <p className="text-xs text-gray-500 mb-1">신청 강의</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900">{myCourses.length}강의</span>
                <span className="text-sm text-gray-500">· 주 {myCourses.reduce((s,c)=>s+c.meetings.length,0)}교시</span>
                {currentTier && <Pill color="teal" size="md">{currentTier.label}</Pill>}
              </div>
            </div>
            <Button size="lg" onClick={()=>setShowConfirm(true)} icon={<Check size={16}/>}>수강신청하기</Button>
          </div>
        </>
      )}

      {/* 수강신청 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.4)'}} onClick={()=>setShowConfirm(false)}>
          <div className="max-w-md w-full bg-white rounded-lg shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="p-6">
              <div className="w-11 h-11 rounded-full mb-4 flex items-center justify-center" style={{backgroundColor:C.primaryLight}}>
                <Info size={20} style={{color:C.primary}} />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">수강신청 확인</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                선택하신 <span className="font-semibold text-gray-900">{myCourses.length}개 강의</span>로 수강신청을 진행합니다.
              </p>

              {currentTier && (
                <div className="rounded-md p-4 mb-4" style={{backgroundColor:C.primaryBg, border:`1px solid ${C.primaryLight}`}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">배정 단계</span>
                    <Pill color="teal" size="md">{currentTier.label}</Pill>
                  </div>
                  <p className="text-sm text-gray-700">
                    신청 강의 수 ({currentTier.range})에 따라 <span className="font-semibold">{currentTier.label}</span> 단계로 자동 배정됩니다.
                  </p>
                </div>
              )}

              <div className="rounded-md p-4 flex items-start gap-2.5" style={{backgroundColor:C.warningLight, border:`1px solid #FED7AA`}}>
                <AlertCircle size={16} style={{color:C.warning}} className="flex-shrink-0 mt-0.5"/>
                <div className="text-xs text-gray-700 leading-relaxed">
                  <p className="font-semibold mb-1 text-gray-900">결제 안내 [추후 확정]</p>
                  <p className="italic text-gray-500">※ 정확한 안내 문구는 추후 확정 예정입니다. 결제 관련 안내 사항이 이 영역에 표시됩니다.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{borderColor:C.border}}>
              <Button variant="secondary" onClick={()=>setShowConfirm(false)}>취소</Button>
              <Button onClick={()=>{ setShowConfirm(false); onSubmit(); }} icon={<Check size={14}/>}>확인하고 신청 완료</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// ─── App Shell ─────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('login');
  const [registered, setRegistered] = useState(['l-cg-3-mon-a','er-cg-3-wed-a']); // 미리 신청된 일부
  const [selectedId, setSelectedId] = useState(null);
  const [slot, setSlot] = useState(null);

  const addCourse = (id) => { if (!registered.includes(id)) setRegistered([...registered, id]); };
  const removeCourse = (id) => setRegistered(registered.filter(x=>x!==id));

  // 시간 충돌 검사
  const findConflict = (courseId) => {
    const c = COURSES.find(x=>x.id===courseId);
    if (!c) return null;
    for (const r of registered) {
      const reg = COURSES.find(x=>x.id===r);
      if (!reg) continue;
      for (const m of c.meetings) {
        if (reg.meetings.some(rm => rm.day===m.day && rm.block===m.block)) return reg;
      }
    }
    return null;
  };

  const selectedCourse = COURSES.find(c=>c.id===selectedId);
  const conflict = selectedCourse ? findConflict(selectedCourse.id) : null;

  if (page==='login') {
    return (
      <div style={{fontFamily:FONT, backgroundColor:'white', color:C.text}}>
        <Login onLogin={()=>setPage('dashboard')} />
      </div>
    );
  }

  return (
    <div style={{fontFamily:FONT, backgroundColor:'white', color:C.text, minHeight:'100vh'}}>
      <Header page={page} setPage={setPage} cartCount={registered.length} onLogout={()=>setPage('login')} />
      {page==='dashboard' && <Dashboard registered={registered} setPage={setPage} />}
      {page==='schedule' && <ScheduleGrid registered={registered} setPage={setPage}
        openSlot={(day,block)=>setSlot({day,block})}
        removeCourse={removeCourse}
        viewCourse={(id)=>{setSelectedId(id); setPage('course');}} />}
      {page==='catalog' && <Catalog registered={registered}
        addCourse={addCourse}
        viewCourse={(id)=>{setSelectedId(id); setPage('course');}} />}
      {page==='course' && <CourseDetail course={selectedCourse} registered={registered}
        addCourse={addCourse} removeCourse={removeCourse}
        conflictingCourse={conflict} setPage={setPage} />}
      {page==='cart' && <Cart registered={registered}
        removeCourse={removeCourse}
        onSubmit={()=>setPage('dashboard')} setPage={setPage} />}
      <SlotPicker slot={slot} registered={registered}
        onClose={()=>setSlot(null)}
        addCourse={addCourse}
        viewCourse={(id)=>{setSelectedId(id); setSlot(null); setPage('course');}} />
    </div>
  );
}
