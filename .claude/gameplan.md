# Lovelyland — Game Plan

Real-time (sync) pair games. Both players present at once, synced over Supabase
Realtime + room codes. Scales from 1v1 couple play to multiple pairs where noted.

---

## Survivors — already built, DO NOT rebuild or touch their logic

- **Draw Off** (`/draw-off`)
- **Connect Four** (`/connect-four`)
- **Sugaropoly** (`/monopoly`)
- **Tic-Tac-Toe** (`/tic-tac-toe`) ✅ shipped 2026-07-02
- **Quick-Maths Duel** (`/quick-maths`) ✅ shipped 2026-07-02
- **Word Race** (`/word-race`) ✅ shipped 2026-07-04
- **Category Blitz** (`/category-blitz`) ✅ shipped 2026-07-05
- **Gambling Corner — Indian Poker + Dice Poker + Hold'em** (`/gambling-corner`) ✅ Part 1 (Indian Poker) shipped 2026-07-05, Part 2 (Dice Poker) shipped 2026-07-06, Part 3 (Hold'em) shipped 2026-07-25 — **shipped, minor bugfixes remaining** (see `README.md` Todolist: Dice Poker small-screen layout needs another pass, Hold'em status-bar exit icon/room code display bug)

Their homepage cards stay.

---

## Build order (easiest → hardest)

1. ~~**Tic-Tac-Toe**~~ ✅ **SHIPPED** — `src/games/sugar/TicTacToe.jsx` + lobby + board. Supabase realtime room-code pattern proven end to end. Route: `/tic-tac-toe`.
2. ~~**Quick-Maths Duel**~~ ✅ **SHIPPED** — `src/games/sugar/QuickMaths*.jsx`. Seeded PRNG, realtime room, configurable number size / operations / operand count / rounds. Route: `/quick-maths`.
3. ~~**Word Race**~~ ✅ **SHIPPED** — `src/games/sugar/WordRace*.jsx` + `WordRaceRules.js` + `wordRaceWords.js`. Same hidden word (vendored `wordle-words` list), 6 guesses each, opponent board shows color feedback only (never letters), give-up/tie/both-solve handled via `resolveWinner()`. Route: `/word-race`.
4. ~~**Category Blitz**~~ ✅ **SHIPPED** — `src/games/sugar/CategoryBlitz*.jsx` + `CategoryBlitzRules.js` + vendored `categoryBlitzCategories.js`. One random letter, timer synced from `started_at`, race to fill a shared category list, then a **vote-tally** reveal (each player votes one answer per category, score = votes received). **Now 2–8 players** (`players` jsonb array + host-Start waiting room + `jsonb_set` RPCs for concurrent writes). Extra `reveal` status between playing/finished. Route: `/category-blitz`.
> **✅ DONE (2026-07-05) — Category Blitz multiplayer expansion.** The elevated
> change shipped: Category Blitz is now **2–8 players** with **vote-tally** scoring
> (one vote per category, score = votes received, no dupe rule), flow unchanged
> (the "creator decides what happens next" idea was dropped by the user). See the
> `category-blitz` + `category-blitz-multiplayer` memories.

5. **Gambling Corner** — A "gambling" hub: **three** card/dice bluff variants sharing one chip bankroll, as a difficulty/effort ladder so a couple picks by mood. **Indian Poker** (easy/silly — see the opponent's card, not your own, bet/fold), **Dice Poker** (medium — 5 dice, two re-rolls, poker hands, bet), **Heads-up Hold'em** (hard/standard — hole + community cards, betting rounds). N-player, not heads-up-only — see the ⚠ scope-change callout in the per-game notes. *(Replaced Spot-the-Difference + Speed Trivia Buzz.)*
> **✅ PART 1 SHIPPED (2026-07-05)** — shared N-player base (hub, lobby, chip
> bankroll, realtime room) + **Indian Poker** fully playable at `/gambling-corner`.
> `src/games/sugar/gambling/`: `GamblingCorner.jsx` (root), `GamblingHub.jsx`
> (mode picker — Dice Poker/Hold'em shown as disabled "coming soon" tiles),
> `GamblingLobby.jsx` (create/join + waiting room), `IndianPokerTable.jsx` (table:
> 3D card-flip reveal, spring chip counters, one-shot winner pulse), `IndianPokerRules.js`
> + tests (pure `dealHands`/`resolveRound`/`checkTableGameOver`). DB: `gambling_corner_rooms`
> (migration `20260705150000`, applied locally) with `gambling_corner_join`/`decide`/`settle`
> RPCs — **simultaneous stay/fold decisions, not sequential turn-based betting** (any
> dealt-in player decides whenever; round resolves once everyone has). Verified with a
> 3-client Playwright E2E (create → join × 2 → start → decide → reveal with correct
> chip math → deal next round → leave/abort). See the `gambling-corner` memory for
> full detail.
> **✅ PART 2 SHIPPED (2026-07-06)** — **Dice Poker**, real turn-based betting (unlike
> Indian Poker's simultaneous decide): ante → roll 5 dice → bet round 1 → one reroll →
> bet round 2 → showdown. New files: `DicePokerTable.jsx`, `DicePokerRules.js` (+
> tests — 5-dice hand eval/comparator), `BettingRound.js` (+ tests — a **shared,
> reusable, pure turn-based betting engine** with no dice/card knowledge, built so
> **Hold'em (Part 3) reuses it unchanged**). DB: migration `20260705180000` (ADD-only)
> adds `dice_phase`/`dice`/`reroll_done`/`betting`/`end_mode`/`hand_cap`/
> `hands_played`/`dealer_seat`, plus `dice_poker_deal`/`bet_action`/`reroll_commit`/
> `advance_phase`/`settle` RPCs — `bet_action` is the server-side turn guard (rejects
> unless the caller matches `betting.currentActor`). Host picks the end condition at
> creation: hand cap (5/8/10, most chips wins) or "all the way" (play until bust).
> Single main pot only (no side pots) — a documented simplification. Verified with a
> 3-context Playwright E2E asserting exact dice-ranked showdown winners (not just
> that a screen rendered) and a structural turn-order-blocking check.
> **✅ PART 3 SHIPPED (2026-07-25)** — **Hold'em**, fully playable, N-player (2-8),
> not heads-up-only. New file: `HoldemTable.jsx` + `HoldemRules.js` (+ tests —
> deck/shuffle, blind posting, showdown resolution via vendored `pokersolver`).
> Reuses `BettingRound.js` unchanged for every street's betting, and reuses Dice
> Poker's already-generic `end_mode`/`hand_cap`/`hands_played`/`dealer_seat`/
> `betting`/`winner_ids` columns rather than re-adding them. DB: migration
> `20260724120000` (ADD-only) adds `holdem_phase`/`hole_cards`/`community_cards`,
> plus `holdem_deal`/`bet_action`/`advance_street`/`settle` RPCs. Blinds are
> derived from `ante` (big blind) with small blind = half; standard button/SB/BB
> seat rotation for 3+ players, heads-up special-case (button posts SB, acts
> first preflop, last postflop). Community cards are dealt in full up-front like
> Dice Poker's dice (nothing hidden server-side) and the client only renders the
> first 0/3/4/5 for the current street. See the `gambling-corner` memory for two
> real bugs the build caught and fixed before shipping: a post-flop action-order
> bug (was reusing preflop's UTG-first order instead of rotating to start after
> the button) and a missing z-index on the dealer/blind seat badge. Verified with
> a 3-context Playwright E2E across 5 hands to a hand-cap game-over, using the
> room row fetched directly from the Supabase REST API (not DOM state) as the
> turn-order oracle to avoid realtime-propagation-lag false positives.

All three Gambling Corner variants are now shipped (minor bugfixes remaining —
see the callout in the Survivors list above and `README.md`'s Todolist).
6. **Verbal Memory (competitive)** ← **NEW** (user, 2026-07-05; build AFTER Gambling Corner) — a memory game with a competitive head-to-head twist. Concept from a playtester; design details TBD with the user before building. See the `verbal-memory-game` memory.
7. **Codenames Duet** — Co-op word association; give clues to find shared agents before turns run out.
> **Removed:** Tug-of-War (cut), Spot-the-Difference (cut), Speed Trivia Buzz (cut).
> **Parked:** Gerbil Ball, Same Wavelength — pulled out of the web build order, see "Parked ideas" at the bottom.

All leftover placeholder cards (`Battleship`, `Guess Who?`, `Checkers` in
`newGames`) have now been replaced by shipped games; `newGames` is empty. Future
games get a real `<Link>` + `<GameCard>` added directly — no placeholder to swap.

**GameExitScreen extraction — DONE (2026-07-04, Word Race pass):** the
abort/game-over modal now lives in `src/games/sugar/GameExitScreen.jsx`.
`QuickMathsDuel.jsx` and `WordRace.jsx` both import it — no duplicate definitions
left. **Connect Four was retrofitted 2026-07-24/25** (its `aborted` status now
renders `GameExitScreen`, but returns to Connect Four's own lobby via local
`setRoom(null)` instead of `navigate('/')` — see `skill-gamestructure`'s
GameExitScreen section for why that's a deliberate variant, not a bug). Tic-Tac-Toe
still stays on its own inline abort screen until a later pass.

---

## How to work (prompt for Sonnet)

You are building these games one at a time, top of the list down. For EACH game:

1. **Read the reference cards first** — `.claude/commands/skill-gamestructure.md`
   (file/folder conventions, routing, theme tokens, the minimal scaffold) and
   `.claude/commands/skill-supabase.md` (realtime + schema patterns). Do not
   invent structure — copy the existing Connect Four / Monopoly patterns.
2. **Match the four themes.** Every game must feel native to `theme-pink`,
   `theme-champagne`, `theme-arcade`, `theme-cozy`. Read `src/styles/index.css`
   and `src/components/ThemeProvider.jsx`. Use CSS tokens, not hardcoded colors.
3. **Build the vertical slice**: root component (state + Supabase realtime),
   lobby (create/join with room code), the game UI, and a `*-schema.sql` file.
   Place new games under `src/games/sugar/<game>/` (or a flat file for simple
   ones like Tic-Tac-Toe). Follow the naming in the gamestructure card.
4. **Wire it up**: import + `<Route>` in `src/App.jsx`, and swap a placeholder
   card in `src/pages/HomePage.jsx` for a real `<Link>` + `<GameCard>`.
5. **Ship it PRETTY on the first pass — this is a definition-of-done, not later
   polish.** The first playable version you show the user must already look
   presentable and native to all four themes (match the visual bar of the
   existing Monopoly/Connect Four screens — considered layout, tokens, motion,
   entrance animations). Do NOT hand over a bare functional prototype and promise
   to style it later. Run `ui-upgrade` to orchestrate the visual pass and
   delegate to `skill-shader-gradient`, `skill-liquid-glass`, `skill-reactbits`,
   `skill-animejs`, etc. as part of building the game, before the feedback
   checkpoint. Never let a UI skill touch game logic, state, or data fetching.
6. **Fan out subagents** for parallelizable chunks (e.g. one agent drafts the
   schema + realtime wiring while another builds the board UI). Keep game logic
   in pure, testable modules (`*Rules.js` + a `*.test.js`) like Monopoly does.
7. **Stop and ask the user for feedback** once a game is playable AND visually
   finished per step 5 (not before). Integrate the
   feedback, confirm it's good, THEN move to the next game. One game per cycle —
   do not batch-build the whole list before checking in.
8. Do not commit or push. The user controls all git commits.

### Data / asset sourcing (do NOT hand-author these)
- **Word Race**: bundle a small JS word list (answers + valid guesses) in-repo.
  Public Wordle word lists exist on GitHub — vendor one as a local array.
- **Category Blitz**: vendor a public Scattergories category list (many on
  GitHub / printable-list sites) as a local JS array. Do not hand-author.
- **Gambling Corner**: vendor `pokersolver` (or similar) for **Heads-up Hold'em**
  hand ranking — do NOT hand-write poker evaluation. Dice-poker hand eval is a
  small pure function. Indian Poker needs no dataset. Cards / dice / chips are
  rendered — no external art.
- **Same Wavelength**: vendor a public Wavelength spectrum-card list (fan-made
  GitHub repos / datasets have hundreds of "left↔right" pairs) as a local array.
- **Codenames Duet**: use an open-source Codenames word bank (public-domain
  noun lists on GitHub) or a common-English-nouns dataset. ~400 simple nouns.

### Per-game notes
1. **Tic-Tac-Toe** — Trivial. Flat file `src/games/sugar/TicTacToe.jsx`. No
   dataset, no assets. Good warm-up to prove the realtime room pattern end to end.
2. **Quick-Maths Duel** — Generate equations client-side from a seed so both
   players get the identical sequence; race to submit the correct answer. Keep
   difficulty tiers (add/sub → mult/div). Pure generator in a `*Rules.js`.
3. **Word Race** ✅ — Broadcast only row-by-row COLOR feedback to the opponent,
   not their letters. Live progress bar. Handle both-solve / tie and give-up
   cases. **Two things the user corrected live, apply to future games too:**
   (a) don't add two separate quit/forfeit buttons (had Abort + Give Up) —
   collapse into one contextual button; (b) functional status colors (right/
   wrong/absent-letter feedback) must NOT inherit a generic theme surface token
   (e.g. `--surface-strong`) — they washed out in multiple themes at once. Use
   fixed or per-theme-tinted colors instead (see `ABSENT_BY_THEME` in
   `WordRaceBoard.jsx` for the pattern: a distinct tint per theme, not flat gray).
4. **Category Blitz** — Categories come from a vendored public Scattergories list
   (see sourcing). **Skip automated dictionary validation** — use self/partner
   approve toggles on the reveal screen (dupes cancel). Timer synced from the
   room's start timestamp.
5. **Gambling Corner** — Three variants under one roof, sharing a chip
   bankroll + the realtime room pattern. Build the **shared base once** (room/lobby,
   chip stacks, showdown/reveal, exit screen), then the variants:
   > **⚠ Scope change (2026-07-05, user):** prefer supporting **N players (>2)** at a
   > table, not heads-up-only, while still working for a couple (2). Lean on
   > **Sugaropoly's N-player `players` jsonb array** for lobby/turn/seat order rather
   > than Connect Four's fixed two slots. BUT this is a *preference, not a hard
   > requirement* — if a variant's mechanic doesn't generalize past 2 cleanly, a
   > 2-player-only variant is fine (user: "lowkey fine"). Hold'em is naturally
   > multiplayer; Indian Poker / Dice Poker are the judgement calls.
   - **Indian Poker** *(easiest)* — see the opponent's card, not your own; bet /
     fold; high card wins. No hand-eval, barely any state.
   - **Dice Poker** *(medium)* — 5 dice, up to 2 re-rolls, dice-poker hand eval as
     a pure `*Rules.js` (+ tests), bet.
   - **Heads-up Hold'em** *(hard/standard)* — hole + community cards, betting
     rounds (preflop/flop/turn/river), blinds, pot. **Vendor `pokersolver`** for
     ranking. The betting-round state machine is the fiddly part but standard.

   All are no-voice bluff games; hidden state maps cleanly to the room row.
6. **Codenames Duet** — Co-op variant: shared 5×5 grid, alternating clues, shared
   win/lose, limited turns + assassin. Put grid/turn logic in a pure `*Rules.js`
   with tests. Needs the noun word bank above.

Work top-down, check in after each game, and keep everything theme-native.

---

## Parked ideas (NOT in the web build order)

- **Same Wavelength** — One clues a hidden point on a spectrum; partner turns a
  dial to guess. **Parked 2026-08-18:** pulled out of the build order to keep
  the queue focused after Gambling Corner shipped. If it gets picked back up:
  spectrum pairs come from a vendored public Wavelength list (see the "Data /
  asset sourcing" section above), the dial UI is the fiddly part, the
  clue-giver sees the hidden target while the guesser only sees the dial, and
  roles swap each round with scoring by closeness.

- **Gerbil Ball** — a 3D Super-Monkey-Ball-style co-op tilt roller. Novel mechanic:
  local 2-player co-op where both players input full direction and their **tilts
  SUM** into one shared heavy ball (synergy = speed, time-attack). **Parked
  2026-07-04:** it's the highest-friction, most feel-risky idea here and fits the
  frictionless-social web lane *least* (Wordle-style shareable/async games fit it
  best). Better as a future **standalone Unity project** — which also makes a
  stronger engine-studio portfolio piece than R3F-in-a-browser. Full design notes
  are preserved in the `gerbil-ball` memory. Don't build it into the web hub;
  revisit as its own engine project later.

---

## Backlog / to research (future, not scheduled — revisit between shipped games)

- **Retrofit the two-player E2E harness onto the earlier shipped games**
  (Tic-Tac-Toe, Quick-Maths Duel, Word Race). Category Blitz's build pass drove
  BOTH clients with two Playwright BrowserContexts and that's the only thing that
  surfaced its two realtime race bugs (a stale-`remaining` premature auto-submit and
  a lost-update approvals race) — build-green + unit-green + single-side manual all
  missed them. The three earlier games were verified with lighter testing and may be
  harboring similar two-client races (turn/claim ordering in Tic-Tac-Toe, the
  first-correct-answer claim in Quick-Maths, the both-done reconcile in Word Race).
  **To research:** stand up a reusable two-context E2E driver (see the
  `e2e-two-player-realtime-games` memory for the selector/timing traps) and run each
  of the three through a full both-sides round, asserting real outcomes; fix anything
  it finds. Not blocking new games — slot it in when appetite allows.

- **Tic-Tac-Toe on a bigger board (variable board size + win length).** Today it's a
  fixed 3×3. **To research:** generalize to an N×N board (e.g. 4×4 / 5×5) with a
  configurable win-length (k-in-a-row, à la Gomoku/m,n,k-games), chosen by the room
  creator like Quick-Maths' config chips. Keep win-detection in a pure `*Rules.js`
  (generic k-in-a-row scan over rows/cols/both diagonals) with tests; the schema
  needs the board array + `board_size`/`win_length` columns, and the board UI must
  stay legible as the grid grows (coin/cell sizing like the Sugaropoly crowded-tile
  concern). Decide whether it replaces or sits beside the current 3×3.

---

## Post-launch polish pass (playtester feedback 2026-07-05 — do after more games ship)

Batch of feedback from a real playtester (verbatim at the bottom of `README.md`). The
two elevated items were pulled OUT of this list: Category Blitz multiplayer expansion
(→ ELEVATED NEXT CHANGE above) and Verbal Memory competitive (→ build order #6). The
rest are a polish pass, not blocking new games — see the `playtester-feedback` memory.

- **Tic-Tac-Toe — winning-line highlight bug.** The win highlight misbehaves; fix it.
  (Candidate for the E2E-retrofit pass above.)
- **Tic-Tac-Toe — redundant buttons / exit.** It still has overlapping quit/exit
  controls; collapse to ONE contextual button like the newer games
  (`feedback-single-action-buttons`), and reuse the shared `GameExitScreen`.
- **Quick-Maths Duel — add a per-round timer.** Currently first-correct-answer with no
  clock; a visible round timer would raise the pressure (sync it off a server
  timestamp + deadline, NOT a stale local counter — see the Category Blitz board bug).
- **Emotes / stickers (cross-game).** A lightweight emote/sticker reaction feature the
  partner ("babie") wants — react to your opponent mid/post-game. Scope TBD: which
  games, sticker set, how it's broadcast over realtime.
