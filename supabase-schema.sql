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
  "seasonId" text not null default 'season-3',
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
insert into courses (id, code, "seasonId", subject, title, instructor, level, credits, capacity, enrolled, meetings, summary) values
('kor-basic', 'KOR-101', 'season-3', '국어', '독서 기본기 회복', '정하늘', '3-4등급', 2, 24, 0, '[{"day": "월", "block": "A", "time": "08:20-10:00"}, {"day": "수", "block": "A", "time": "08:20-10:00"}]'::jsonb, '지문 구조 읽기와 선지 판단 루틴을 반복합니다.'),
('math-basic', 'MAT-201', 'season-3', '수학', '수학 공통 개념 압축', '한도윤', '4등급 이하', 2, 20, 0, '[{"day": "월", "block": "B", "time": "10:20-12:00"}, {"day": "목", "block": "A", "time": "08:20-10:00"}]'::jsonb, '수1, 수2의 빈출 개념을 문제 풀이 흐름으로 정리합니다.'),
('eng-reading', 'ENG-110', 'season-3', '영어', '영어 빈칸과 순서', '오유진', '2-3등급', 2, 28, 0, '[{"day": "화", "block": "B", "time": "10:20-12:00"}, {"day": "목", "block": "B", "time": "10:20-12:00"}]'::jsonb, '논리 연결어와 문장 기능을 기준으로 고난도 유형을 풉니다.'),
('math-advanced', 'MAT-330', 'season-3', '수학', '미적분 실전 N제', '강서준', '1-2등급', 2, 18, 0, '[{"day": "화", "block": "C", "time": "14:30-16:10"}, {"day": "금", "block": "C", "time": "14:30-16:10"}]'::jsonb, '준킬러와 킬러 문항의 발상 전환을 훈련합니다.'),
('science-life', 'SCI-210', 'season-3', '과학탐구', '생명과학 도표 특강', '문채원', '전체', 1, 30, 0, '[{"day": "수", "block": "D", "time": "16:30-18:10"}]'::jsonb, '유전, 신경, 항상성 도표를 시간 안에 처리하는 강좌입니다.'),
('social-culture', 'SOC-120', 'season-3', '사회탐구', '사회문화 자료 분석', '서지윤', '전체', 1, 30, 0, '[{"day": "목", "block": "D", "time": "16:30-18:10"}]'::jsonb, '표, 그래프, 개념 비교 문항을 빠르게 분류하고 풉니다.'),
('kor-literature', 'KOR-240', 'season-3', '국어', '문학 선지 감각', '백소은', '전체', 1, 26, 0, '[{"day": "금", "block": "B", "time": "10:20-12:00"}]'::jsonb, '작품 암기가 아니라 표현과 정서의 판단 기준을 세웁니다.');

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

-- 6. Add database constraints to prevent seat leaks
alter table courses add constraint enrolled_capacity_check check (enrolled <= capacity);

-- 7. Course Registration RPC Function
create or replace function register_for_course(p_student_id text, p_course_id text)
returns boolean as $$
declare
  v_enrolled integer;
  v_capacity integer;
  v_exists boolean;
  v_reg_id text;
begin
  -- Lock the corresponding course row to prevent concurrent registration over-allocation
  select enrolled, capacity into v_enrolled, v_capacity
  from courses
  where id = p_course_id
  for update;

  if not found then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  -- Checks if enrolled < capacity. If not, raises an exception with SQLSTATE 'ERR90' and message 'CAPACITY_EXCEEDED'.
  if v_enrolled >= v_capacity then
    raise exception 'CAPACITY_EXCEEDED' using errcode = 'ERR90';
  end if;

  -- Checks if this registration already exists actively. If so, raises 'ALREADY_REGISTERED'.
  select exists(
    select 1 from registrations
    where student_id = p_student_id
      and course_id = p_course_id
      and status = 'active'
  ) into v_exists;

  if v_exists then
    raise exception 'ALREADY_REGISTERED';
  end if;

  -- Generates a registration ID and inserts a record into the registrations table with status = 'active'
  v_reg_id := 'reg-' || uuid_generate_v4()::text;
  
  insert into registrations (id, student_id, course_id, status, created_at)
  values (v_reg_id, p_student_id, p_course_id, 'active', now());

  return true;
end;
$$ language plpgsql security definer;

-- 8. Audit Logging System
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id text,
  action_type text not null,
  target_student_id text,
  details jsonb not null,
  created_at timestamp with time zone default now()
);

-- Trigger function to automatically log changes made by admins
create or replace function log_admin_modification()
returns trigger as $$
declare
  v_admin_id text;
  v_target_student_id text;
  v_action_type text;
  v_details jsonb;
begin
  -- Try to get current admin ID from custom session setting (e.g. app.current_admin_id)
  -- Or from Supabase auth.jwt() claims
  begin
    v_admin_id := current_setting('app.current_admin_id', true);
  exception when others then
    v_admin_id := null;
  end;

  if v_admin_id is null or v_admin_id = '' then
    begin
      -- Try to get it from request.jwt.claims (Supabase auth context)
      v_admin_id := current_setting('request.jwt.claims', true)::jsonb ->> 'sub';
    exception when others then
      v_admin_id := null;
    end;
  end if;

  -- Default to current_user if not authenticated via JWT (e.g. direct SQL admin tool)
  if v_admin_id is null then
    v_admin_id := current_user;
  end if;

  -- Set action type: e.g., 'students.insert', 'courses.update'
  v_action_type := TG_TABLE_NAME || '.' || lower(TG_OP);

  -- Determine target student ID if applicable
  if TG_TABLE_NAME = 'students' then
    if TG_OP = 'DELETE' then
      v_target_student_id := OLD.id;
    else
      v_target_student_id := NEW.id;
    end if;
  elsif TG_TABLE_NAME = 'registrations' or TG_TABLE_NAME = 'individual_openings' then
    if TG_OP = 'DELETE' then
      v_target_student_id := OLD.student_id;
    else
      v_target_student_id := NEW.student_id;
    end if;
  else
    v_target_student_id := null;
  end if;

  -- Capture change details
  if TG_OP = 'INSERT' then
    v_details := jsonb_build_object('new', to_jsonb(NEW));
  elsif TG_OP = 'UPDATE' then
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  elsif TG_OP = 'DELETE' then
    v_details := jsonb_build_object('old', to_jsonb(OLD));
  end if;

  -- Log modifications
  insert into audit_logs (admin_id, action_type, target_student_id, details)
  values (v_admin_id, v_action_type, v_target_student_id, v_details);

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Attach triggers to relevant tables to audit manual administrator modifications
create trigger audit_students_trigger
after insert or update or delete on students
for each row execute function log_admin_modification();

create trigger audit_courses_trigger
after insert or update or delete on courses
for each row execute function log_admin_modification();

create trigger audit_registrations_trigger
after insert or update or delete on registrations
for each row execute function log_admin_modification();

create trigger audit_individual_openings_trigger
after insert or update or delete on individual_openings
for each row execute function log_admin_modification();

create trigger audit_system_settings_trigger
after insert or update or delete on system_settings
for each row execute function log_admin_modification();

-- 9. Configure replica identities to FULL to enable realtime updates
alter table courses replica identity full;
alter table registrations replica identity full;
