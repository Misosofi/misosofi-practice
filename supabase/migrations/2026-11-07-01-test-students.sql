-- Test students made without the invite link: confirm their email (the confirmation mail never arrived)
-- and connect them to the teacher. Only touches the two test accounts by their display names.
update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now())
where id in (select id from public.profiles where role = 'student' and display_name in ('Daizu', '大豆'));
update public.profiles set teacher_id = (select id from public.profiles where role = 'teacher' and display_name = 'Atsuko' limit 1)
where role = 'student' and teacher_id is null and display_name in ('Daizu', '大豆');
