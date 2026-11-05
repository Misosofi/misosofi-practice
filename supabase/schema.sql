-- Misosofi Practice Log: database setup (v1)
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.
-- Safe to run once on a new project.

-- ---------- people ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('teacher','student')),
  display_name text not null default '',
  teacher_id uuid references public.profiles(id) on delete set null,
  plan text not null default 'free' check (plan in ('free','coach')),
  grade int not null default 1 check (grade between 0 and 8),
  created_at timestamptz not null default now()
);

-- the student's own game state: avatar, look, coins, stars, quest progress, drills, goals ...
create table if not exists public.student_state (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- teacher's private library (scores never leave this teacher's students) ----------
create table if not exists public.library (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  composer text not null default '',
  grade int not null default 0,
  label text not null default '',
  score_path text,            -- file in the private 'scores' bucket: <teacher_id>/<file>
  created_at timestamptz not null default now()
);

-- ---------- a student's pieces ----------
create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  library_id uuid references public.library(id) on delete set null,
  title text not null,
  composer text not null default '',
  status text not null default 'learning' check (status in ('learning','polishing','ready')),
  seconds numeric not null default 0,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- weekly homework (teacher tasks are locked for the student; students add their own) ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  week date not null,
  area text not null default 'other' check (area in ('piece','sight','nr','tech','solf','ear','theory','other')),
  title text not null,
  piece_id uuid references public.pieces(id) on delete set null,
  source text not null default 'teacher' check (source in ('teacher','student')),
  done_days date[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- practice time, exact seconds, one row per student per day ----------
create table if not exists public.practice_days (
  student_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  seconds numeric not null default 0,
  piece_seconds jsonb not null default '{}'::jsonb,
  feel text,
  note text not null default '',
  primary key (student_id, day)
);

-- ---------- recordings and videos (uploaded only for the coaching plan; auto-deleted after 30 days) ----------
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'audio' check (kind in ('audio','video')),
  path text not null,         -- file in the private 'recordings' bucket: <student_id>/<file>
  seconds numeric not null default 0,
  piece_id uuid references public.pieces(id) on delete set null,
  listened boolean not null default false,
  heart boolean not null default false,
  comment text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- rewards the teacher offers, and what students bought ----------
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  price int not null check (price > 0)
);
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  price int not null,
  given boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- settings: how many days recordings are kept ----------
create table if not exists public.teacher_settings (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  keep_recordings_days int not null default 30 check (keep_recordings_days in (7,14,30))
);

create index if not exists tasks_student_week on public.tasks(student_id, week);
create index if not exists pieces_student on public.pieces(student_id);
create index if not exists rec_student on public.recordings(student_id, created_at);
create index if not exists lib_teacher on public.library(teacher_id);
create index if not exists profiles_teacher on public.profiles(teacher_id);

-- ---------- who may see what ----------
create or replace function public.is_teacher_of(student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = student and teacher_id = auth.uid());
$$;
create or replace function public.my_teacher() returns uuid
language sql stable security definer set search_path = public as $$
  select teacher_id from profiles where id = auth.uid();
$$;
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher');
$$;

alter table public.profiles enable row level security;
alter table public.student_state enable row level security;
alter table public.library enable row level security;
alter table public.pieces enable row level security;
alter table public.tasks enable row level security;
alter table public.practice_days enable row level security;
alter table public.recordings enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.teacher_settings enable row level security;

-- profiles: you see yourself, your teacher, and (as teacher) your students
create policy "profiles read" on public.profiles for select using (
  id = auth.uid() or id = public.my_teacher() or teacher_id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));
create policy "teacher updates students" on public.profiles for update using (teacher_id = auth.uid());

-- student-owned rows: the student and their teacher
create policy "state rw" on public.student_state for all
  using (student_id = auth.uid() or public.is_teacher_of(student_id))
  with check (student_id = auth.uid() or public.is_teacher_of(student_id));
create policy "pieces rw" on public.pieces for all
  using (student_id = auth.uid() or public.is_teacher_of(student_id))
  with check (student_id = auth.uid() or public.is_teacher_of(student_id));
create policy "days rw" on public.practice_days for all
  using (student_id = auth.uid() or public.is_teacher_of(student_id))
  with check (student_id = auth.uid() or public.is_teacher_of(student_id));
create policy "recordings rw" on public.recordings for all
  using (student_id = auth.uid() or public.is_teacher_of(student_id))
  with check (student_id = auth.uid() or public.is_teacher_of(student_id));
create policy "redemptions rw" on public.redemptions for all
  using (student_id = auth.uid() or public.is_teacher_of(student_id))
  with check (student_id = auth.uid() or public.is_teacher_of(student_id));

-- tasks: everyone involved can read; students may only add/remove/tick their own,
-- and may tick (but not delete or edit) their teacher's tasks
create policy "tasks read" on public.tasks for select
  using (student_id = auth.uid() or public.is_teacher_of(student_id));
create policy "tasks teacher write" on public.tasks for all
  using (public.is_teacher_of(student_id)) with check (public.is_teacher_of(student_id));
create policy "tasks student insert" on public.tasks for insert
  with check (student_id = auth.uid() and source = 'student');
create policy "tasks student delete own" on public.tasks for delete
  using (student_id = auth.uid() and source = 'student');
create policy "tasks student tick" on public.tasks for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create or replace function public.tasks_student_tick_only() returns trigger
language plpgsql as $$
begin
  if new.student_id = auth.uid() and old.source = 'teacher'
     and (new.title, new.area, new.piece_id, new.week, new.source) is distinct from (old.title, old.area, old.piece_id, old.week, old.source) then
    raise exception 'Students can only tick teacher tasks';
  end if;
  return new;
end $$;
drop trigger if exists tasks_tick_only on public.tasks;
create trigger tasks_tick_only before update on public.tasks for each row execute function public.tasks_student_tick_only();

-- library and rewards: the teacher manages them; their students can read them
create policy "library teacher" on public.library for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "library students read" on public.library for select
  using (teacher_id = public.my_teacher());
create policy "rewards teacher" on public.rewards for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "rewards students read" on public.rewards for select
  using (teacher_id = public.my_teacher());
create policy "settings teacher" on public.teacher_settings for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- new sign-ups get a profile automatically
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  insert into public.student_state (student_id) values (new.id);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- private file buckets ----------
insert into storage.buckets (id, name, public) values ('scores','scores', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('recordings','recordings', false) on conflict (id) do nothing;

-- scores: <teacher_id>/<file>. Teacher writes; the teacher's students read.
create policy "scores teacher write" on storage.objects for all
  using (bucket_id = 'scores' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'scores' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "scores students read" on storage.objects for select
  using (bucket_id = 'scores' and (storage.foldername(name))[1] = public.my_teacher()::text);
-- recordings: <student_id>/<file>. Student writes; student and teacher read.
create policy "recordings student write" on storage.objects for insert
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recordings read" on storage.objects for select
  using (bucket_id = 'recordings' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.is_teacher_of(((storage.foldername(name))[1])::uuid)));
create policy "recordings delete" on storage.objects for delete
  using (bucket_id = 'recordings' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.is_teacher_of(((storage.foldername(name))[1])::uuid)));
