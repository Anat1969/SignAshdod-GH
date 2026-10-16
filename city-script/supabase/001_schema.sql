-- כתב העיר: שילוט עירוני אשדוד. כל הטבלאות בקידומת ks_ (פרויקט משותף ASHDODMAP).

create table if not exists ks_categories (
  slug text primary key,
  name text not null,
  section text not null,
  landscape text not null default 'estuary',
  summary text,
  default_validity_months int,          -- null = בתוקף עד שינוי או הסרה
  sort int default 0,
  updated_at timestamptz default now()
);

create table if not exists ks_rules (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references ks_categories(slug) on delete cascade,
  kind text not null check (kind in ('question','zone','info')),
  section text not null,
  text text not null,
  expect boolean,
  on_fail text check (on_fail in ('fail','review')),
  zone_key text,
  sort int default 0,
  active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists ks_zones (
  id text primary key,
  name text not null,
  landscape text not null,
  electronic_allowed boolean default false,
  totem_allowed boolean default false,
  coast boolean default false,
  view_protected boolean default false,
  priority int default 1,
  schematic boolean default true,
  note text,
  polygon jsonb not null,               -- [[lng,lat],...]
  source text,
  updated_at timestamptz default now()
);

create table if not exists ks_route_notes (
  route_slug text primary key,
  landscape text not null,
  note text not null,
  updated_at timestamptz default now()
);

create table if not exists ks_fee_rates (
  id uuid primary key default gen_random_uuid(),
  category_slug text references ks_categories(slug) on delete cascade,
  unit text not null check (unit in ('sqm_year','sign_year','one_time')),
  amount_ils numeric(12,2) not null check (amount_ils >= 0),
  valid_from date not null default current_date,
  source text not null default 'bylaw_1997' check (source in ('bylaw_1997','amendment_2026','other')),
  source_ref text,
  notes text,
  updated_by text,
  updated_at timestamptz default now()
);

create table if not exists ks_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists ks_applications (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  applicant_name text not null,
  phone text,
  email text,
  business_name text,
  address text,
  lat double precision,
  lng double precision,
  zone_id text,
  category_slug text references ks_categories(slug),
  sign_area_sqm numeric(8,2),
  answers jsonb default '{}'::jsonb,
  check_result jsonb default '{}'::jsonb,
  status text not null default 'התקבלה' check (status in ('התקבלה','בבדיקת אדריכלית העיר','בוועדת שילוט','בפיקוח','אושרה','הוחזרה לתיקון','נדחתה')),
  license_valid_until date,             -- null = בתוקף עד שינוי בשלט או הסרתו
  billing_cycle text,                   -- נגזר מטבלת התעריפים
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ks_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references ks_applications(id) on delete cascade,
  stage text not null check (stage in ('אדריכלית העיר','ועדת שילוט','פיקוח')),
  decision text not null check (decision in ('אושר','הוחזר לתיקון','נדחה','הערה')),
  sections text[] default '{}',
  comment text,
  signed_by text,
  created_at timestamptz default now()
);

create table if not exists ks_license_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references ks_applications(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_by text,
  changed_at timestamptz default now()
);

create table if not exists ks_reports (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  address text,
  description text not null check (char_length(description) between 3 and 1000),
  contact text,
  status text not null default 'חדש' check (status in ('חדש','בטיפול','טופל','לא רלוונטי')),
  created_at timestamptz default now()
);

create table if not exists ks_survey_signs (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  address text,
  category_slug text references ks_categories(slug),
  legal_status text not null default 'לא ידוע' check (legal_status in ('ברישיון','ללא רישיון','חורג מהרישיון','לא ידוע')),
  note text,
  surveyed_by text,
  created_at timestamptz default now()
);

-- RLS
alter table ks_categories enable row level security;
alter table ks_rules enable row level security;
alter table ks_zones enable row level security;
alter table ks_route_notes enable row level security;
alter table ks_fee_rates enable row level security;
alter table ks_settings enable row level security;
alter table ks_applications enable row level security;
alter table ks_reviews enable row level security;
alter table ks_license_history enable row level security;
alter table ks_reports enable row level security;
alter table ks_survey_signs enable row level security;

-- קריאה ציבורית לתוכן המדיניות
do $$ declare t text; begin
  foreach t in array array['ks_categories','ks_rules','ks_zones','ks_route_notes','ks_fee_rates','ks_settings'] loop
    execute format('drop policy if exists %1$s_read on %1$s', t);
    execute format('create policy %1$s_read on %1$s for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists %1$s_staff on %1$s', t);
    execute format('create policy %1$s_staff on %1$s for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
  foreach t in array array['ks_applications','ks_reviews','ks_license_history','ks_survey_signs','ks_reports'] loop
    execute format('drop policy if exists %1$s_staff on %1$s', t);
    execute format('create policy %1$s_staff on %1$s for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- דיווח תושב: הוספה ציבורית בלבד, בלי קריאה
drop policy if exists ks_reports_insert on ks_reports;
create policy ks_reports_insert on ks_reports for insert to anon, authenticated
  with check (status = 'חדש' and lat between 31.70 and 31.88 and lng between 34.58 and 34.72);

-- הגשת בקשה: פונקציה שמחזירה קוד מעקב. המבקש אינו קורא את הטבלה.
create or replace function public.ks_submit_application(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare code text; cat text;
begin
  if coalesce(trim(p->>'applicant_name'),'') = '' then raise exception 'שם המבקש חסר'; end if;
  cat := p->>'category_slug';
  if not exists (select 1 from ks_categories where slug = cat) then raise exception 'סוג שלט לא מוכר'; end if;
  loop
    code := 'KS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from ks_applications where tracking_code = code);
  end loop;
  insert into ks_applications (tracking_code, applicant_name, phone, email, business_name, address, lat, lng,
    zone_id, category_slug, sign_area_sqm, answers, check_result)
  values (code, left(p->>'applicant_name',120), left(p->>'phone',30), left(p->>'email',120), left(p->>'business_name',120),
    left(p->>'address',200), nullif(p->>'lat','')::float8, nullif(p->>'lng','')::float8, p->>'zone_id', cat,
    nullif(p->>'sign_area_sqm','')::numeric, coalesce(p->'answers','{}'::jsonb), coalesce(p->'check_result','{}'::jsonb));
  return code;
end $$;

-- מעקב בקשה לפי קוד
create or replace function public.ks_track_application(p_code text)
returns table (tracking_code text, category text, address text, status text, license_valid_until date,
  created_at timestamptz, updated_at timestamptz, last_decision text, last_comment text, last_stage text)
language sql security definer set search_path = public stable as $$
  select a.tracking_code, c.name, a.address, a.status, a.license_valid_until, a.created_at, a.updated_at,
    r.decision, r.comment, r.stage
  from ks_applications a
  left join ks_categories c on c.slug = a.category_slug
  left join lateral (select decision, comment, stage from ks_reviews where application_id = a.id order by created_at desc limit 1) r on true
  where a.tracking_code = upper(trim(p_code));
$$;

revoke all on function public.ks_submit_application(jsonb) from public;
grant execute on function public.ks_submit_application(jsonb) to anon, authenticated;
grant execute on function public.ks_track_application(text) to anon, authenticated;

-- היסטוריית תוקף וסטטוס
create or replace function public.ks_log_application_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.license_valid_until is distinct from old.license_valid_until then
    insert into ks_license_history(application_id, field, old_value, new_value, changed_by)
    values (new.id, 'license_valid_until', coalesce(old.license_valid_until::text,'עד שינוי או הסרה'),
      coalesce(new.license_valid_until::text,'עד שינוי או הסרה'), (select email from auth.users where id = auth.uid()));
  end if;
  if new.status is distinct from old.status then
    insert into ks_license_history(application_id, field, old_value, new_value, changed_by)
    values (new.id, 'status', old.status, new.status, (select email from auth.users where id = auth.uid()));
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists ks_applications_log on ks_applications;
create trigger ks_applications_log before update on ks_applications
  for each row execute function public.ks_log_application_change();

-- תוקף ברירת מחדל לפי סוג שלט בעת אישור
create or replace function public.ks_default_validity() returns trigger
language plpgsql security definer set search_path = public as $$
declare months int;
begin
  if new.status = 'אושרה' and old.status <> 'אושרה' and new.license_valid_until is null then
    select default_validity_months into months from ks_categories where slug = new.category_slug;
    if months is not null then new.license_valid_until := (current_date + make_interval(months => months))::date; end if;
  end if;
  return new;
end $$;
drop trigger if exists ks_applications_validity on ks_applications;
drop trigger if exists ks_applications_a_validity on ks_applications;
create trigger ks_applications_a_validity before update on ks_applications
  for each row execute function public.ks_default_validity();

create index if not exists ks_applications_status_idx on ks_applications(status, created_at desc);
create index if not exists ks_rules_cat_idx on ks_rules(category_slug, sort);
