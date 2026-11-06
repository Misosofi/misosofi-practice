-- Patch 06: the teacher's rules for visits and cats (needs patches 03–05).
-- 1) Each teacher chooses whether students may send cats to them (off by default).
-- 2) Each teacher writes a note for parents (e.g. "we are not responsible for trouble between students").
--    A parent must agree to it before visits can be switched on; the agreement is stored with the date.
-- 3) Parents can see everything their child did with classmates and the teacher (visits, stamps, cats, messages).

alter table public.teacher_settings add column if not exists cats_from_students boolean not null default false;
alter table public.teacher_settings add column if not exists visit_terms text not null default '';
alter table public.teacher_settings drop constraint if exists teacher_settings_terms_len;
alter table public.teacher_settings add constraint teacher_settings_terms_len check (length(visit_terms) <= 2000);

alter table public.visit_settings add column if not exists agreed_at timestamptz;
alter table public.visit_settings add column if not exists agreed_terms text not null default '';

-- what a student's app needs to know about the teacher's rules
create or replace function public.my_teacher_info() returns table (takes_cats boolean, terms text)
language sql stable security definer set search_path = public as $$
  select coalesce(ts.cats_from_students, false), coalesce(ts.visit_terms, '')
  from (select public.my_teacher() as tid) x left join teacher_settings ts on ts.teacher_id = x.tid;
$$;

-- the parent agrees to the teacher's note (stored with the exact text and the time)
create or replace function public.agree_visits(terms_ text) returns void
language sql security definer set search_path = public as $$
  insert into visit_settings (student_id, agreed_at, agreed_terms, updated_at) values (auth.uid(), now(), left(coalesce(terms_, ''), 2000), now())
  on conflict (student_id) do update set agreed_at = now(), agreed_terms = excluded.agreed_terms, updated_at = now();
$$;

-- switching visits on now needs the parent's agreement first
create or replace function public.set_visiting(on_ boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if on_ and not exists (select 1 from visit_settings where student_id = auth.uid() and agreed_at is not null) then
    raise exception 'A parent must agree to the rules first';
  end if;
  insert into visit_settings (student_id, allowed, updated_at) values (auth.uid(), on_, now())
  on conflict (student_id) do update set allowed = excluded.allowed, updated_at = now();
end $$;

-- cats to the teacher only if the teacher allows it
create or replace function public.send_cat(target uuid, cat_ text, msg_ text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid; me uuid := auth.uid(); t uuid := public.my_teacher();
begin
  if public.is_teacher_of(target) then
    null;                                            -- teacher -> own student
  elsif t is not null and target = t then            -- student -> own teacher
    if not exists (select 1 from teacher_settings where teacher_id = t and cats_from_students) then
      raise exception 'Your teacher is not taking cats';
    end if;
  elsif public.can_visit(me, target) then            -- student -> classmate
    if exists (select 1 from daizu_trips where from_id = me and day = current_date and cat = cat_ and to_id is distinct from t) then
      raise exception 'This cat already went out today';
    end if;
  else
    raise exception 'Visits are not switched on';
  end if;
  insert into daizu_trips (from_id, to_id, cat, msg) values (me, target, cat_, left(coalesce(msg_, ''), 80)) returning id into tid;
  return tid;
exception when unique_violation then raise exception 'This cat already went out today';
end $$;

-- for parents: everything of the last 90 days
create or replace function public.family_log() returns table (kind text, at timestamptz, mine boolean, other_name text, other_role text, status text, detail text, msg text)
language sql stable security definer set search_path = public as $$
  select 'visit', v.created_at, v.from_id = auth.uid(), p.display_name, p.role, v.status, v.stamp, ''
  from visits v join profiles p on p.id = case when v.from_id = auth.uid() then v.to_id else v.from_id end
  where (v.from_id = auth.uid() or v.to_id = auth.uid()) and v.day >= current_date - 90
  union all
  select 'cat', t.created_at, t.from_id = auth.uid(), p.display_name, p.role, t.status, t.cat || case when t.food <> '' then ':' || t.food else '' end, t.msg
  from daizu_trips t join profiles p on p.id = case when t.from_id = auth.uid() then t.to_id else t.from_id end
  where (t.from_id = auth.uid() or t.to_id = auth.uid()) and t.day >= current_date - 90
  order by 2 desc;
$$;

revoke all on function public.my_teacher_info(), public.agree_visits(text), public.family_log() from public, anon;
grant execute on function public.my_teacher_info(), public.agree_visits(text), public.family_log() to authenticated;
