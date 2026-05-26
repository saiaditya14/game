create extension if not exists pg_cron;

create table if not exists public.draw_off_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'won', 'aborted')),
  drawer_id text,
  guesser_id text,
  current_word text,
  words_guessed integer not null default 0,
  target_words integer not null default 3,
  time_elapsed integer not null default 0, 
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists draw_off_rooms_code_idx
  on public.draw_off_rooms (code);

create or replace function public.set_draw_off_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_draw_off_rooms_updated_at on public.draw_off_rooms;
create trigger set_draw_off_rooms_updated_at
before update on public.draw_off_rooms
for each row
execute function public.set_draw_off_updated_at();

alter table public.draw_off_rooms enable row level security;

drop policy if exists "Draw Off rooms can be read by clients" on public.draw_off_rooms;
create policy "Draw Off rooms can be read by clients"
on public.draw_off_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Draw Off rooms can be created by clients" on public.draw_off_rooms;
create policy "Draw Off rooms can be created by clients"
on public.draw_off_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Draw Off rooms can be updated by clients" on public.draw_off_rooms;
create policy "Draw Off rooms can be updated by clients"
on public.draw_off_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.draw_off_rooms;
exception
  when duplicate_object then null;
end;
$$;

-- Cleanup job for abandoned game rooms (older than 24h)
select cron.schedule(
  'cleanup_inactive_game_rooms',
  '0 0 * * *', -- Run daily at midnight
  $$ 
    delete from public.connect_four_rooms where updated_at < now() - interval '24 hours';
    delete from public.draw_off_rooms where updated_at < now() - interval '24 hours';
  $$
);
