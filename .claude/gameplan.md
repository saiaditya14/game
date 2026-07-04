# Lovelyland — Game Plan

Real-time (sync) pair games. Both players present at once, synced over Supabase
Realtime + room codes. Scales from 1v1 couple play to multiple pairs where noted.

> **Exception:** **Gerbil Ball** (bottom of the list) is a *local same-screen*
> co-op 3D game — no Supabase / no netcode for the POC. Everything else is
> Supabase-synced.

---

## Survivors — already built, DO NOT rebuild or touch their logic

- **Draw Off** (`/draw-off`)
- **Connect Four** (`/connect-four`)
- **Sugaropoly** (`/monopoly`)
- **Tic-Tac-Toe** (`/tic-tac-toe`) ✅ shipped 2026-07-02
- **Quick-Maths Duel** (`/quick-maths`) ✅ shipped 2026-07-02
- **Word Race** (`/word-race`) ✅ shipped 2026-07-04

Their homepage cards stay.

---

## Build order (easiest → hardest)

1. ~~**Tic-Tac-Toe**~~ ✅ **SHIPPED** — `src/games/sugar/TicTacToe.jsx` + lobby + board. Supabase realtime room-code pattern proven end to end. Route: `/tic-tac-toe`.
2. ~~**Quick-Maths Duel**~~ ✅ **SHIPPED** — `src/games/sugar/QuickMaths*.jsx`. Seeded PRNG, realtime room, configurable number size / operations / operand count / rounds. Route: `/quick-maths`.
3. ~~**Word Race**~~ ✅ **SHIPPED** — `src/games/sugar/WordRace*.jsx` + `WordRaceRules.js` + `wordRaceWords.js`. Same hidden word (vendored `wordle-words` list), 6 guesses each, opponent board shows color feedback only (never letters), give-up/tie/both-solve handled via `resolveWinner()`. Route: `/word-race`.
4. **Category Blitz** ← **NEXT** — One random letter, race to fill categories before the timer.
5. **Gambling Corner** — A heads-up "gambling" hub: **three** 2-player card/dice bluff variants sharing one chip bankroll, as a difficulty/effort ladder so a couple picks by mood. **Indian Poker** (easy/silly — see the opponent's card, not your own, bet/fold), **Dice Poker** (medium — 5 dice, two re-rolls, poker hands, bet), **Heads-up Hold'em** (hard/standard — hole + community cards, betting rounds). *(Replaced Spot-the-Difference + Speed Trivia Buzz; sits above Same Wavelength.)*
6. **Same Wavelength** — One clues a hidden point on a spectrum; partner turns a dial to guess.
7. **Codenames Duet** — Co-op word association; give clues to find shared agents before turns run out.
8. **Gerbil Ball (Arcade 3D roller)** ← **hardest, build LAST** — Super-Monkey-Ball-style tilt-the-world 3D roller; local same-screen 2-player co-op. Both players input full direction (two gamepads via Gamepad API, or WASD-vs-arrows); **tilts SUM** so synergy = speed → time-attack leaderboard. R3F + `@react-three/rapier`, heavy ball. **POC = Arcade motif only**, gated to `theme-arcade`.

> **Removed:** Tug-of-War (cut), Spot-the-Difference (cut), Speed Trivia Buzz (cut).

All leftover placeholder cards (`Battleship`, `Guess Who?`, `Checkers` in
`newGames`) have now been replaced by shipped games; `newGames` is empty. Future
games get a real `<Link>` + `<GameCard>` added directly — no placeholder to swap.

**GameExitScreen extraction — DONE (2026-07-04, Word Race pass):** the
abort/game-over modal now lives in `src/games/sugar/GameExitScreen.jsx`.
`QuickMathsDuel.jsx` and `WordRace.jsx` both import it — no duplicate definitions
left. Do NOT retrofit any OTHER game (Tic-Tac-Toe, Connect Four, etc.) yet —
those stay on their own abort screens until a later pass the user drives.

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
   *(Exception: **Gerbil Ball** matches themes by full per-theme **motif**, not
   token tint, and the POC ships only the Arcade motif — see its note.)*
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
- **Gerbil Ball**: engine libs = `three` + `@react-three/fiber` (already in repo)
  + `@react-three/rapier` (physics) + `drei` + postprocessing (bloom). The Arcade
  neon world is simple **emissive geometry from primitives** (cheap); source CC0
  low-poly models (Quaternius / Kenney 3D / Poly Pizza) only if needed. **No pixel
  art.** Runs 100% client-side on the static host; no Supabase for the local POC.

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
5. **Gambling Corner** — Three heads-up variants under one roof, sharing a chip
   bankroll + the realtime room pattern (copy Connect Four / Quick-Maths). Build
   the **shared base once** (room/lobby, chip stacks, showdown/reveal, exit
   screen), then the variants:
   - **Indian Poker** *(easiest)* — see the opponent's card, not your own; bet /
     fold; high card wins. No hand-eval, barely any state.
   - **Dice Poker** *(medium)* — 5 dice, up to 2 re-rolls, dice-poker hand eval as
     a pure `*Rules.js` (+ tests), bet.
   - **Heads-up Hold'em** *(hard/standard)* — hole + community cards, betting
     rounds (preflop/flop/turn/river), blinds, pot. **Vendor `pokersolver`** for
     ranking. The betting-round state machine is the fiddly part but standard.

   All are no-voice bluff games; hidden state maps cleanly to the room row.
6. **Same Wavelength** — Spectrum pairs come from a vendored public Wavelength
   list (see sourcing). The dial UI is the fiddly part; the clue-giver sees the
   hidden target, the guesser only sees the dial. Swap roles each round, score by
   closeness.
7. **Codenames Duet** — Co-op variant: shared 5×5 grid, alternating clues, shared
   win/lose, limited turns + assassin. Put grid/turn logic in a pure `*Rules.js`
   with tests. Needs the noun word bank above.
8. **Gerbil Ball (Arcade roller)** — The one NON-standard-architecture game and
   the one theme exception. **Local same-screen co-op — NO Supabase / no netcode
   for the POC.** R3F + `@react-three/rapier`: one tiltable level, a **heavy**
   ball, follow-camera. **Controls:** two gamepads (Gamepad API, distinct
   indices) *or* WASD-vs-arrows; both players' direction inputs **SUM** into the
   world tilt (aligned = steeper tilt = faster; opposed = cancel; fine control
   emerges when one eases off). Synergy → fast clears → **time-attack leaderboard**
   (personal bests). **Per-theme MOTIF, not palette tint** (user's explicit call):
   each theme is its own motif world; **POC ships the Arcade neon motif only**,
   gated to `theme-arcade`. Other themes' motif worlds are on-demand later.
   **Perf discipline:** merge static geo, keep movers *kinematic*, one shadow
   light, cap simultaneous dynamic bodies. Model the POC level closely on a real
   Monkey Ball stage for tuning. The real work is **feel-tuning** (heavy-ball
   momentum, tilt response, the sum cap), not rendering. *Remote play (later):*
   single machine runs the game, relay P2's keystrokes over Supabase, Discord
   screen-share carries P2's view — accept that P2 eats stacked input + stream lag.

Work top-down, check in after each game, and keep everything theme-native.
