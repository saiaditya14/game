-- Category Blitz: 2-player -> N-player (2-8) migration.
-- Local dev only, no real data to preserve — drop the paired columns wholesale
-- and replace with a `players` jsonb array (seat = array index) plus
-- playerId-keyed maps for answers/submitted/votes/reviews/scores.

alter table public.category_blitz_rooms
  drop column if exists player_one,
  drop column if exists player_two,
  drop column if exists answers_one,
  drop column if exists answers_two,
  drop column if exists submitted_one_at,
  drop column if exists submitted_two_at,
  drop column if exists approvals_one,
  drop column if exists approvals_two,
  drop column if exists review_one_done,
  drop column if exists review_two_done,
  drop column if exists score_one,
  drop column if exists score_two,
  drop column if exists winner;

alter table public.category_blitz_rooms
  add column if not exists players jsonb not null default '[]'::jsonb,
  add column if not exists host_id text,
  -- answers: { playerId: string[] } — one array of answers (parallel to
  -- `categories`) per player. Each player writes ONLY their own key.
  add column if not exists answers jsonb not null default '{}'::jsonb,
  -- submitted: { playerId: isoTimestamp } — presence/lock-in timestamps.
  add column if not exists submitted jsonb not null default '{}'::jsonb,
  -- votes: { voterId: (targetPlayerId|null)[] } — one vote per category,
  -- indexed the same as `categories`; null = abstain.
  add column if not exists votes jsonb not null default '{}'::jsonb,
  -- reviews_done: { playerId: boolean } — true once that player confirmed
  -- their votes for the round.
  add column if not exists reviews_done jsonb not null default '{}'::jsonb,
  -- scores: { playerId: number } — total votes each player's answers
  -- received, computed once at reveal -> finished.
  add column if not exists scores jsonb not null default '{}'::jsonb,
  add column if not exists winner text;

-- ─── Safe concurrent per-player jsonb writes ────────────────────────────────
-- Plain client updates that read-modify-write a WHOLE shared jsonb column
-- (answers / votes) race under N concurrent writers: two players submitting
-- at once would each overwrite the other's key from a stale snapshot. These
-- RPCs use a single UPDATE ... SET col = jsonb_set(col, ...) statement, which
-- Postgres re-evaluates against the latest committed row version when a
-- concurrent writer holds the row lock (EvalPlanQual) — so concurrent calls
-- targeting DIFFERENT player keys never clobber each other.

create or replace function public.category_blitz_submit_answers(
  p_room_id uuid,
  p_player_id text,
  p_answers jsonb
)
returns public.category_blitz_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.category_blitz_rooms;
begin
  update public.category_blitz_rooms
  set answers   = jsonb_set(coalesce(answers, '{}'::jsonb), array[p_player_id], p_answers, true),
      submitted = jsonb_set(coalesce(submitted, '{}'::jsonb), array[p_player_id], to_jsonb(now()::text), true)
  where id = p_room_id
    and status = 'playing'
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.category_blitz_submit_votes(
  p_room_id uuid,
  p_player_id text,
  p_votes jsonb
)
returns public.category_blitz_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.category_blitz_rooms;
begin
  update public.category_blitz_rooms
  set votes        = jsonb_set(coalesce(votes, '{}'::jsonb), array[p_player_id], p_votes, true),
      reviews_done = jsonb_set(coalesce(reviews_done, '{}'::jsonb), array[p_player_id], 'true'::jsonb, true)
  where id = p_room_id
    and status = 'reveal'
  returning * into v_room;

  return v_room;
end;
$$;

-- Joining a room appends to the shared `players` array — also unsafe as a
-- plain read-modify-write under concurrent joiners. `select ... for update`
-- takes a row lock so concurrent joins serialize instead of clobbering.
create or replace function public.category_blitz_join(
  p_code text,
  p_player_id text
)
returns public.category_blitz_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.category_blitz_rooms;
  v_players jsonb;
  v_already_in boolean;
  v_name text;
begin
  select * into v_room
  from public.category_blitz_rooms
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

  v_name := 'Player ' || (jsonb_array_length(v_players) + 1)::text;
  v_players := v_players || jsonb_build_array(jsonb_build_object('id', p_player_id, 'name', v_name));

  update public.category_blitz_rooms
  set players = v_players
  where id = v_room.id
  returning * into v_room;

  return v_room;
end;
$$;

grant execute on function public.category_blitz_submit_answers(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.category_blitz_submit_votes(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.category_blitz_join(text, text) to anon, authenticated;
