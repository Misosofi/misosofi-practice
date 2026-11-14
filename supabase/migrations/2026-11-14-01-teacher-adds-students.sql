-- The teacher registers a student herself (name only) and gets a login code / QR.
-- The student's device just scans the QR: no e-mail, no password, no confirmation mail for the family.
-- A parent agrees once on the device (stored in the student's own state by the app).
--
-- How it works: a real login is made for the student with an internal address
-- s-xxxxxxxx@students.misosofi.app (never mailed) and the login code as password.
-- Only a teacher can do this, only for her own students, and the code can be renewed (the old QR stops working).

create table if not exists public.student_logins (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  login_email text not null unique,
  code text not null,
  created_at timestamptz not null default now()
);
alter table public.student_logins enable row level security;
drop policy if exists "teacher reads her student logins" on public.student_logins;
create policy "teacher reads her student logins" on public.student_logins for select using (teacher_id = auth.uid());

-- a readable login code: 12 letters/digits without look-alikes (no 0/O, 1/I/L)
create or replace function public._login_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(12); r text := ''; i int;
begin
  for i in 0..11 loop r := r || substr(a, 1 + (get_byte(b, i) % length(a)), 1); end loop;
  return r;
end $$;
revoke all on function public._login_code() from public;

create or replace function public.teacher_add_student(p_name text, p_grade int default 1)
returns json language plpgsql security definer set search_path = public, extensions, auth as $$
declare me uuid := auth.uid(); uid uuid := gen_random_uuid(); v_code text := public._login_code(); v_em text; nm text := left(btrim(coalesce(p_name, '')), 40);
begin
  if me is null or not exists (select 1 from public.profiles where id = me and role = 'teacher') then raise exception 'Only a teacher can add students'; end if;
  if nm = '' then raise exception 'Please write the name'; end if;
  v_em := 's-' || replace(left(uid::text, 13), '-', '') || '@students.misosofi.app';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', v_em, extensions.crypt(v_code, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', nm, 'by_teacher', true), now(), now(),
    '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', v_em, 'email_verified', true), 'email', uid::text, now(), now(), now());
  -- the profile row was made by the on_auth_user_created trigger; connect it to this teacher
  update public.profiles set teacher_id = me, grade = greatest(0, least(8, coalesce(p_grade, 1))) where id = uid;
  insert into public.student_logins (student_id, teacher_id, login_email, code) values (uid, me, v_em, v_code);
  return json_build_object('id', uid, 'email', v_em, 'code', v_code, 'name', nm);
end $$;
revoke all on function public.teacher_add_student(text, int) from public;
grant execute on function public.teacher_add_student(text, int) to authenticated;

-- a new code (lost phone, new iPad…): the old QR stops working
create or replace function public.teacher_new_code(p_student uuid)
returns json language plpgsql security definer set search_path = public, extensions, auth as $$
declare me uuid := auth.uid(); v_code text := public._login_code(); v_em text;
begin
  select login_email into v_em from public.student_logins where student_id = p_student and teacher_id = me;
  if v_em is null or not exists (select 1 from public.profiles where id = p_student and teacher_id = me) then raise exception 'Not your student'; end if;
  update auth.users set encrypted_password = extensions.crypt(v_code, extensions.gen_salt('bf')), updated_at = now() where id = p_student and email = v_em;
  update public.student_logins set code = v_code, created_at = now() where student_id = p_student;
  return json_build_object('id', p_student, 'email', v_em, 'code', v_code);
end $$;
revoke all on function public.teacher_new_code(uuid) from public;
grant execute on function public.teacher_new_code(uuid) to authenticated;

-- the device turns a code into its login address (the code is the secret; this only says which login it belongs to)
create or replace function public.login_for_code(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select login_email from public.student_logins where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;
revoke all on function public.login_for_code(text) from public;
grant execute on function public.login_for_code(text) to anon, authenticated;
