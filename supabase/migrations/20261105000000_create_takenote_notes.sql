-- TakeNote-owned table only. Does not modify existing RFP tables.
-- Run against the connected Supabase project only if the table is missing.
create table if not exists public.takenote_notes (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null default '',
 body text not null default '',
 color text not null default 'pink',
 pinned boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.takenote_notes enable row level security;

-- Distinct policy names prevent collisions with other applications.
do $$
begin
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='takenote_notes' and policyname='takenote_select_own') then
  create policy takenote_select_own on public.takenote_notes for select to authenticated using (owner_id = (select auth.uid()));
 end if;
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='takenote_notes' and policyname='takenote_insert_own') then
  create policy takenote_insert_own on public.takenote_notes for insert to authenticated with check (owner_id = (select auth.uid()));
 end if;
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='takenote_notes' and policyname='takenote_update_own') then
  create policy takenote_update_own on public.takenote_notes for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
 end if;
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='takenote_notes' and policyname='takenote_delete_own') then
  create policy takenote_delete_own on public.takenote_notes for delete to authenticated using (owner_id = (select auth.uid()));
 end if;
end $$;
