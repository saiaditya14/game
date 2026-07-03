create extension if not exists pgcrypto;

create table if not exists public.quick_maths_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  player_one text not null,
  player_two text,
  score_one integer not null default 0,
  score_two integer not null default 0,
  current_round integer not null default 1,
  total_rounds integer not null default 10,
  seed bigint not null,
  number_size text not null default 'small' check (number_size in ('small', 'medium', 'large')),
  operations text not null default 'add_sub' check (operations in ('add_sub', 'add_sub_mul', 'all')),
  operand_count integer not null default 2 check (operand_count in (2, 3, 4)),
  round_winner integer check (round_winner in (1, 2)),
  winner integer check (winner in (1, 2)),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quick_maths_rooms_code_idx
  on public.quick_maths_rooms (code);

create or replace function public.set_quick_maths_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quick_maths_rooms_updated_at on public.quick_maths_rooms;

create trigger set_quick_maths_rooms_updated_at
before update on public.quick_maths_rooms
for each row
execute function public.set_quick_maths_updated_at();

alter table public.quick_maths_rooms enable row level security;

drop policy if exists "Quick Maths rooms can be read by clients" on public.quick_maths_rooms;
create policy "Quick Maths rooms can be read by clients"
on public.quick_maths_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Quick Maths rooms can be created by clients" on public.quick_maths_rooms;
create policy "Quick Maths rooms can be created by clients"
on public.quick_maths_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Quick Maths rooms can be updated by clients" on public.quick_maths_rooms;
create policy "Quick Maths rooms can be updated by clients"
on public.quick_maths_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.quick_maths_rooms;
exception
  when duplicate_object then null;
end;
$$;
