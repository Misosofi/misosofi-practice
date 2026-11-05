-- Patch 03: visiting classmates' rooms.
-- Only students of the same teacher, only when a parent has switched visits on (and the teacher has not switched them off).
-- Every step is a small music question in the app: ring the bell (hear the doorbell notes), open the door (a music word),
-- step inside (read a note). One try per friend per day. Visitors can only look and leave a stamp.

create table if not exists public.visit_settings (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  allowed boolean not null default false,        -- set by the parent (in the student's app, after re-entering the password)
  teacher_off boolean not null default false,    -- the teacher can switch a student's visits off
  updated_at timestamptz not null default now()
);
alter table public.visit_settings enable row level security;
drop policy if exists "visit settings read" on public.visit_settings;
create policy "visit settings read" on public.visit_settings for select
  using (student_id = auth.uid() or public.is_teacher_of(student_id));
-- writes only through the functions below

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  status text not null default 'rung' check (status in ('rung','open','closed','inside','stuck')),
  stamp text not null default '' check (length(stamp) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_id, to_id, day),
  check (from_id <> to_id)
);
create index if not exists visits_to on public.visits(to_id, day);
create index if not exists visits_from on public.visits(from_id, day);
alter table public.visits enable row level security;
drop policy if exists "visits read" on public.visits;
create policy "visits read" on public.visits for select
  using (from_id = auth.uid() or to_id = auth.uid() or public.is_teacher_of(from_id));
-- writes only through the functions below

create or replace function public.can_visit(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles pa join profiles pb on pa.teacher_id = pb.teacher_id
    join visit_settings sa on sa.student_id = pa.id join visit_settings sb on sb.student_id = pb.id
    where pa.id = a and pb.id = b and pa.teacher_id is not null and pa.role = 'student' and pb.role = 'student'
      and sa.allowed and not sa.teacher_off and sb.allowed and not sb.teacher_off);
$$;

-- the parent switches visits on or off
create or replace function public.set_visiting(on_ boolean) returns void
language sql security definer set search_path = public as $$
  insert into visit_settings (student_id, allowed, updated_at) values (auth.uid(), on_, now())
  on conflict (student_id) do update set allowed = excluded.allowed, updated_at = now();
$$;
-- the teacher switches a student's visits off (or back on)
create or replace function public.teacher_set_visiting(student uuid, off_ boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_teacher_of(student) then raise exception 'Not your student'; end if;
  insert into visit_settings (student_id, teacher_off, updated_at) values (student, off_, now())
  on conflict (student_id) do update set teacher_off = excluded.teacher_off, updated_at = now();
end $$;

-- classmates who can be visited: name and character only
create or replace function public.classmates() returns table (id uuid, name text, avatar jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, coalesce(s.data->'avatar', '{}'::jsonb)
  from profiles p left join student_state s on s.student_id = p.id
  where p.id <> auth.uid() and public.can_visit(auth.uid(), p.id)
  order by p.display_name;
$$;

-- my visits from the last 3 days (as visitor and as host), with the other child's name and character
create or replace function public.my_visits() returns table (id uuid, from_id uuid, to_id uuid, day date, status text, stamp text, other_name text, other_avatar jsonb, mine boolean)
language sql stable security definer set search_path = public as $$
  select v.id, v.from_id, v.to_id, v.day, v.status, v.stamp, p.display_name, coalesce(s.data->'avatar', '{}'::jsonb), v.from_id = auth.uid()
  from visits v
  join profiles p on p.id = case when v.from_id = auth.uid() then v.to_id else v.from_id end
  left join student_state s on s.student_id = p.id
  where (v.from_id = auth.uid() or v.to_id = auth.uid()) and v.day >= current_date - 2
  order by v.created_at desc;
$$;

-- 1) the visitor rang the bell (after naming the doorbell notes correctly)
create or replace function public.ring_bell(target uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare vid uuid;
begin
  if not public.can_visit(auth.uid(), target) then raise exception 'Visits are not switched on'; end if;
  if (select count(*) from visits where from_id = auth.uid() and day = current_date) >= 5 then raise exception 'That is enough visits for today'; end if;
  insert into visits (from_id, to_id) values (auth.uid(), target) returning id into vid;
  return vid;
exception when unique_violation then raise exception 'You already rang today';
end $$;

-- 2) the host answered the door question: right = open, wrong = closed for today
create or replace function public.answer_door(visit uuid, ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update visits set status = case when ok then 'open' else 'closed' end, updated_at = now()
  where id = visit and to_id = auth.uid() and status = 'rung' and day >= current_date - 1;
  if not found then raise exception 'This visit cannot be answered'; end if;
end $$;

-- 3) the visitor answered the step-inside question: right = inside, wrong = stuck at the door today
create or replace function public.step_in(visit uuid, ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update visits set status = case when ok then 'inside' else 'stuck' end, updated_at = now()
  where id = visit and from_id = auth.uid() and status = 'open';
  if not found then raise exception 'The door is not open'; end if;
end $$;

-- the friend's room, only for a visitor who is inside (looking only)
create or replace function public.friend_room(visit uuid) returns table (name text, avatar jsonb, room jsonb, stars int)
language sql stable security definer set search_path = public as $$
  select p.display_name, coalesce(s.data->'avatar','{}'::jsonb), coalesce(s.data->'room','{}'::jsonb), coalesce((s.data->>'stars')::int, 0)
  from visits v join profiles p on p.id = v.to_id left join student_state s on s.student_id = v.to_id
  where v.id = visit and v.from_id = auth.uid() and v.status = 'inside' and v.day >= current_date - 2;
$$;

-- the visitor leaves one stamp
create or replace function public.leave_stamp(visit uuid, st text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if st not in ('heart','star','note','clap','smile') then raise exception 'Unknown stamp'; end if;
  update visits set stamp = st, updated_at = now() where id = visit and from_id = auth.uid() and status = 'inside';
  if not found then raise exception 'Not inside'; end if;
end $$;

revoke all on function public.can_visit(uuid,uuid), public.set_visiting(boolean), public.teacher_set_visiting(uuid,boolean),
  public.classmates(), public.my_visits(), public.ring_bell(uuid), public.answer_door(uuid,boolean), public.step_in(uuid,boolean),
  public.friend_room(uuid), public.leave_stamp(uuid,text) from public;
grant execute on function public.set_visiting(boolean), public.teacher_set_visiting(uuid,boolean),
  public.classmates(), public.my_visits(), public.ring_bell(uuid), public.answer_door(uuid,boolean), public.step_in(uuid,boolean),
  public.friend_room(uuid), public.leave_stamp(uuid,text) to authenticated;
revoke all on function public.can_visit(uuid,uuid), public.set_visiting(boolean), public.teacher_set_visiting(uuid,boolean),
  public.classmates(), public.my_visits(), public.ring_bell(uuid), public.answer_door(uuid,boolean), public.step_in(uuid,boolean),
  public.friend_room(uuid), public.leave_stamp(uuid,text) from anon;
