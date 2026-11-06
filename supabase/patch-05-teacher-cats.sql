-- Patch 05: cats between the teacher and the students (needs patches 03 and 04).
-- Teacher -> own student: a reward cat with a short message (free, no visit permission needed).
-- Student -> own teacher: a "thank you / I practised" cat with a short message. The teacher answers with a kiss (thank you).
-- Between classmates the old rules stay: same teacher, both parents switched visits on, each cat once a day.

alter table public.daizu_trips add column if not exists msg text not null default '';
alter table public.daizu_trips drop constraint if exists daizu_trips_msg_len;
alter table public.daizu_trips add constraint daizu_trips_msg_len check (length(msg) <= 80);
-- the teacher can send the same cat to several students on one day, so "once a day" now counts per receiver
alter table public.daizu_trips drop constraint if exists daizu_trips_from_id_day_cat_key;
create unique index if not exists daizu_once on public.daizu_trips(from_id, to_id, day, cat);

create or replace function public.send_cat(target uuid, cat_ text, msg_ text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid; me uuid := auth.uid(); t uuid := public.my_teacher();
begin
  if public.is_teacher_of(target) then
    null;                                            -- teacher -> own student
  elsif t is not null and target = t then
    null;                                            -- student -> own teacher
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

-- old app versions keep working
create or replace function public.send_daizu(target uuid, cat_ text) returns uuid
language sql security definer set search_path = public as $$ select public.send_cat(target, cat_, ''); $$;

create or replace function public.cats_mine() returns table (id uuid, day date, cat text, status text, food text, msg text, other_id uuid, other_name text, other_avatar jsonb, other_role text, mine boolean)
language sql stable security definer set search_path = public as $$
  select t.id, t.day, t.cat, t.status, t.food, t.msg, p.id, p.display_name, coalesce(s.data->'avatar','{}'::jsonb), p.role, t.from_id = auth.uid()
  from daizu_trips t
  join profiles p on p.id = case when t.from_id = auth.uid() then t.to_id else t.from_id end
  left join student_state s on s.student_id = p.id
  where (t.from_id = auth.uid() or t.to_id = auth.uid()) and (t.day >= current_date - 2 or (t.to_id = auth.uid() and t.status = 'sent' and t.day >= current_date - 7))
  order by t.created_at desc;
$$;

revoke all on function public.send_cat(uuid,text,text), public.cats_mine() from public, anon;
grant execute on function public.send_cat(uuid,text,text), public.cats_mine() to authenticated;
