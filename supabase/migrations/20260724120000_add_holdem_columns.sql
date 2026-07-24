-- Gambling Corner — Part 3: Heads-up/N-player Hold'em. ADD-ONLY migration;
-- never touches Indian Poker's or Dice Poker's existing columns/RPCs.
--
-- Hold'em reuses several already-generic columns from the Dice Poker
-- migration rather than re-adding them: `betting` (same BettingRound.js
-- shape), `pot`, `ante` (doubles as the big blind — small blind is half),
-- `end_mode`/`hand_cap`/`hands_played` (same hand-cap-or-bust end condition),
-- `dealer_seat` (rotates the button each hand), `winner_ids`. Only cards and
-- the street phase are genuinely new state.
alter table public.gambling_corner_rooms
  add column if not exists holdem_phase text not null default 'idle'
    check (holdem_phase in ('idle', 'preflop', 'flop', 'turn', 'river', 'showdown')),
  -- hole_cards: { playerId: [card, card] }, e.g. { "abc": ["Ah", "Td"] }.
  -- Like Dice Poker's own-dice-always-visible rule, a player's OWN hole
  -- cards render client-side; opponents' hole cards render only at showdown
  -- or once they've folded out of contention — nothing is hidden server-side.
  add column if not exists hole_cards jsonb not null default '{}'::jsonb,
  -- community_cards: up to 5 cards, all dealt up-front like `dice`/`hands`
  -- elsewhere in this table; the client only RENDERS the first N cards for
  -- the current street (0/3/4/5 for preflop/flop/turn/river).
  add column if not exists community_cards jsonb not null default '[]'::jsonb;

-- ─── RPCs ────────────────────────────────────────────────────────────────

-- Host deals a fresh hand: blinds are already posted (chips deducted, pot
-- credited) client-side by the pure `dealHoldemRound` helper, same trust
-- model as dice_poker_deal's precomputed ante deduction.
create or replace function public.holdem_deal(
  p_room_id uuid,
  p_host_id text,
  p_players jsonb,
  p_hole_cards jsonb,
  p_community_cards jsonb,
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
  if v_room.mode <> 'holdem' then
    raise exception 'WRONG_MODE';
  end if;
  if v_room.status not in ('waiting', 'playing') then
    raise exception 'ROOM_NOT_PLAYABLE';
  end if;
  if v_room.holdem_phase not in ('idle', 'showdown') then
    raise exception 'HAND_IN_PROGRESS';
  end if;

  update public.gambling_corner_rooms
  set status = 'playing',
      holdem_phase = 'preflop',
      players = p_players,
      hole_cards = p_hole_cards,
      community_cards = p_community_cards,
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

-- One turn-based betting action within the CURRENT street. Unlike Dice
-- Poker's bet_action, this never changes `holdem_phase` itself — street
-- advancement is a separate step (holdem_advance_street below) because it
-- can also happen with no player action at all (an all-in runout).
create or replace function public.holdem_bet_action(
  p_room_id uuid,
  p_player_id text,
  p_betting jsonb,
  p_players jsonb,
  p_pot integer
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
  if v_room.holdem_phase not in ('preflop', 'flop', 'turn', 'river') then
    raise exception 'NOT_BETTING_PHASE';
  end if;
  if coalesce(v_room.betting->>'currentActor', '') <> p_player_id then
    raise exception 'NOT_YOUR_TURN';
  end if;

  update public.gambling_corner_rooms
  set betting = p_betting,
      players = p_players,
      pot = p_pot
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

-- Moves to the next street once the current street's betting has closed
-- with 2+ contenders remaining (a fold-out or a closed river instead settle
-- directly via holdem_settle). Idempotent: guarded on `p_from_phase` still
-- matching, so a race between two clients noticing the close at once is a
-- harmless no-op for the loser — same pattern as dice_poker_advance_phase.
create or replace function public.holdem_advance_street(
  p_room_id uuid,
  p_from_phase text,
  p_to_phase text,
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
  if p_to_phase not in ('flop', 'turn', 'river') then
    raise exception 'INVALID_PHASE';
  end if;

  update public.gambling_corner_rooms
  set holdem_phase = p_to_phase,
      betting = p_betting
  where id = p_room_id
    and holdem_phase = p_from_phase
  returning * into v_room;

  if not found then
    select * into v_room from public.gambling_corner_rooms where id = p_room_id;
  end if;

  return v_room;
end;
$$;

-- Ends the hand: applies showdown (or fold-out) payouts, same trust model as
-- dice_poker_settle. Idempotent — a no-op once holdem_phase is already
-- 'showdown' (or nothing has been dealt yet).
create or replace function public.holdem_settle(
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

  if v_room.holdem_phase = 'showdown' or v_room.holdem_phase = 'idle' then
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
      holdem_phase = 'showdown',
      hands_played = p_hands_played
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

grant execute on function public.holdem_deal(uuid, text, jsonb, jsonb, jsonb, jsonb, integer, integer) to anon, authenticated;
grant execute on function public.holdem_bet_action(uuid, text, jsonb, jsonb, integer) to anon, authenticated;
grant execute on function public.holdem_advance_street(uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.holdem_settle(uuid, jsonb, jsonb, integer) to anon, authenticated;
