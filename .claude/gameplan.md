# Lovelyland — Game Plan

Real-time (sync) pair games. Both players present at once, synced over Supabase
Realtime + room codes. Scales from 1v1 couple play to multiple pairs where noted.

---

## Survivors — already built, DO NOT rebuild or touch their logic

- **Draw Off** (`/draw-off`)
- **Connect Four** (`/connect-four`)
- **Sugaropoly** (`/monopoly`)

Their homepage cards stay. Keep Tic-Tac-Toe and Word Race cards too (below).

---

## Build order (easiest → hardest)

1. **Tic-Tac-Toe** — Classic 3×3; both play live, first to three in a row.
2. **Quick-Maths Duel** — Rapid-fire arithmetic; first correct answer each round scores.
3. **Tug-of-War** — Both mash to drag the rope marker to their side; best-of.
4. **Word Race** — Same hidden word; both race Wordle-style with a live opponent progress bar.
5. **Category Blitz** — One random letter, race to fill categories before the timer.
6. **Same Wavelength** — One clues a hidden point on a spectrum; partner turns a dial to guess.
7. **Spot-the-Difference** — Two near-identical images; first to tap all differences wins. *(optional — may slip on assets)*
8. **Codenames Duet** — Co-op word association; give clues to find shared agents before turns run out.
9. **Speed Trivia Buzz** — Question appears; first to buzz-in answers, miss opens it to the other.

As each game ships, replace one of the leftover placeholder cards on the homepage
(`Battleship`, `Guess Who?`, `Checkers` in `newGames`) with the real game + route.

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
- **Codenames Duet**: use an open-source Codenames word bank (public-domain
  noun lists on GitHub) or a common-English-nouns dataset. ~400 simple nouns.
- **Speed Trivia Buzz**: pull from the **Open Trivia DB (OpenTDB)** free API, or
  vendor its downloadable dump / a Kaggle trivia JSON. Do not write questions.
- **Category Blitz**: vendor a public Scattergories category list (many on
  GitHub / printable-list sites) as a local JS array. Do not hand-author.
- **Same Wavelength**: vendor a public Wavelength spectrum-card list (fan-made
  GitHub repos / datasets have hundreds of "left↔right" pairs) as a local array.
- **Spot-the-Difference**: hardest asset problem. Prefer AI-generated image
  pairs, or take a free base image (Unsplash/Pexels API, or a Kaggle image set)
  and author the differences programmatically. If assets block progress, defer
  this game and move on — it is marked optional.

### Per-game notes
1. **Tic-Tac-Toe** — Trivial. Flat file `src/games/sugar/TicTacToe.jsx`. No
   dataset, no assets. Good warm-up to prove the realtime room pattern end to end.
2. **Quick-Maths Duel** — Generate equations client-side from a seed so both
   players get the identical sequence; race to submit the correct answer. Keep
   difficulty tiers (add/sub → mult/div). Pure generator in a `*Rules.js`.
3. **Tug-of-War** — Shared rope value in the row; each tap nudges it. **Debounce
   / batch taps** before writing to Supabase so realtime isn't hammered — send
   accumulated deltas on an interval, not per-tap.
4. **Word Race** — Broadcast only row-by-row COLOR feedback to the opponent, not
   their letters. Live progress bar. Handle both-solve / tie and give-up cases.
5. **Category Blitz** — Categories come from a vendored public Scattergories list
   (see sourcing). **Skip automated dictionary validation** — use self/partner
   approve toggles on the reveal screen (dupes cancel). Timer synced from the
   room's start timestamp.
6. **Same Wavelength** — Spectrum pairs come from a vendored public Wavelength
   list (see sourcing). The dial UI is the fiddly part; the clue-giver sees the
   hidden target, the guesser only sees the dial. Swap roles each round, score by
   closeness.
7. **Spot-the-Difference** — See asset note. Optional; defer if it blocks.
8. **Codenames Duet** — Co-op variant: shared 5×5 grid, alternating clues, shared
   win/lose, limited turns + assassin. Put grid/turn logic in a pure `*Rules.js`
   with tests. Needs the noun word bank above.
9. **Speed Trivia Buzz** — Sync the question from the room so both see it at once;
   first buzz locks answering; wrong answer opens it to the other. Pull questions
   from OpenTDB (cache a batch in the room row so both clients agree).

Work top-down, check in after each game, and keep everything theme-native.
