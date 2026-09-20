-- SignAshdod — initial schema, RLS, storage, and auth wiring.
-- Applied to the Supabase project that backs the app.

-- ------------------------------------------------------------------
-- profiles: one row per authenticated user, holds the app role.
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- is_admin(): SECURITY DEFINER so it can read profiles without tripping RLS
-- recursion when evaluated inside other tables' policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile on first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles policies
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------------
-- signage_requests
-- ------------------------------------------------------------------
create table if not exists public.signage_requests (
  id            uuid primary key default gen_random_uuid(),
  created_date  timestamptz not null default now(),
  created_by    text,
  request_type  text not null,
  status        text not null default 'draft',

  applicant_name   text,
  applicant_phone  text,
  applicant_email  text,
  site_address     text,

  permit_nature  text,
  permit_number  text,
  project_name   text,

  developer_name     text,
  architect_name     text,
  contractor_name    text,
  contractor_license text,
  engineer_name      text,
  engineer_license   text,
  site_manager_name  text,
  safety_officer_name text,

  company_name    text,
  company_po_box  text,
  company_address text,

  fence_total_length_meters   numeric,
  fence_developer_percent     numeric,
  fence_municipality_percent  numeric,

  sign_example_file          text,
  organization_plan_file     text,
  permit_visualization_file  text,
  fence_diagram_file         text,
  fence_3d_render_file       text,

  developer_signature_date       date,
  city_architect_approved        boolean default false,
  signage_committee_approved     boolean default false,
  municipal_supervision_approved boolean default false,
  approval_date                  date,
  reviewer_notes                 text
);

alter table public.signage_requests enable row level security;

-- Force created_by to the caller's email; never trust the client.
create or replace function public.set_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_by := auth.jwt()->>'email';
  return new;
end;
$$;

drop trigger if exists set_created_by_signage on public.signage_requests;
create trigger set_created_by_signage
  before insert on public.signage_requests
  for each row execute function public.set_created_by();

drop policy if exists sr_select on public.signage_requests;
create policy sr_select on public.signage_requests
  for select using (created_by = (auth.jwt()->>'email') or public.is_admin());

drop policy if exists sr_insert on public.signage_requests;
create policy sr_insert on public.signage_requests
  for insert with check (auth.role() = 'authenticated');

drop policy if exists sr_update on public.signage_requests;
create policy sr_update on public.signage_requests
  for update using (created_by = (auth.jwt()->>'email') or public.is_admin())
  with check (created_by = (auth.jwt()->>'email') or public.is_admin());

drop policy if exists sr_delete on public.signage_requests;
create policy sr_delete on public.signage_requests
  for delete using (public.is_admin());

create index if not exists idx_sr_created_by on public.signage_requests (created_by);
create index if not exists idx_sr_created_date on public.signage_requests (created_date desc);

-- ------------------------------------------------------------------
-- request_notes
-- ------------------------------------------------------------------
create table if not exists public.request_notes (
  id               uuid primary key default gen_random_uuid(),
  created_date     timestamptz not null default now(),
  created_by       text,
  request_id       uuid not null references public.signage_requests(id) on delete cascade,
  note_text        text not null,
  note_type        text not null default 'general',
  sent_to_applicant boolean default false
);

alter table public.request_notes enable row level security;

drop trigger if exists set_created_by_notes on public.request_notes;
create trigger set_created_by_notes
  before insert on public.request_notes
  for each row execute function public.set_created_by();

-- Applicants may read notes on their own requests; admins read all.
drop policy if exists rn_select on public.request_notes;
create policy rn_select on public.request_notes
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.signage_requests sr
      where sr.id = request_notes.request_id
        and sr.created_by = (auth.jwt()->>'email')
    )
  );

-- Only staff add / update notes.
drop policy if exists rn_insert on public.request_notes;
create policy rn_insert on public.request_notes
  for insert with check (public.is_admin());

drop policy if exists rn_update on public.request_notes;
create policy rn_update on public.request_notes
  for update using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_rn_request_id on public.request_notes (request_id);

-- ------------------------------------------------------------------
-- Storage bucket for uploaded files (public read, authenticated write).
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists uploads_read on storage.objects;
create policy uploads_read on storage.objects
  for select using (bucket_id = 'uploads');

drop policy if exists uploads_write on storage.objects;
create policy uploads_write on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
