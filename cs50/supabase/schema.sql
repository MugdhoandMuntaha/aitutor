-- ==========================================================================
-- HARVARD UNIVERSITY SEAS - CSE RESULT PUBLICATION PORTAL
-- SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

-- 1. PROFILES TABLE (Links to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('admin', 'student')) default 'student',
  student_id text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. STUDENTS TABLE (Official Roster)
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  student_id text unique not null,
  name text not null,
  email text,
  batch text default 'Class of 2027 (Freshman)',
  current_semester int default 1,
  concentration text default 'Computer Science & Engineering',
  advisor text default 'Prof. David J. Malan (SEAS)',
  academic_status text default 'Active - Regular Good Standing',
  avatar text,
  created_at timestamptz default now()
);

-- 3. STUDENT SEMESTERS TABLE (Publication Status per Term)
create table if not exists public.student_semesters (
  id uuid default gen_random_uuid() primary key,
  student_id text not null references public.students(student_id) on delete cascade,
  semester_number int not null,
  term text not null,
  is_published boolean default false,
  publish_date text,
  created_at timestamptz default now(),
  unique(student_id, semester_number)
);

-- 4. COURSE RESULTS TABLE (Course-by-Course Marks)
create table if not exists public.course_results (
  id uuid default gen_random_uuid() primary key,
  student_id text not null references public.students(student_id) on delete cascade,
  semester_number int not null,
  course_code text not null,
  credits numeric default 4.0,
  marks numeric default 0.0,
  created_at timestamptz default now(),
  unique(student_id, semester_number, course_code)
);

-- 5. CURRICULUM COURSES TABLE (Harvard 8-Semester CS Syllabus)
create table if not exists public.curriculum_courses (
  id uuid default gen_random_uuid() primary key,
  semester int not null,
  code text unique not null,
  title text not null,
  department text default 'Computer Science',
  credits numeric default 4.0,
  category text not null,
  prerequisites text default 'None',
  description text,
  created_at timestamptz default now()
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.student_semesters enable row level security;
alter table public.course_results enable row level security;
alter table public.curriculum_courses enable row level security;

-- Helper function: check if authenticated user is Admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES POLICIES
create policy "Users can view their own profile or admins can view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "Insert profile during signup"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- STUDENTS POLICIES
create policy "Allow read access to students"
  on public.students for select
  using (true);

create policy "Admins can manage students"
  on public.students for all
  using (public.is_admin());

-- SEMESTERS POLICIES
create policy "Read published semesters or admin read all"
  on public.student_semesters for select
  using (is_published = true or public.is_admin());

create policy "Admins can manage semesters"
  on public.student_semesters for all
  using (public.is_admin());

-- RESULTS POLICIES
create policy "Read results of published semesters or admin read all"
  on public.course_results for select
  using (
    public.is_admin() or exists (
      select 1 from public.student_semesters s
      where s.student_id = course_results.student_id
        and s.semester_number = course_results.semester_number
        and s.is_published = true
    )
  );

create policy "Admins can manage course results"
  on public.course_results for all
  using (public.is_admin());

-- CURRICULUM POLICIES
create policy "Curriculum is public readable"
  on public.curriculum_courses for select
  using (true);

create policy "Admins can edit curriculum"
  on public.curriculum_courses for all
  using (public.is_admin());

-- Automatic profile creation on auth.users signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role, student_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'student_id', null)
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
