-- Gambling Corner — Part 2: Dice Poker. ADD-ONLY migration; never touches
-- Indian Poker's existing columns/RPCs (round_phase, hands, decisions,
-- gambling_corner_decide/settle stay exactly as shipped in Part 1).
--
-- Dice Poker needs real turn-based betting (unlike Indian Poker's
-- simultaneous stay/fold), so it gets its own phase column and its own
-- round-state columns rather than reusing `round_phase`/`hands`/`decisions`.

alter table public.gambling_corner_rooms
  add column if not exists dice_phase text not null default 'idle'
    check (dice_phase in ('idle', 'bet1', 'reroll', 'bet2', 'showdown')),
  -- dice: { playerId: number[5] } — committed dice for the current hand.
  -- Reroll keep-selections stay in LOCAL React state until a player commits
  -- their reroll (Category Blitz "buffer locally, commit once" lesson); only
  -- the final 5-dice array ever reaches this column.
  add column if not exists dice jsonb not null default '{}'::jsonb,
  -- reroll_done: { playerId: true } once that player has committed their
  -- (single) reroll this hand.
  add column if not exists reroll_done jsonb not null default '{}'::jsonb,
  -- betting: the serialized BettingRound.js state for the CURRENT betting
  -- round (bet1 or bet2) — { order, currentActor, toCall, minRaise,
  -- committed, acted, folded, allIn }. Computed client-side by the shared
  -- pure engine and applied atomically by the RPCs below, the same trust
  -- model gambling_corner_settle already uses for Indian Poker payouts.
  add column if not exists betting jsonb not null default '{}'::jsonb,
  -- End-condition config, chosen by the host at table creation.
  add column if not exists end_mode text not null default 'hands'
    check (end_mode in ('hands', 'bust')),
  add column if not exists hand_cap integer not null default 8,
  add column if not exists hands_played integer not null default 0,
  -- Rotates the first-to-act seat each hand.
  add column if not exists dealer_seat integer not null default 0;

-- ─── RPCs ────────────────────────────────────────────────────────────────

-- Host deals a fresh Dice Poker hand: antes are already deducted from
-- `p_players` and folded into `p_pot` client-side (mirrors how
-- gambling_corner_decide deducts the ante on 'stay'); this RPC just applies
-- the precomputed slice atomically and is host-gated like Category Blitz's
-- startGame/playAgain (pre-round, low concurrency risk).
create or replace function public.dice_poker_deal(
  p_room_id uuid,
  p_host_id text,
  p_players jsonb,
  p_dice jsonb,
  p_betting jsonb,
  p_pot integer,
  p_dealer_seat integer
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
begin
  select * into v_room
  from public.gambling_corner_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.host_id <> p_host_id then
    raise exception 'NOT_HOST';
  end if;
  if v_room.mode <> 'dice_poker' then
    raise exception 'WRONG_MODE';
  end if;
  if v_room.status not in ('waiting', 'playing') then
    raise exception 'ROOM_NOT_PLAYABLE';
  end if;
  if v_room.dice_phase not in ('idle', 'showdown') then
    raise exception 'HAND_IN_PROGRESS';
  end if;

  update public.gambling_corner_rooms
  set status = 'playing',
      dice_phase = 'bet1',
      players = p_players,
      dice = p_dice,
      reroll_done = '{}'::jsonb,
      betting = p_betting,
      pot = p_pot,
      winner_ids = '[]'::jsonb,
      dealer_seat = p_dealer_seat,
      started_at = coalesce(v_room.started_at, now())
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

-- One turn-based betting action (check/bet/call/raise/fold/all-in). The
-- next `betting`/`players`/`pot`/`dice_phase` are computed client-side by
-- the shared BettingRound.js engine; this RPC's whole job is to REJECT the
-- call unless it's actually that player's turn, then apply atomically.
create or replace function public.dice_poker_bet_action(
  p_room_id uuid,
  p_player_id text,
  p_betting jsonb,
  p_players jsonb,
  p_pot integer,
  p_next_phase text
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
begin
  select * into v_room
  from public.gambling_corner_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.dice_phase not in ('bet1', 'bet2') then
    raise exception 'NOT_BETTING_PHASE';
  end if;
  if coalesce(v_room.betting->>'currentActor', '') <> p_player_id then
    raise exception 'NOT_YOUR_TURN';
  end if;
  if p_next_phase not in ('bet1', 'reroll', 'bet2') then
    raise exception 'INVALID_PHASE';
  end if;

  update public.gambling_corner_rooms
  set betting = p_betting,
      players = p_players,
      pot = p_pot,
      dice_phase = p_next_phase
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

-- A player commits their reroll (final 5-dice array after keep/reroll).
-- Reroll decisions are simultaneous, not turn-based, so this is a safe
-- per-key jsonb_set under concurrent writers — same reasoning as Category
-- Blitz's category_blitz_submit_answers.
create or replace function public.dice_poker_reroll_commit(
  p_room_id uuid,
  p_player_id text,
  p_dice integer[]
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
begin
  select * into v_room
  from public.gambling_corner_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.dice_phase <> 'reroll' then
    raise exception 'NOT_REROLL_PHASE';
  end if;
  if v_room.reroll_done ? p_player_id then
    return v_room; -- already committed, no-op
  end if;

  update public.gambling_corner_rooms
  set dice = jsonb_set(dice, array[p_player_id], to_jsonb(p_dice)),
      reroll_done = jsonb_set(reroll_done, array[p_player_id], 'true'::jsonb, true)
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

-- Moves reroll -> bet2 once every non-folded player has committed their
-- reroll. Idempotent: guarded on dice_phase='reroll' so a race between two
-- clients detecting completion at once is a harmless no-op for the loser.
create or replace function public.dice_poker_advance_phase(
  p_room_id uuid,
  p_betting jsonb
)
returns public.gambling_corner_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.gambling_corner_rooms;
begin
  update public.gambling_corner_rooms
  set dice_phase = 'bet2',
      betting = p_betting
  where id = p_room_id
    and dice_phase = 'reroll'
  returning * into v_room;

  if not found then
    select * into v_room from public.gambling_corner_rooms where id = p_room_id;
  end if;

  return v_room;
end;
$$;

-- Ends the hand: applies the showdown (or fold-out) payouts to `players`,
-- same trust model as gambling_corner_settle (winners/payouts computed
-- client-side from the now-fully-visible `dice`/`betting.folded`, since
-- there is no hidden information left to protect once the round is over).
-- Idempotent — a no-op once dice_phase is already 'showdown'.
create or replace function public.dice_poker_settle(
  p_room_id uuid,
  p_payouts jsonb,
  p_winner_ids jsonb,
  p_hands_played integer
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

  if v_room.dice_phase = 'showdown' or v_room.dice_phase = 'idle' then
    return v_room; -- already settled (or nothing dealt) — idempotent no-op
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
      dice_phase = 'showdown',
      hands_played = p_hands_played
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

grant execute on function public.dice_poker_deal(uuid, text, jsonb, jsonb, jsonb, integer, integer) to anon, authenticated;
grant execute on function public.dice_poker_bet_action(uuid, text, jsonb, jsonb, integer, text) to anon, authenticated;
grant execute on function public.dice_poker_reroll_commit(uuid, text, integer[]) to anon, authenticated;
grant execute on function public.dice_poker_advance_phase(uuid, jsonb) to anon, authenticated;
grant execute on function public.dice_poker_settle(uuid, jsonb, jsonb, integer) to anon, authenticated;
