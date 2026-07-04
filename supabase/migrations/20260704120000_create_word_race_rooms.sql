create extension if not exists pgcrypto;

create table if not exists public.word_race_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  secret_word text not null,
  player_one text not null,
  player_two text,
  progress_one jsonb not null default '[]'::jsonb,
  progress_two jsonb not null default '[]'::jsonb,
  solved_one boolean not null default false,
  solved_two boolean not null default false,
  gave_up_one boolean not null default false,
  gave_up_two boolean not null default false,
  finished_one_at timestamptz,
  finished_two_at timestamptz,
  winner integer check (winner in (1, 2)),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_race_rooms_code_idx
  on public.word_race_rooms (code);

create or replace function public.set_word_race_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_word_race_rooms_updated_at on public.word_race_rooms;

create trigger set_word_race_rooms_updated_at
before update on public.word_race_rooms
for each row
execute function public.set_word_race_updated_at();

alter table public.word_race_rooms enable row level security;

drop policy if exists "Word Race rooms can be read by clients" on public.word_race_rooms;
create policy "Word Race rooms can be read by clients"
on public.word_race_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Word Race rooms can be created by clients" on public.word_race_rooms;
create policy "Word Race rooms can be created by clients"
on public.word_race_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Word Race rooms can be updated by clients" on public.word_race_rooms;
create policy "Word Race rooms can be updated by clients"
on public.word_race_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.word_race_rooms;
exception
  when duplicate_object then null;
end;
$$;
