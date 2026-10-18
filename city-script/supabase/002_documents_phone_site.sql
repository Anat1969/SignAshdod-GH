-- הוחל על ASHDODMAP באישור ענת ("בנה את כל מאגרי המידע שאתה צריך"). 001 הוחל לפניו.
-- מסמכים, מקור הבקשה, חיפוש לפי טלפון, בקשות שלט אתר בשרת, ודלי מסמכים פרטי.

alter table ks_applications add column if not exists source text not null default 'online' check (source in ('online','manual','document','site'));
alter table ks_applications add column if not exists details jsonb default '{}'::jsonb;
alter table ks_applications add column if not exists documents jsonb default '[]'::jsonb;
alter table ks_applications add column if not exists notes text;
alter table ks_applications add column if not exists edit_token text default md5(random()::text || clock_timestamp()::text);
alter table ks_applications add column if not exists phone_digits text generated always as (
  case when regexp_replace(coalesce(phone,''), '\D', '', 'g') like '972%'
       then '0' || substr(regexp_replace(phone, '\D', '', 'g'), 4)
       else regexp_replace(coalesce(phone,''), '\D', '', 'g') end) stored;
create index if not exists ks_applications_phone_idx on ks_applications(phone_digits);

create or replace function public.ks_digits(p text) returns text language sql immutable set search_path = public as $$
  select case when regexp_replace(coalesce(p,''), '\D', '', 'g') like '972%'
    then '0' || substr(regexp_replace(p, '\D', '', 'g'), 4) else regexp_replace(coalesce(p,''), '\D', '', 'g') end $$;

-- ks_submit_application: מקבל גם source, details, documents, notes (ראו 001 לגרסה הבסיסית)
-- ks_save_site_request(p jsonb) -> {code, token}: יוצר או מעדכן בקשת שלט אתר לפי קוד ואסימון עריכה
-- ks_track_by_phone(p_phone text): כל הבקשות לפי טלפון נייד, בלי פרטים אישיים
-- הגדרות הפונקציות המלאות הוחלו במיגרציה ks_002d_functions.

insert into storage.buckets (id, name, public, file_size_limit) values ('ks-docs', 'ks-docs', false, 26214400) on conflict (id) do nothing;
create policy ks_docs_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'ks-docs' and (storage.foldername(name))[1] = 'incoming');
create policy ks_docs_staff on storage.objects for all to authenticated
  using (bucket_id = 'ks-docs' and public.is_staff()) with check (bucket_id = 'ks-docs' and public.is_staff());

-- נתוני בסיס: 7 סוגי שלטים, 56 כללים ו-9 הערות מסלול נטענו מ-seed/policy.mjs.
