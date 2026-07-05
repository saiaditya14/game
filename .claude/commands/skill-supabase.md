# Supabase Reference Card — Lovelyland

## Client setup

`src/lib/supabaseClient.js` — singleton exported as `supabase` (may be `null` if env vars are absent, so always guard with `if (!supabase)`).

```js
import { supabase } from '../../lib/supabaseClient';
```

Env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.  
Options: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`.

---

## Auth pattern

Two styles in use:

**Anonymous (Supabase Auth) — Monopoly**  
On mount, call `supabase.auth.getSession()`. If no session, call `supabase.auth.signInAnonymously()`. The resulting `session.user.id` is the stable `userId` used throughout the game. The userId persists across page reloads without any extra work.

**localStorage UUID — Connect Four**  
No Supabase Auth. A UUID is generated once and stored under a key (`lovelyland-connect-four-player-id`). Retrieved via `window.localStorage.getItem(key)` on every load.

Use Supabase Auth (anonymous) for games that need server-side identity (RPC functions, RLS). Use localStorage UUID for simple client-only identity.

---

## Database tables

### `connect_four_rooms`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `code` | text UNIQUE | 4-6 chars, uppercase |
| `board` | jsonb | flat array `number[42]`, values `null \| 1 \| 2` |
| `current_player` | int | `1` or `2` |
| `status` | text | `waiting \| playing \| won \| draw \| aborted` |
| `winner` | int | `1`, `2`, or `null` |
| `player_one` | text | localStorage UUID |
| `player_two` | text | localStorage UUID, nullable until joined |
| `last_move` | jsonb | `{ row, column, player, winning_cells, at }` |
| `started_at` | timestamptz | set on join |
| `created_at / updated_at` | timestamptz | auto-managed via trigger |

Schema file: `src/games/sugar/connect-four-schema.sql`

### `monopoly_rooms`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE | 4-6 chars |
| `host_id` | text | Supabase `user.id` |
| `players` | jsonb | array of player objects `{ id, name, money, position, active, … }` |
| `current_player_index` | int | index into `players` array |
| `status` | text | `waiting \| playing \| aborted` (also `setup`, `finished` in practice) |
| `latest_roll` | jsonb | most recent dice result |
| `event_log` | jsonb | append-only array of game events |
| `started_at` | timestamptz | |
| `created_at / updated_at` | timestamptz | auto-managed via trigger |

Additional runtime columns inferred from usage: `ownership` (jsonb, map of spaceId → deed), `pending_action` (jsonb), `turn_phase` (text: `awaiting_roll | awaiting_end_turn`), `consecutive_doubles` (int), `auction` (jsonb), `trades` (jsonb array), `winner_id` (text), `end_reason` (text).

Schema file: `src/games/sugar/monopoly-schema.sql`

### `word_race_rooms`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE | 4-6 chars |
| `status` | text | `waiting \| playing \| finished \| aborted \| closed` |
| `secret_word` | text | picked client-side at room creation from a vendored `wordle-words` answers list; readable by both clients like any other column, but the UI only ever renders the *opponent's* guesses as color tiles, never letters |
| `player_one` / `player_two` | text | localStorage UUID |
| `progress_one` / `progress_two` | jsonb | array of per-guess color arrays (`'correct' \| 'present' \| 'absent'`) — **colors only, the guessed word itself is never written to the DB** |
| `solved_one` / `solved_two`, `gave_up_one` / `gave_up_two` | boolean | per-player race outcome flags |
| `finished_one_at` / `finished_two_at` | timestamptz | set when that player solves/exhausts/gives up |
| `winner` | int | `1`, `2`, or `null` (draw) — computed by `resolveWinner()` in `WordRaceRules.js` once both players are done |

Schema file: `src/games/sugar/word-race-schema.sql`. Pattern for "each player only ever writes their own columns, a `useEffect` reconciles once both sides are done" — reuse this for any future race-style game where hidden state must stay asymmetric.

### `category_blitz_rooms`
2-8 players (originally a 2-player-only table; migrated in place — see `20260705120000_category_blitz_multiplayer.sql`).

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE | 4-6 chars |
| `status` | text | `waiting \| playing \| reveal \| finished \| aborted \| closed` — note the extra `reveal` phase |
| `players` | jsonb | array of `{ id, name }`; seat = array index; auto-named "Player 1", "Player 2", … by join order |
| `host_id` | text | localStorage UUID of `players[0]` (the creator) |
| `round_letter` | text | single letter; picked once at creation (to remember the category count) and re-picked for real when the host starts |
| `categories` | jsonb | array of category strings for the round |
| `timer_seconds` | int | 60 / 90 / 120, set by creator |
| `started_at` | timestamptz | set when the host starts (or on play-again); the shared countdown deadline = `started_at + timer_seconds` |
| `answers` | jsonb | map `{ playerId: string[] }`, parallel to `categories`; each player writes ONLY `answers[myId]` |
| `submitted` | jsonb | map `{ playerId: isoTimestamp }`; all players present ⇒ `playing→reveal` (or the timer expires) |
| `votes` | jsonb | map `{ voterId: (targetPlayerId\|null)[] }`, one vote per category, `null` = abstain; a player never votes for themself |
| `reviews_done` | jsonb | map `{ playerId: boolean }`; all true ⇒ `reveal→finished` |
| `scores` | jsonb | map `{ playerId: number }` — total votes that player's answers received, computed once at finalize by `computeScores` |
| `winner` | text | winning playerId, or `null` on an exact tie (including all-zero) |

Schema/migrations: `supabase/migrations/20260704180000_create_category_blitz_rooms.sql` (original 2-player table) + `supabase/migrations/20260705120000_category_blitz_multiplayer.sql` (the N-player migration — drops `player_one/two`-style paired columns, adds the jsonb-map columns above, and adds 3 RPCs).

**Safe concurrent per-player jsonb writes (RPCs, not plain updates):** `answers`/`votes`/`submitted`/`reviews_done`/`players` are shared jsonb columns written by MULTIPLE different players — a plain client read-modify-write races under N concurrent writers (unlike the old per-player top-level columns, e.g. `answers_one`/`answers_two`, which never collided). Three `security definer` RPCs do the merge server-side instead:
- `category_blitz_join(p_code, p_player_id)` — `select ... for update` row-locks the room, then appends `{id, name}` to `players` (rejects `ROOM_NOT_FOUND` / `ROOM_FULL` (8) / `ROOM_NOT_JOINABLE`).
- `category_blitz_submit_answers(p_room_id, p_player_id, p_answers)` — `jsonb_set`s `answers[playerId]` + `submitted[playerId]` in one `UPDATE`, guarded by `status='playing'`.
- `category_blitz_submit_votes(p_room_id, p_player_id, p_votes)` — `jsonb_set`s `votes[playerId]` + `reviews_done[playerId]` in one `UPDATE`, guarded by `status='reveal'`.

A single `UPDATE ... SET col = jsonb_set(col, ...)` is safe under concurrency because Postgres re-evaluates it against the latest committed row once a blocking concurrent writer's transaction commits (EvalPlanQual) — so two players writing to *different* keys in the same jsonb column never clobber each other, even though they'd race under a naive client-side read-then-write.

**Realtime gotchas this game hit (caught only by two/three-client E2E, not unit tests) — still apply at N players:** (1) a countdown that keys off `started_at` reads null on the creator's client until a peer joins — gate auto-submit on `Boolean(deadline) && Date.now() >= deadline`, never on a stale `remaining===0`, or you force-submit the creator on join; (2) never write a whole jsonb map from a stale realtime snapshot per-interaction — buffer votes/answers in local React state and write once (now via the RPCs above, since each writer targets a different key but the column itself is shared).

RLS policy on all tables above: open read/insert/update for `anon` and `authenticated` (no row-level restrictions — all access control is enforced in app logic or RPC functions).

All tables above are added to the `supabase_realtime` publication.

---

## Realtime subscription pattern

Subscribe after the room is known. Always clean up in the `useEffect` return.

```js
useEffect(() => {
  if (!supabase || !room?.id) return;
  const channel = supabase
    .channel(`game-room-${room.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'your_table', filter: `id=eq.${room.id}` },
      ({ new: next }) => { if (next) setRoom(next); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [room?.id]);
```

Connect Four listens for `event: '*'` (INSERT + UPDATE).  
Monopoly listens for `event: 'UPDATE'` only.

---

## Game state persistence / read patterns

**Room code flow:**
1. Creator calls `insert` → gets back a room row → `setRoom(data)`.
2. Joiner calls `.select('*').eq('code', code).maybeSingle()` to look up, then `update` to claim `player_two`.
3. Realtime subscription keeps both clients in sync from that point.

**RPC pattern (Monopoly):**  
All game actions go through Supabase RPC functions, not direct table updates. The returned value is the full updated room row. A shared `rpc` wrapper handles `setBusy`, `setError`, and calls `applyRoom(data)`.

```js
const rpc = async (name, args = {}) => {
  setBusy(true);
  const { data, error } = await supabase.rpc(name, args);
  setBusy(false);
  if (error) throw error;
  applyRoom(data);
  return data;
};
```

Known RPC functions: `monopoly_create_room`, `monopoly_join_room`, `monopoly_start_setup`, `monopoly_configure`, `monopoly_begin`, `monopoly_roll`, `monopoly_end_turn`, `monopoly_buy`, `monopoly_decline`, `monopoly_property_action`, `monopoly_bankrupt`, `monopoly_forfeit`, `monopoly_auction`, `monopoly_trade`, `monopoly_play_again`.

**Direct update pattern (Connect Four):**  
Game moves are `supabase.from(...).update({...}).eq('id', room.id).eq('current_player', playerNumber)` — the extra `.eq` acts as an optimistic concurrency guard.

**Room persistence across reload:**  
Monopoly stores `room.id` in `localStorage` under `ROOM_KEY` and re-fetches on mount. Connect Four does not persist room state across reloads (player re-enters lobby).
