create extension if not exists pgcrypto;

create table if not exists public.verbal_memory_duel_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  seed bigint not null,
  player_one text not null,
  player_two text,
  lives_one integer not null default 3,
  lives_two integer not null default 3,
  score_one integer not null default 0,
  score_two integer not null default 0,
  mistakes_one jsonb not null default '[]'::jsonb,
  mistakes_two jsonb not null default '[]'::jsonb,
  finished_one_at timestamptz,
  finished_two_at timestamptz,
  winner integer check (winner in (1, 2)),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists verbal_memory_duel_rooms_code_idx
  on public.verbal_memory_duel_rooms (code);

create or replace function public.set_verbal_memory_duel_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_verbal_memory_duel_rooms_updated_at on public.verbal_memory_duel_rooms;

create trigger set_verbal_memory_duel_rooms_updated_at
before update on public.verbal_memory_duel_rooms
for each row
execute function public.set_verbal_memory_duel_updated_at();

alter table public.verbal_memory_duel_rooms enable row level security;

drop policy if exists "Verbal Memory Duel rooms can be read by clients" on public.verbal_memory_duel_rooms;
create policy "Verbal Memory Duel rooms can be read by clients"
on public.verbal_memory_duel_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Verbal Memory Duel rooms can be created by clients" on public.verbal_memory_duel_rooms;
create policy "Verbal Memory Duel rooms can be created by clients"
on public.verbal_memory_duel_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Verbal Memory Duel rooms can be updated by clients" on public.verbal_memory_duel_rooms;
create policy "Verbal Memory Duel rooms can be updated by clients"
on public.verbal_memory_duel_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.verbal_memory_duel_rooms;
exception
  when duplicate_object then null;
end;
$$;
