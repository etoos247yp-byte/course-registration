-- ============================================================================
-- Supabase Schema & Seed Data for ETOOS 247 Course Registration
-- ============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Drop existing tables if they exist (for clean setup)
drop table if exists individual_openings cascade;
drop table if exists registrations cascade;
drop table if exists courses cascade;
drop table if exists students cascade;
drop table if exists system_settings cascade;
drop table if exists admins cascade;

-- 3. Create tables

-- Students table
create table students (
  id text primary key,
  name text not null,
  dob text not null, -- Format: YYYY-MM-DD
  cohort_id text not null,
  level text not null,
  target text not null
);

-- Courses table
create table courses (
  id text primary key,
  code text not null unique,
  subject text not null,
  title text not null,
  instructor text not null,
  level text not null,
  credits integer not null,
  capacity integer not null,
  enrolled integer not null default 0,
  meetings jsonb not null, -- Array of { day, block, time }
  summary text not null
);

-- Registrations table
create table registrations (
  id text primary key,
  student_id text references students(id) on delete cascade,
  course_id text references courses(id) on delete cascade,
  status text not null check (status in ('active', 'dropped')),
  created_at timestamp with time zone not null default now()
);

-- Individual openings table (for student-specific registration windows)
create table individual_openings (
  id uuid primary key default uuid_generate_v4(),
  student_id text references students(id) on delete cascade,
  open timestamp with time zone not null,
  close timestamp with time zone not null,
  reason text not null
);

-- System settings table (for global settings like locked, deadlines, etc.)
create table system_settings (
  key text primary key,
  value jsonb not null
);

-- Admins table (for admin login)
create table admins (
  id text primary key,
  email text not null unique,
  password text not null, -- Plain text for demo/prototype, can be hashed in production
  name text not null,
  role text not null check (role in ('admin', 'super_admin'))
);

-- 4. Create trigger to automatically update enrolled count in courses table
create or replace function update_course_enrolled()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (NEW.status = 'active') then
      update courses set enrolled = enrolled + 1 where id = NEW.course_id;
    end if;
  elsif (TG_OP = 'UPDATE') then
    if (OLD.status = 'active' and NEW.status = 'dropped') then
      update courses set enrolled = greatest(0, enrolled - 1) where id = NEW.course_id;
    elsif (OLD.status = 'dropped' and NEW.status = 'active') then
      update courses set enrolled = enrolled + 1 where id = NEW.course_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (OLD.status = 'active') then
      update courses set enrolled = greatest(0, enrolled - 1) where id = OLD.course_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger registrations_enrolled_trigger
after insert or update or delete on registrations
for each row execute function update_course_enrolled();

-- 5. Seed initial data

-- Seed students
insert into students (id, name, dob, cohort_id, level, target) values
('stu-1', '김민준', '2007-03-18', '2027-final-6', '종합 3등급', '국수영탐 균형 상승'),
('stu-2', '이서연', '2007-05-22', '2027-final-6', '상위권', '수학 고난도 보강'),
('stu-3', '박지호', '2007-08-04', '2027-final-6', '중위권', '개념 누수 점검'),
('stu-4', '최예린', '2007-07-08', '2027-final-6', '최상위권', '실전 감각 유지');

-- Seed courses
insert into courses (id, code, subject, title, instructor, level, credits, capacity, enrolled, meetings, summary) values
('kor-basic', 'KOR-101', '국어', '독서 기본기 회복', '정하늘', '3-4등급', 2, 24, 0, '[{"day": "월", "block": "A", "time": "08:20-10:00"}, {"day": "수", "block": "A", "time": "08:20-10:00"}]'::jsonb, '지문 구조 읽기와 선지 판단 루틴을 반복합니다.'),
('math-basic', 'MAT-201', '수학', '수학 공통 개념 압축', '한도윤', '4등급 이하', 2, 20, 0, '[{"day": "월", "block": "A", "time": "08:20-10:00"}, {"day": "목", "block": "A", "time": "08:20-10:00"}]'::jsonb, '수1, 수2의 빈출 개념을 문제 풀이 흐름으로 정리합니다.'),
('eng-reading', 'ENG-110', '영어', '영어 빈칸과 순서', '오유진', '2-3등급', 2, 28, 0, '[{"day": "화", "block": "B", "time": "10:20-12:00"}, {"day": "목", "block": "B", "time": "10:20-12:00"}]'::jsonb, '논리 연결어와 문장 기능을 기준으로 고난도 유형을 풉니다.'),
('math-advanced', 'MAT-330', '수학', '미적분 실전 N제', '강서준', '1-2등급', 2, 18, 0, '[{"day": "화", "block": "C", "time": "14:30-16:10"}, {"day": "금", "block": "C", "time": "14:30-16:10"}]'::jsonb, '준킬러와 킬러 문항의 발상 전환을 훈련합니다.'),
('science-life', 'SCI-210', '과학탐구', '생명과학 도표 특강', '문채원', '전체', 1, 30, 0, '[{"day": "수", "block": "D", "time": "16:30-18:10"}]'::jsonb, '유전, 신경, 항상성 도표를 시간 안에 처리하는 강좌입니다.'),
('social-culture', 'SOC-120', '사회탐구', '사회문화 자료 분석', '서지윤', '전체', 1, 30, 0, '[{"day": "목", "block": "D", "time": "16:30-18:10"}]'::jsonb, '표, 그래프, 개념 비교 문항을 빠르게 분류하고 풉니다.'),
('kor-literature', 'KOR-240', '국어', '문학 선지 감각', '백소은', '전체', 1, 26, 0, '[{"day": "금", "block": "B", "time": "10:20-12:00"}]'::jsonb, '작품 암기가 아니라 표현과 정서의 판단 기준을 세웁니다.');

-- Seed registrations (the trigger will automatically increment enrolled counts in courses!)
insert into registrations (id, student_id, course_id, status, created_at) values
('reg-1', 'stu-2', 'math-advanced', 'active', '2026-05-01T09:00:00Z'),
('reg-2', 'stu-2', 'eng-reading', 'active', '2026-05-01T09:05:00Z'),
('reg-3', 'stu-3', 'kor-basic', 'active', '2026-05-01T10:00:00Z');

-- Seed system settings
insert into system_settings (key, value) values
('locked', 'false'::jsonb),
('deadline', '"2026-05-30T23:59:00"'::jsonb),
('correctionOpen', '"2026-05-01T00:00:00"'::jsonb),
('correctionClose', '"2026-05-30T23:59:00"'::jsonb);

-- Seed admins
insert into admins (id, email, password, name, role) values
('admin-1', 'admin@etoos247.kr', 'admin1234', '관리자', 'admin'),
('admin-2', 'super@etoos247.kr', 'super1234', '최고관리자', 'super_admin');
