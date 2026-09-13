# Handoff: Gambling Corner bugfixes (Hold'em status-bar overlap + Dice Poker small-screen layout)

Confirmed with the user (2026-09-13) as the next README NEXT UP item to pick
up. Load `feedback-pacing-directness` and `feedback-commits` memories first —
this user wants fast, direct action on well-scoped tasks and controls all git
commits themselves (never run `git add`/`git commit`/`git push`).

Two items bundled from the README:
- "Dice Poker: small-screen layout is in but doesn't fully match the vision
  yet — revisit."
- "Hold'em: exit icon + room code chip overlap in the table status bar —
  fix."

Both were reproduced this session with two-context Playwright runs at a
390×844 phone viewport (iPhone SE-ish) against the local dev server + local
Supabase, not just read from code. Findings below are verified, not guessed.

## Bug 1: room-code chip / leave button hidden behind the sticky NavBar

**This is the real mechanism — it's not actually a *layout overlap* in the
CSS sense, it's a scroll-position bug that makes the table's status bar
render underneath the site's sticky header.**

Root cause, traced with real DOM measurements:
- The site's `<header>` in `src/components/NavBar.jsx` is `position: sticky;
  top: 0; z-index: 50` (src/components/NavBar.jsx:64) — normal and correct
  on its own.
- `TableStatusBar` (`src/games/sugar/gambling/TableStatusBar.jsx`) renders
  the room-code chip + leave button as the very first thing inside each
  table's root container — see usages at
  `src/games/sugar/gambling/HoldemTable.jsx:249`,
  `src/games/sugar/gambling/DicePokerTable.jsx:267`, and
  `src/games/sugar/gambling/IndianPokerTable.jsx:149`.
- `GamblingCorner.jsx` renders Hub → Lobby (create/join + waiting room) →
  Table entirely as **internal React state**, not real route/URL changes —
  see `mode`/`room` state at `src/games/sugar/gambling/GamblingCorner.jsx:42-45`
  and the render switch around line 531 (`GamblingHub`) / 536 (`GamblingLobby`,
  `onBack={() => setMode(null)}`) down to the `HoldemTable`/`DicePokerTable`/
  `IndianPokerTable` renders. Because it's all one route, **the browser never
  resets scroll position between these screens** — no route change means no
  natural scroll-to-top, and nothing in this component does it manually.
- `GamblingHub`'s card (`src/games/sugar/gambling/GamblingHub.jsx`) is taller
  than a phone viewport (measured 1081px document height vs 844px viewport
  at 390px width) because it centers 3 mode tiles vertically in a
  `min-h-[calc(100vh-5rem)]` column. On a real phone, or when Playwright
  auto-scrolls a below-the-fold tile into view to click it (verified: this
  happens for the **Hold'em** tile, which is the 3rd/bottom tile in the
  `MODES` array in GamblingHub.jsx, and does *not* happen for the Dice Poker
  tile, which sits higher — this asymmetry is exactly why the bug report
  singles out Hold'em), the page ends up scrolled ~80px down.
- That leftover scroll position (verified via `window.scrollY` — measured 84
  in one repro run) carries straight through Lobby and into the Table view.
  Since `TableStatusBar` sits at the very top of the table's root container,
  its first ~80px of vertical space is now scrolled up underneath the sticky
  header (z-index 50), so the room-code chip and leave/exit icon render
  **behind** the header instead of below it — visually reads as "overlap"
  with the header's own home icon / theme swatches.
- Confirmed via DOM measurement: with scrollY ≈ 84, the leave button's
  bounding box was `{x:330, y:9, height:36}` — squarely inside the sticky
  header's own box (`{x:8, y:0, width:374, height:68}`), i.e. genuinely
  covered by it, not just close to it.

**Fix direction**: add a scroll-to-top on screen transitions inside
`GamblingCorner.jsx` — e.g. a `useEffect` that fires `window.scrollTo(0, 0)`
(or the scroll container's equivalent) whenever `mode` changes or `room`
transitions into a started/table state. A single fix there covers all three
tables (Hold'em, Dice Poker, Indian Poker) since they share
`TableStatusBar`. Don't fix this by re-positioning `TableStatusBar` itself
(e.g. giving it `position: sticky` with a top offset) unless the scroll-reset
approach turns out insufficient — the actual bug is stale scroll state, not
the component's own layout.

## Bug 2: Dice Poker small-screen layout ("doesn't match the vision")

The README wording is vague ("doesn't fully match the vision yet") with no
linked spec, so **confirm with the user what the intended vision was before
building a fix** — don't guess a redesign. What this session verified by
screenshotting `src/games/sugar/gambling/DicePokerTable.jsx` at 390×844:

- The betting action row (Check / raise-slider / Bet / All In / Fold —
  rendered around `src/games/sugar/gambling/DicePokerTable.jsx:330-374`) sits
  **below the fold** on a phone viewport. The dice + player-panel stack above
  it (community-less, just the two player cards with 5 dice each) already
  consumes close to the full 844px viewport height, so the controls that
  actually let you act on your turn require scrolling down to find — with no
  visual cue from the initial viewport that they exist.
- Once scrolled into view, the controls render as two stacked rows (Check +
  raise slider on one row, Bet / All In / Fold on a second row) — functional
  but cramped, and it's plausible "the vision" wanted these either more
  compact, pinned near the bottom of the viewport, or otherwise reachable
  without a scroll. Worth asking the user directly what "the vision" refers
  to (a prior conversation? a sketch?) rather than assuming.
- Bug 1's scroll-carryover issue affects Dice Poker too (same
  `TableStatusBar`, same root cause) — worth confirming it's actually fixed
  for Dice Poker as part of Bug 1's fix, not just Hold'em.
- Unrelated minor oddity spotted while reproducing, not in the original ask:
  in one repro run the acting player's own status text read "THEIR TURN"
  while their own Check/Bet/Fold buttons were visibly rendered (i.e. it *was*
  their turn). Didn't investigate further since it's out of scope — flag to
  the user, don't fix unless asked.

## Verification

Both fixes should be re-verified the same way they were found:
- Two-context Playwright run (like the rest of this project's realtime
  games) at a phone viewport (390×844 worked well), driving both a
  Hold'em/Dice Poker/Indian Poker table through create → join → start.
- For Bug 1: after starting the game, assert `window.scrollY` is 0 (or that
  `[aria-label="Copy room code"]` / `[aria-label="Leave table"]` bounding
  boxes sit below the NavBar's bounding box, not inside it) on both the
  creator's and joiner's page — especially for Hold'em, since its tile is
  the one that reliably triggers the scroll in the first place.
- For Bug 2: whatever the user confirms as "the vision" — re-screenshot at
  390×844 and compare.

## Do NOT touch without separate sign-off

- Anything about turn order, betting math, or hand evaluation
  (`BettingRound.js`, `DicePokerRules.js`, `HoldemRules.js`,
  `IndianPokerRules.js`) — this is a layout/scroll bug, not a rules bug.
- Don't commit or push — the user controls all git commits.
- Don't scope-creep into "the vision" redesign without the user confirming
  what that means first.
