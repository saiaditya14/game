create extension if not exists pgcrypto;

create table if not exists public.category_blitz_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'reveal', 'finished', 'aborted', 'closed')),
  player_one text not null,
  player_two text,
  round_letter text not null,
  categories jsonb not null default '[]'::jsonb,
  timer_seconds integer not null default 90,
  started_at timestamptz,
  answers_one jsonb not null default '[]'::jsonb,
  answers_two jsonb not null default '[]'::jsonb,
  submitted_one_at timestamptz,
  submitted_two_at timestamptz,
  -- approvals_one holds player TWO's verdicts on player ONE's answers, and
  -- vice versa for approvals_two — each side only ever writes the column
  -- that judges the OTHER player's answers.
  approvals_one jsonb not null default '[]'::jsonb,
  approvals_two jsonb not null default '[]'::jsonb,
  review_one_done boolean not null default false,
  review_two_done boolean not null default false,
  score_one integer,
  score_two integer,
  winner integer check (winner in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists category_blitz_rooms_code_idx
  on public.category_blitz_rooms (code);

create or replace function public.set_category_blitz_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_category_blitz_rooms_updated_at on public.category_blitz_rooms;

create trigger set_category_blitz_rooms_updated_at
before update on public.category_blitz_rooms
for each row
execute function public.set_category_blitz_updated_at();

alter table public.category_blitz_rooms enable row level security;

drop policy if exists "Category Blitz rooms can be read by clients" on public.category_blitz_rooms;
create policy "Category Blitz rooms can be read by clients"
on public.category_blitz_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Category Blitz rooms can be created by clients" on public.category_blitz_rooms;
create policy "Category Blitz rooms can be created by clients"
on public.category_blitz_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Category Blitz rooms can be updated by clients" on public.category_blitz_rooms;
create policy "Category Blitz rooms can be updated by clients"
on public.category_blitz_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.category_blitz_rooms;
exception
  when duplicate_object then null;
end;
$$;
