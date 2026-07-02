create extension if not exists pgcrypto;

create table if not exists public.tic_tac_toe_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  board jsonb not null default '[]'::jsonb,
  current_player integer not null default 1 check (current_player in (1, 2)),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'won', 'draw', 'aborted')),
  winner integer check (winner in (1, 2)),
  winning_line jsonb,
  player_one text not null,
  player_two text,
  last_move jsonb,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tic_tac_toe_rooms_code_idx
  on public.tic_tac_toe_rooms (code);

create or replace function public.set_tic_tac_toe_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tic_tac_toe_rooms_updated_at on public.tic_tac_toe_rooms;

create trigger set_tic_tac_toe_rooms_updated_at
before update on public.tic_tac_toe_rooms
for each row
execute function public.set_tic_tac_toe_updated_at();

alter table public.tic_tac_toe_rooms enable row level security;

drop policy if exists "Tic-Tac-Toe rooms can be read by clients" on public.tic_tac_toe_rooms;
create policy "Tic-Tac-Toe rooms can be read by clients"
on public.tic_tac_toe_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Tic-Tac-Toe rooms can be created by clients" on public.tic_tac_toe_rooms;
create policy "Tic-Tac-Toe rooms can be created by clients"
on public.tic_tac_toe_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Tic-Tac-Toe rooms can be updated by clients" on public.tic_tac_toe_rooms;
create policy "Tic-Tac-Toe rooms can be updated by clients"
on public.tic_tac_toe_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.tic_tac_toe_rooms;
exception
  when duplicate_object then null;
end;
$$;
