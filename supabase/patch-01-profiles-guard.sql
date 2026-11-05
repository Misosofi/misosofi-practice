-- Patch 01: students may only change their name and join a teacher once;
-- teachers may change their students' grade and plan, and remove a student from the class.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;            -- admin (SQL editor)
  if new.role is distinct from old.role then
    raise exception 'Only the admin can change roles';
  end if;
  if new.id = auth.uid() and old.role = 'student' then
    if (new.plan, new.grade) is distinct from (old.plan, old.grade) then
      raise exception 'Only your teacher can change this';
    end if;
    if old.teacher_id is not null and new.teacher_id is distinct from old.teacher_id then
      raise exception 'Ask your teacher to change classes';
    end if;
    if new.teacher_id is not null and old.teacher_id is null
       and not exists (select 1 from profiles where id = new.teacher_id and role = 'teacher') then
      raise exception 'This invite link is not valid';
    end if;
  elsif old.teacher_id = auth.uid() then
    if new.teacher_id is not null and new.teacher_id <> auth.uid() then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

drop policy if exists "teacher updates students" on public.profiles;
create policy "teacher updates students" on public.profiles for update
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- a teacher removes a student from the class
create or replace function public.remove_student(student uuid) returns void
language sql security definer set search_path = public as $$
  update profiles set teacher_id = null where id = student and teacher_id = auth.uid();
$$;
revoke all on function public.remove_student(uuid) from public;
grant execute on function public.remove_student(uuid) to authenticated;
