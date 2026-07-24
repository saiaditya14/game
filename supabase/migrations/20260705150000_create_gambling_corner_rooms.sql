create extension if not exists pgcrypto;

-- Gambling Corner: shared N-player base (room/lobby/chip bankroll) for three
-- bluff variants that will live under one roof (Indian Poker, Dice Poker,
-- Heads-up Hold'em). Part 1 ships the shared base + Indian Poker only; `mode`
-- records which variant a room was created for, and Dice Poker / Hold'em
-- rooms simply won't be created by the client yet (their UI is a stub).
--
-- Players are a jsonb ARRAY (seat = array index), copying Sugaropoly's
-- N-player pattern rather than Connect Four's fixed player_one/two — a couple
-- of 2 is just the N=2 case. Chips live on the shared room row (the base
-- owns chips, not each variant).
create table if not exists public.gambling_corner_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  mode text not null check (mode in ('indian_poker', 'dice_poker', 'holdem')),
  host_id text not null,
  -- players: [{ id, name, chips, seat, active }]
  players jsonb not null default '[]'::jsonb,
  starting_chips integer not null default 200,
  ante integer not null default 20,

  -- Round state (Indian Poker, Part 1). `hands`/`decisions` are shared jsonb
  -- maps keyed by playerId, following the Category Blitz `answers`/`votes`
  -- pattern; each player's own card is simply never rendered client-side
  -- (the whole point of Indian Poker is everyone else CAN see it).
  round_phase text not null default 'idle'
    check (round_phase in ('idle', 'dealt', 'revealed')),
  hands jsonb not null default '{}'::jsonb,
  decisions jsonb not null default '{}'::jsonb,
  pot integer not null default 0,
  winner_ids jsonb not null default '[]'::jsonb,

  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gambling_corner_rooms_code_idx
  on public.gambling_corner_rooms (code);

create or replace function public.set_gambling_corner_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_gambling_corner_rooms_updated_at on public.gambling_corner_rooms;

create trigger set_gambling_corner_rooms_updated_at
before update on public.gambling_corner_rooms
for each row
execute function public.set_gambling_corner_updated_at();

alter table public.gambling_corner_rooms enable row level security;

drop policy if exists "Gambling Corner rooms can be read by clients" on public.gambling_corner_rooms;
create policy "Gambling Corner rooms can be read by clients"
on public.gambling_corner_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Gambling Corner rooms can be created by clients" on public.gambling_corner_rooms;
create policy "Gambling Corner rooms can be created by clients"
on public.gambling_corner_rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "Gambling Corner rooms can be updated by clients" on public.gambling_corner_rooms;
create policy "Gambling Corner rooms can be updated by clients"
on public.gambling_corner_rooms
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.gambling_corner_rooms;
exception
  when duplicate_object then null;
end;
$$;

-- ─── RPCs ────────────────────────────────────────────────────────────────
-- Joining appends to the shared `players` array — a plain client
-- read-modify-write races under concurrent joiners, so this takes a row
-- lock (`select ... for update`) the same way `category_blitz_join` does.
create or replace function public.gambling_corner_join(
  p_code text,
  p_player_id text
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
  v_players jsonb;
  v_already_in boolean;
  v_name text;
  v_seat integer;
begin
  select * into v_room
  from public.gambling_corner_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  v_players := coalesce(v_room.players, '[]'::jsonb);

  select exists (
    select 1 from jsonb_array_elements(v_players) e where e->>'id' = p_player_id
  ) into v_already_in;

  if v_already_in then
    return v_room;
  end if;

  if v_room.status <> 'waiting' then
    raise exception 'ROOM_NOT_JOINABLE';
  end if;

  if jsonb_array_length(v_players) >= 8 then
    raise exception 'ROOM_FULL';
  end if;

  v_seat := jsonb_array_length(v_players);
  v_name := 'Player ' || (v_seat + 1)::text;
  v_players := v_players || jsonb_build_array(jsonb_build_object(
    'id', p_player_id,
    'name', v_name,
    'chips', v_room.starting_chips,
    'seat', v_seat,
    'active', true
  ));

  update public.gambling_corner_rooms
  set players = v_players
  where id = v_room.id
  returning * into v_room;

  return v_room;
end;
$$;

-- A player stays (antes into the pot) or folds. Deducting chips means
-- rewriting that player's entry inside the `players` array, so this loops
-- and rebuilds the array server-side in one statement rather than doing a
-- client read-modify-write of the whole array (which would race against a
-- concurrent decision from another seat).
create or replace function public.gambling_corner_decide(
  p_room_id uuid,
  p_player_id text,
  p_action text
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
  v_players jsonb := '[]'::jsonb;
  v_player jsonb;
  v_chips integer;
begin
  if p_action not in ('stay', 'fold') then
    raise exception 'INVALID_ACTION';
  end if;

  select * into v_room
  from public.gambling_corner_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.round_phase <> 'dealt' then
    raise exception 'ROUND_NOT_DEALT';
  end if;

  if v_room.decisions ? p_player_id then
    -- already decided this round, no-op
    return v_room;
  end if;

  for v_player in select jsonb_array_elements(v_room.players) loop
    if v_player->>'id' = p_player_id then
      if p_action = 'stay' then
        v_chips := greatest(0, coalesce((v_player->>'chips')::integer, 0) - v_room.ante);
        v_player := jsonb_set(v_player, '{chips}', to_jsonb(v_chips));
      end if;
    end if;
    v_players := v_players || jsonb_build_array(v_player);
  end loop;

  update public.gambling_corner_rooms
  set players = v_players,
      decisions = jsonb_set(coalesce(decisions, '{}'::jsonb), array[p_player_id], to_jsonb(p_action), true),
      pot = case when p_action = 'stay' then pot + ante else pot end
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

-- Applies the winners' payout to the `players` array in one statement.
-- Winner/payout computation itself happens client-side in the pure
-- IndianPokerRules module (everyone's card is already visible in `hands`,
-- so there is no hidden information to protect); this RPC just guarantees
-- the payout is only ever applied once per round and never races against a
-- concurrent decision.
create or replace function public.gambling_corner_settle(
  p_room_id uuid,
  p_payouts jsonb,
  p_winner_ids jsonb
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
  v_players jsonb := '[]'::jsonb;
  v_player jsonb;
  v_id text;
  v_payout integer;
begin
  select * into v_room
  from public.gambling_corner_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.round_phase <> 'dealt' then
    -- already settled (or not dealt) — idempotent no-op
    return v_room;
  end if;

  for v_player in select jsonb_array_elements(v_room.players) loop
    v_id := v_player->>'id';
    v_payout := coalesce((p_payouts->>v_id)::integer, 0);
    if v_payout <> 0 then
      v_player := jsonb_set(
        v_player, '{chips}',
        to_jsonb(greatest(0, coalesce((v_player->>'chips')::integer, 0) + v_payout))
      );
    end if;
    v_players := v_players || jsonb_build_array(v_player);
  end loop;

  update public.gambling_corner_rooms
  set players = v_players,
      winner_ids = p_winner_ids,
      round_phase = 'revealed'
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

grant execute on function public.gambling_corner_join(text, text) to anon, authenticated;
grant execute on function public.gambling_corner_decide(uuid, text, text) to anon, authenticated;
grant execute on function public.gambling_corner_settle(uuid, jsonb, jsonb) to anon, authenticated;
