create extension if not exists pgcrypto;

create table if not exists public.monopoly_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  host_id text not null,
  players jsonb not null default '[]'::jsonb,
  current_player_index integer not null default 0 check (current_player_index >= 0),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'aborted')),
  latest_roll jsonb,
  event_log jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists monopoly_rooms_code_idx
  on public.monopoly_rooms (code);

create or replace function public.set_monopoly_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_monopoly_rooms_updated_at on public.monopoly_rooms;

create trigger set_monopoly_rooms_updated_at
before update on public.monopoly_rooms
for each row
execute function public.set_monopoly_updated_at();

alter table public.monopoly_rooms enable row level security;

drop policy if exists "Monopoly rooms can be read by clients" on public.monopoly_rooms;
create policy "Monopoly rooms can be read by clients"
on public.monopoly_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Monopoly rooms can be created by clients" on public.monopoly_rooms;
create policy "Monopoly rooms can be created by clients"
on public.monopoly_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Monopoly rooms can be updated by clients" on public.monopoly_rooms;
create policy "Monopoly rooms can be updated by clients"
on public.monopoly_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.monopoly_rooms;
exception
  when duplicate_object then null;
end;
$$;
