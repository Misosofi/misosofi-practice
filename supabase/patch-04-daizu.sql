-- Patch 04: "Send Daizu" — a child spends coins to send Daizu the cat to a classmate (same rules as visits: same teacher,
-- both parents switched visits on). Daizu sneaks in, sings a flamenco "I'm hungry" song and asks for food.
-- Fed: a kiss and goodbye. Not fed: Daizu stomps off. One Daizu per sender per day. Needs patch 03 first.

create table if not exists public.daizu_trips (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  status text not null default 'sent' check (status in ('sent','fed','angry')),
  food text not null default '' check (length(food) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_id, day),
  check (from_id <> to_id)
);
create index if not exists daizu_to on public.daizu_trips(to_id, status);
alter table public.daizu_trips enable row level security;
drop policy if exists "daizu read" on public.daizu_trips;
create policy "daizu read" on public.daizu_trips for select
  using (from_id = auth.uid() or to_id = auth.uid() or public.is_teacher_of(from_id));

create or replace function public.send_daizu(target uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if not public.can_visit(auth.uid(), target) then raise exception 'Visits are not switched on'; end if;
  insert into daizu_trips (from_id, to_id) values (auth.uid(), target) returning id into tid;
  return tid;
exception when unique_violation then raise exception 'Daizu already went out today';
end $$;

create or replace function public.daizu_mine() returns table (id uuid, day date, status text, food text, other_name text, other_avatar jsonb, mine boolean)
language sql stable security definer set search_path = public as $$
  select t.id, t.day, t.status, t.food, p.display_name, coalesce(s.data->'avatar','{}'::jsonb), t.from_id = auth.uid()
  from daizu_trips t
  join profiles p on p.id = case when t.from_id = auth.uid() then t.to_id else t.from_id end
  left join student_state s on s.student_id = p.id
  where (t.from_id = auth.uid() or t.to_id = auth.uid()) and (t.day >= current_date - 2 or (t.to_id = auth.uid() and t.status = 'sent' and t.day >= current_date - 7))
  order by t.created_at desc;
$$;

create or replace function public.daizu_answer(trip uuid, fed boolean, food_ text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update daizu_trips set status = case when fed then 'fed' else 'angry' end, food = left(coalesce(food_, ''), 30), updated_at = now()
  where id = trip and to_id = auth.uid() and status = 'sent';
  if not found then raise exception 'Daizu has already left'; end if;
end $$;

revoke all on function public.send_daizu(uuid), public.daizu_mine(), public.daizu_answer(uuid,boolean,text) from public, anon;
grant execute on function public.send_daizu(uuid), public.daizu_mine(), public.daizu_answer(uuid,boolean,text) to authenticated;
