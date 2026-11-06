-- Patch 07: a "listen" link for every piece in the teacher's library (YouTube or any recording).
alter table public.library add column if not exists yt_url text not null default '';
alter table public.library drop constraint if exists library_yt_len;
alter table public.library add constraint library_yt_len check (length(yt_url) <= 300);
