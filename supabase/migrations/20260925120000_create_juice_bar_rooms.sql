create extension if not exists pgcrypto;

create table if not exists public.juice_bar_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  prep_id text,
  blend_id text,
  round integer not null default 1,
  target_rounds integer not null default 5,
  score integer not null default 0,
  order_combo jsonb not null default '[]'::jsonb,
  order_topping text,
  bin jsonb not null default '[]'::jsonb,
  last_result text check (last_result in ('correct', 'wrong')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists juice_bar_rooms_code_idx
  on public.juice_bar_rooms (code);

create or replace function public.set_juice_bar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_juice_bar_rooms_updated_at on public.juice_bar_rooms;

create trigger set_juice_bar_rooms_updated_at
before update on public.juice_bar_rooms
for each row
execute function public.set_juice_bar_updated_at();

alter table public.juice_bar_rooms enable row level security;

drop policy if exists "Juice Bar rooms can be read by clients" on public.juice_bar_rooms;
create policy "Juice Bar rooms can be read by clients"
on public.juice_bar_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Juice Bar rooms can be created by clients" on public.juice_bar_rooms;
create policy "Juice Bar rooms can be created by clients"
on public.juice_bar_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Juice Bar rooms can be updated by clients" on public.juice_bar_rooms;
create policy "Juice Bar rooms can be updated by clients"
on public.juice_bar_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.juice_bar_rooms;
exception
  when duplicate_object then null;
end;
$$;
