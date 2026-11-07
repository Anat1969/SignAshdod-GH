-- Applied to the shared project cultura-GH (ktqmwpbzcnzkhjskqisy) on 2026-11-07 as migration sign_signage_open_editing.
-- SignAshdod-GH moved off Appwrite (paused for inactivity). No sign-in: editing open on every device (Anat).
create table if not exists public.sign_requests (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.sign_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sign_requests(id) on delete cascade,
  note_type text not null default 'general',
  note_text text not null,
  sent_to_applicant boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists sign_notes_request_idx on public.sign_notes(request_id);
create index if not exists sign_notes_type_idx on public.sign_notes(note_type, created_at desc);
alter table public.sign_requests enable row level security;
alter table public.sign_notes enable row level security;
create policy "sign_requests open read" on public.sign_requests for select to anon, authenticated using (true);
create policy "sign_requests open insert" on public.sign_requests for insert to anon, authenticated with check (true);
create policy "sign_requests open update" on public.sign_requests for update to anon, authenticated using (true) with check (true);
create policy "sign_notes open read" on public.sign_notes for select to anon, authenticated using (true);
create policy "sign_notes open insert" on public.sign_notes for insert to anon, authenticated with check (true);
create policy "sign_notes open update" on public.sign_notes for update to anon, authenticated using (true) with check (true);
insert into storage.buckets (id, name, public) values ('sign-media', 'sign-media', true) on conflict (id) do nothing;
create policy "sign-media open upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'sign-media');
create policy "sign-media open read" on storage.objects for select to anon, authenticated using (bucket_id = 'sign-media');
