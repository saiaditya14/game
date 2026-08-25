# Lovelyland Project Context

Lovelyland is a cute minigame hub built with Vite, React, Tailwind CSS, Framer Motion, Lucide icons, and Supabase for multiplayer prototypes. Keep new game work inside `src/games/sugar` or `src/games/plum`; shared styling lives mostly in `src/styles/index.css`.

## Working Style

- Preserve the existing cute/pastel direction, but favor readable, playable UI over decoration.
- Keep changes scoped and understandable. Reuse existing patterns before adding abstractions.
- For frontends, build the actual playable surface first, not a marketing page.
- Run `npm.cmd run build` after implementation changes.
- Keep static property/economy definitions in `monopolyData.js`; do not scatter rule values through components.

## Sugaropoly / Faerie Kingdom Quest

- Route: `/monopoly`, usually served locally as `http://127.0.0.1:5173/game/monopoly`.
- Source: `src/games/sugar/monopoly/`.
- Main files: `PastelMonopoly.jsx`, `MonopolyBoard.jsx`, `MonopolyDiceOverlay.jsx`, `MonopolyLobby.jsx`, `MonopolySidebar.jsx`.
- Styles are in `src/styles/index.css` under the Sugaropoly/Monopoly sections.
- Supabase migration: `supabase/migrations/20260612120000_create_monopoly_rooms.sql`.
- There is no `src/games/sugar/monopoly/monopoly-schema.sql` in the current checkout.

Current Sugaropoly is a playable authenticated property/economy game:

- Create/join rooms by code.
- Host starts from lobby.
- Supports 2-8 players.
- Players roll 2d8.
- Tokens wrap around a 56-space board.
- Turns, players, latest roll, and event log sync through Supabase Realtime.
- Dice overlay is local-only for the rolling player and should clear quickly.
- Leaving a room is local-client friendly and should not break the room for others.

Current visual/gameplay decisions:

- Keep the Faerie Kingdom Quest pastel board/topbar/sidebar direction.
- Current turn should be obvious in topbar/sidebar.
- Player pieces are circular, player-color coins.
- Coins should be large and readable when possible, using controlled overlap on board-space rails instead of shrinking too aggressively.
- Crowded tiles with 2-8 coins need manual testing; tune overlap/rail placement if needed.
- Token movement is whimsical teleportation, not path sliding: the coin disappears, pauses during dice reveal, then reappears on the destination.
- Teleport effects are player-colored and anchored to the exact token slot. Only ring and particle-ball effects are currently in rotation.
- Other players should not see someone else's dice overlay.
- Do not leave the board center blurred after dice roll.
- Roll visuals are edge-triggered by unique roll ID. Realtime or economy updates carrying the same `latest_roll` must never replay token movement.

Implemented in the June 14, 2026 economy handoff:

- structured property/card data and reusable inspection/landing cards
- buying, rent, auctions, buildings, mortgages, taxes, debt, trades, bankruptcy, and victory
- GO, Free Park, doubles, and Time Out rules
- silent Supabase anonymous Auth, member-only reads, denied direct writes, and validated RPC actions

Chance and Charm Chest decks remain intentionally deferred; their spaces are harmless placeholders.

Sugaropoly near-term todos:

- Test 4-8 player crowded tile readability and tune coin overlap/effect scale.
- Improve reconnect/resume-from-localStorage messaging.
- Eventually design a dedicated phone interaction pattern; tiny phones are not the base target right now.

Sugaropoly deferred visual polish:

- Color-code owned board tiles or ownership rails using the owner's player color.
- Add small house and hotel markers directly on developed board spaces, with readable 1-4 house and hotel states.
- Add clearer mortgaged-property treatment on the board, such as a muted band or compact mortgage badge.
- Add compact owner indicators to portal, utility, and crystal spaces.
- Improve ownership and development visibility in crowded 4-8 player games without shrinking coins excessively.
- Polish auction, trade, debt, Time Out, and bankruptcy controls to match the deed-card and victory-screen visual quality.
- Replace temporary card art slots with bespoke, replaceable Sugaropoly artwork later.
- Consider subtle complete-color-group highlighting and build-eligible cues during the owner's turn.

## Draw Off

- Draw Off has single-player and co-op modes.
- Single-player uses browser-side CLIP/Transformers.js today; avoid switching classifiers casually because prior options were brittle.
- Future AI improvements should prefer worker-based inference, cheap canvas completeness checks, and less distracting normal-play debug output.
- Draw Off UI pass done 2026-08-26: hub, single-player, co-op canvas, co-op lobby, co-op victory screen and BYOK landing rebuilt on the shared token/`clamp()` pattern; single-player got 5 brush presets (hairline->marker).
- Draw Off canvas gotcha: the canvas sits inside an `AnimatePresence mode="wait"` branch, so it is not mounted when an `isGameActive` effect fires. Initialise it from a **ref callback** (`attachCanvas`), never an effect, or the backing store silently stays at the browser default 300x150 and strokes render stretched and offset from the cursor. Backing store = CSS size x `min(devicePixelRatio, 2)` with a matching `ctx.setTransform`.
- Draw Off UI is COMPLETE as of 2026-08-26 - every mode and screen converted, no known open UI items. Note BYOK gates `draw()` on `userApiKey` by design - seed `localStorage['drawOffGeminiKey']` to test drawing there, or strokes are silently ignored.
- Co-op stroke broadcast payload is `{x0,y0,x1,y1,w}` - normalized 0-1 coords plus brush width; `w` is optional on read so older clients still render.
- `--pink` is not defined in any theme, but was referenced in Draw Off co-op - it renders transparent. Use `--primary`/`--accent`.

## Quick-Maths Duel

- Source: `src/games/sugar/QuickMaths*.jsx`.
- Route: `/quick-maths`.
- Supabase migration: `supabase/migrations/20260702130000_create_quick_maths_rooms.sql`.
- Config set by creator at room creation: number size (small/medium/large), operations (+ − / + − × / all), operands per question (2/3/4), rounds (5/10/15/20).
- Both clients generate identical question sequences from a shared `seed` via seeded PRNG — no server-side question logic.
- Abort (mid-game) sets `status='aborted'`; Exit (after game over) sets `status='closed'`. Both send both players home after 1.8 s.

`GameExitScreen` (the abort/game-over centered modal) was extracted into `src/games/sugar/GameExitScreen.jsx` during the Word Race build; `QuickMathsDuel.jsx` now imports it instead of defining it inline. Tic-Tac-Toe and other games were NOT retrofitted — that's a later pass.

## Word Race

- Source: `src/games/sugar/WordRace*.jsx`, `WordRaceRules.js` (+ tests), `wordRaceWords.js`.
- Route: `/word-race`.
- Supabase migration: `supabase/migrations/20260704120000_create_word_race_rooms.sql`.
- Secret word is picked server-side (client-generated on room creation) from a vendored `wordle-words` (MIT) answers list; the whole room row — including `secret_word` — is readable by both clients like every other game here, but the UI only ever renders the opponent's guesses as color tiles, never letters.
- Each player writes only their own `progress_one`/`progress_two` (jsonb color arrays), `solved_x`, `gave_up_x`, `finished_x_at` columns; a `useEffect` on every realtime update checks if both players are "done" (solved / gave up / exhausted 6 guesses) and finalizes `status='finished'` + `winner` once, guarded by `.eq('status','playing')`.
- One "Leave" button, not two: pre-opponent it aborts the empty room, mid-race it forfeits (opponent keeps playing to their own finish).
- Absent-letter tile color is a per-theme tint (not a generic surface token) — see `ABSENT_BY_THEME` in `WordRaceBoard.jsx`.
- `GameExitScreen` (see below) is shared with Quick-Maths Duel.

## Category Blitz

- Source: `src/games/sugar/CategoryBlitz*.jsx` (root `CategoryBlitz.jsx` + `CategoryBlitzLobby.jsx`, `CategoryBlitzBoard.jsx`, `CategoryBlitzReveal.jsx`), pure `CategoryBlitzRules.js` (+ tests), vendored `categoryBlitzCategories.js` (public Scattergories list).
- Route: `/category-blitz`. Supports **2–8 players** (originally shipped as a 2-player-only game; expanded in place).
- Supabase migrations: `supabase/migrations/20260704180000_create_category_blitz_rooms.sql` (original 2-player table) + `supabase/migrations/20260705120000_category_blitz_multiplayer.sql` (drops the paired `player_one/two`-style columns, adds an N-player `players` jsonb array + playerId-keyed maps). Both applied to LOCAL supabase.
- Scattergories-style: one random letter (`LETTER_POOL` excludes Q/U/V/X/Y/Z), a shared category list, race a timer synced from the room's `started_at`, then a **vote-tally reveal** (no partner-approval, no duplicate-cancellation). Creator picks timer (60/90/120s) + category count (6/8/10/12) at room creation; round_letter/categories are picked once at creation (just to remember the chosen count) and re-picked for real when the host starts.
- Identity: `localStorage` UUID (unchanged `lovelyland-category-blitz-player-id` key). Room row holds `players: {id,name}[]` (seat = array index, auto-named "Player 1", "Player 2", … by join order) + `host_id`.
- Status flow: `waiting → playing → reveal → finished` (+ `aborted`/`closed`). `waiting` now includes a host-run waiting room (players list + host-only "Start Game", enabled once ≥2 players joined) — this is NOT a mid-game host control, only pre-round setup.
- Answers are PRIVATE during play: each player writes ONLY `answers[myId]` + `submitted[myId]`. A `useEffect` flips `playing→reveal` once every player in `room.players` has submitted OR the shared timer has expired, and `reveal→finished` (computing `scores`/`winner` via `computeScores`/`resolveWinner`) once every player's `reviews_done[id]` is true.
- **Scoring is vote-tally**: in reveal, every player sees every OTHER player's answer per category (never their own) and casts ONE vote per category for the best answer, or abstains — no self-votes, no dupe-cancellation. A player's score = total votes their answers received across all categories. Winner = strict top score; an exact tie (including all-zero) shows a draw. In a 2-player room this degenerates naturally to a single approve/abstain toggle per category.
- **Safe concurrent writes**: since `answers`/`votes`/`submitted`/`reviews_done` are now shared jsonb MAPS (not per-player top-level columns like the old `answers_one`/`answers_two`), a plain client read-modify-write would race under N concurrent writers. Three Postgres RPCs (`category_blitz_join`, `category_blitz_submit_answers`, `category_blitz_submit_votes`) do the merge server-side with `jsonb_set` (answers/votes) or a `select ... for update` row lock (join), so concurrent writers targeting different player keys never clobber each other.
- Realtime race guards that must not regress (originally fixed during the 2-player E2E pass, re-verified for N players): (a) the board's countdown gates "time's up" on `Boolean(deadline) && Date.now() >= deadline`, never a stale `remaining`; (b) vote/answer writes are buffered in LOCAL React state and committed in ONE RPC call at lock-in/confirm, never per-toggle.
- Reuses shared `GameExitScreen`; one contextual Leave/Forfeit button. Leaving at any stage before `finished` aborts the whole room for everyone (no partial-room continuation with N players).

## Gambling Corner

- Source: `src/games/sugar/gambling/` — `GamblingCorner.jsx` (root), `GamblingHub.jsx` (mode-picker tiles), `GamblingLobby.jsx` (create/join + waiting room), `IndianPokerTable.jsx` + `IndianPokerRules.js` (+ tests), `DicePokerTable.jsx` + `DicePokerRules.js` (+ tests), `BettingRound.js` (+ tests, shared turn-based betting engine).
- Route: `/gambling-corner`. **Part 1 (shipped 2026-07-05)**: shared N-player base + Indian Poker. **Part 2 (shipped 2026-07-06)**: Dice Poker, fully playable. Heads-up Hold'em is still a disabled "coming soon" tile.
- Supabase migrations: `supabase/migrations/20260705150000_create_gambling_corner_rooms.sql` (base + Indian Poker) + `supabase/migrations/20260705180000_add_dice_poker_columns.sql` (Dice Poker, ADD-only, applied to local Supabase). Table `gambling_corner_rooms`: `players` jsonb array (`{id,name,chips,seat,active}`), `mode` (not-null: `indian_poker|dice_poker|holdem`), plus Indian Poker's `round_phase`/`hands`/`decisions` and Dice Poker's `dice_phase`/`dice`/`reroll_done`/`betting`/`end_mode`/`hand_cap`/`hands_played`/`dealer_seat` (all below), shared `pot`, `ante` (20), `starting_chips` (200), `winner_ids`.
- Identity: `localStorage` UUID (`lovelyland-gambling-corner-player-id`), same pattern as Category Blitz — not Supabase Auth.
- **Indian Poker rules**: everyone sees everyone else's card, never their own (client-side render skip, like Word Race's hidden `secret_word` — nothing is actually hidden server-side). Every dealt-in player independently decides `stay` (pay the ante into the pot) or `fold` (forfeit) whenever they want — **simultaneous decisions, no turn order and no raising**, closer to Category Blitz's simultaneous-vote model than a real poker betting round. Once every dealt-in player has decided, highest card among stayers takes the pot (ties split it).
- Indian Poker RPCs: `gambling_corner_join` (row-lock append to `players`), `gambling_corner_decide` (stay/fold), `gambling_corner_settle` (payouts computed client-side by `resolveRound`, idempotent no-op once `round_phase !== 'dealt'`). Dealing (`round_phase: idle→dealt`) is a plain host-gated update, not an RPC.
- Reuses shared `GameExitScreen`; leaving at any stage aborts the whole table for everyone.
- Indian Poker visual: 3D card-flip reveal, spring-animated chip counters (`AnimatedChips`), staggered seat-grid mount, one-shot winner-glow pulse.

### Dice Poker (Part 2)

Per hand: ante in → roll 5 dice each (hidden from opponents, own dice always visible) →
**real turn-based betting round 1** (check/bet/call/raise/fold/all-in, seat order) →
one reroll (each player keeps what they want, rerolls the rest, simultaneous not
turn-based) → **betting round 2** → showdown: best 5-dice poker hand among non-folded
players wins the pot (ties split it). N-player (2-8), ante-only, no blinds (deferred).

- **`BettingRound.js`** (pure, tested, `node --test`) — the shared turn-based betting
  engine: `createBettingRound`/`applyAction`/`isRoundClosed`/`remainingContenders`/
  `potContribution`. Deliberately game-agnostic (no dice/card knowledge) so **Hold'em
  (Part 3) reuses it unchanged** for its own betting rounds. Single main pot only, no
  side pots — a documented simplification for 2-8 player couples games, not
  tournament-grade. All-in/raise/fold/check-close logic fully unit tested.
- **`DicePokerRules.js`** (pure, tested) — 5-dice hand evaluator (`evaluateHand`/
  `compareHands`, categories five-of-a-kind down to high-die, 1-5 and 2-6 straights,
  correct tiebreaks), `dealDice`/`rerollDice`, `resolveShowdown` (best hand among
  non-folded, ties split), `splitPot`, `checkTableGameOver` (bust mode: last player
  with chips wins; hands mode: stop at `hand_cap`, most chips wins, ties list every
  winner).
- **End condition** (host-chosen at table creation, stored on the room): `end_mode`
  `'hands'` (`hand_cap` 5/8/10, most chips wins after the cap) or `'bust'` (play until
  one player has all the chips). A player hitting 0 chips is eliminated in both modes.
- **Schema additions** (`20260705180000`, ADD-only, never touches Indian Poker's
  columns): `dice_phase` (`idle|bet1|reroll|bet2|showdown`), `dice` (map
  `{playerId: number[5]}`, committed dice only — reroll keep-selection stays in local
  React state until confirmed, the Category Blitz "buffer locally, commit once"
  pattern), `reroll_done` (map `{playerId: true}`), `betting` (the serialized
  `BettingRound.js` state — order/currentActor/toCall/minRaise/committed/acted/folded/
  allIn — computed client-side and applied atomically by the RPCs below, the same
  trust model `gambling_corner_settle` already uses), `end_mode`/`hand_cap`/
  `hands_played`, `dealer_seat` (rotates the first-to-act seat each hand).
- **RPCs**: `dice_poker_deal` (host-gated, applies a precomputed hand: dice, antes
  deducted, fresh betting round), `dice_poker_bet_action` (rejects unless
  `p_player_id` matches `betting->>'currentActor'` — the server-side turn guard the
  brief called for — then applies the next betting state/players/pot/phase computed
  client-side), `dice_poker_reroll_commit` (per-key `jsonb_set` on `dice`/
  `reroll_done`, safe under concurrent simultaneous rerolls like Category Blitz's
  answer submission), `dice_poker_advance_phase` (reroll→bet2 once every non-folded
  player has committed, idempotent), `dice_poker_settle` (applies payouts on a
  fold-out or a closed final betting round, idempotent once `dice_phase==='showdown'`).
- **Phase transitions live client-side**: whichever player's action closes a betting
  round computes the next phase (`bet1`→`reroll` if 2+ contenders remain, or stays
  put with `currentActor:null` signaling "closed" if only one contender remains or
  it's bet2) in the same RPC call; a `useEffect` on any client detects a closed round
  or a fully-rerolled table and calls `dice_poker_advance_phase`/`dice_poker_settle`
  — both idempotent, so a race between multiple clients noticing at once is harmless.
- **Visual**: dice render via lucide `Dice1`-`Dice6` icons (no external art); each die
  does a staggered spring "tumble" (scale+rotate+fade) whenever its value changes
  (deal/reroll/showdown); a themed `.dice-poker-slider` CSS class (in
  `src/styles/index.css`) replaces the native range-input chrome for the bet/raise
  slider across all four themes; status colors (active/fold/all-in/turn/win) follow
  Indian Poker's fixed-per-theme-hex template, never a generic surface token.
- Verified with a 3-context Playwright E2E: create with a hand-cap config → 2 join →
  host start → bet round 1 (bet + raise + 2 calls) → reroll → bet round 2 (check-
  around) → showdown with the dice independently re-evaluated and compared against
  the displayed winner (exact hand-ranking match, not just "a screen rendered") →
  turn-order guard asserted (non-actor has zero action controls rendered) → repeat
  hands to the hand cap → game-over banner → exit flow. See the `gambling-corner`
  memory for the realtime-timing traps this build hit (uppercase-arcade text
  breaking a lowercase string match; actor-detection races needing poll-based waits,
  not fixed sleeps).
- **Next (Part 3, later session)**: Heads-up Hold'em reuses `BettingRound.js`
  unchanged for its betting rounds; needs hole + community cards, a vendored
  `pokersolver` for hand ranking, and its own schema columns.

## Shared abort / game-over modal

- `src/games/sugar/GameExitScreen.jsx` — extracted from `QuickMathsDuel.jsx` during the Word Race build. Handles `status="aborted"` and `status="closed"`, both auto-navigating home after 1.8s. Currently consumed by Quick-Maths Duel and Word Race only; other games (Tic-Tac-Toe, Connect Four) keep their own abort screens until a later retrofit pass.

## Connect Four

- Source: `src/games/sugar/ConnectFour.jsx` (root), `ConnectFourLobby.jsx`, `ConnectFourBoard.jsx`, `ConnectFourLanterns.jsx` (Cozy-only decoration, see below).
- Route: `/connect-four`.
- Supabase schema/migration exist for `connect_four_rooms`.
- Pieces must stay true circles with stable keys so old pieces do not reanimate on every realtime update.

**UI-upgrade pass (2026-07-24/25), Arcade theme — fully revamped:** neon void backdrop + drifting piece watermarks in the background, `DecryptedText` scramble-reveal title, `MagneticButton` cursor-follow Create/Join buttons, glowing copy-to-clipboard room-code display, arcade-cased copy throughout, neon-glowing player badges/board frame/win-line/discs, and a CSS sparkle-burst celebration on the win modal (fires once for the winner, colored via theme tokens so it also reads correctly in the other 3 themes). Glow intensity was dialed down ~25-30% after user feedback that the first pass was too bright — treat the current box-shadow/textShadow/filter values as the tuned baseline.

**Pink and Champagne have NOT had a dedicated theme pass yet** — the user wants these done one at a time, on explicit request (see the `feedback-ui-upgrade-workflow` memory). Only cross-theme bugfixes and small targeted changes have landed on top of the base styling for those two so far.

**Cross-theme changes (apply regardless of which theme pass is "official"):**
- Piece-color overrides where the shared `--primary`/`--accent` tokens were too similar to tell P1/P2 apart: Pink is now dark-pink `#9d174d` (P1) vs. light-pink `#f472b6` (P2); Cozy's P2 is overridden to a cool teal `#3f7a8c` against P1's warm gold `--primary`. See `DISC_COLOR_OVERRIDE` in `ConnectFourBoard.jsx`.
- Cozy also has hanging paper lanterns (`ConnectFourLanterns.jsx`) — 5 lanterns built from user-supplied `images/lan1-5.svg` (transparent versions stripped of their baked-in opaque backgrounds live in `images/lanterns/`), swaying independently with a warm glow. This replaced an earlier rain-streak effect that was tried first and explicitly rejected in favor of lanterns — don't reintroduce rain.
- Fixed several `text-foreground`/`bg-primary`-on-`<button>`/`<input>` instances that rendered as invisible black text on dark themes — this repo's Tailwind build doesn't apply `color: inherit` resets to form controls, so bare/dead utility classes there fall back to native black. See the `project-tailwind-build-quirks` memory and `skill-gamestructure`'s expanded Tailwind section for the full (much bigger than previously documented) list of dead utility categories in this repo.
- Removed the per-turn timer and the Settings button (direct user request, not bug-driven).
- Added a "Restart game" button in the win/draw modal — calls a new `playAgain()` in the root `ConnectFour.jsx` that resets the room to a fresh game while keeping both players in it.
- Fixed a real bug where aborting got stuck forever on "Game Aborted / Returning home…" with no actual return — `GameExitScreen` has no navigation logic of its own, and Connect Four never had the `useEffect`+`navigate` that other games rely on. Now returns to Connect Four's own lobby via local `setRoom(null)` (not `navigate('/')` to the site home — a deliberate difference from Word Race/Quick-Maths/Category Blitz/Gambling Corner's pattern; see `skill-gamestructure`'s GameExitScreen note).

See the `project-connect-four-arcade-pass` memory for full detail on this pass.
