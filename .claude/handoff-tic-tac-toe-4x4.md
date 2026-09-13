# Handoff: Tic-Tac-Toe 4x4 board

Confirmed with the user (2026-09-13) as the next README "NEXT UP" item. Load
`feedback-pacing-directness` and `feedback-commits` memories first — this user
wants fast, direct action on well-scoped tasks and controls all git commits
themselves (never run `git add`/`git commit`/`git push`).

## The ask

Current Tic-Tac-Toe is a 3x3 board and the user says it's "too easy." Make it
a 4x4 board instead.

## First thing to confirm before writing code

**Win condition (k-in-a-row) is not decided yet — ask the user before
implementing.** A 4x4 grid with the classic "3 in a row" rule plays very
differently from "4 in a row" (much harder to win, could even be a forced
draw more often — verify that isn't the case, or pick 3-in-a-row if it is).
There's a backlog memory entry (`backlog-research-items`) that already
flagged "bigger-board (N×N, k-in-a-row) Tic-Tac-Toe" as an open research
question — this is that question, now due. Don't guess; ask.

## Where the 3x3 assumption is hardcoded (verified by reading code 2026-09-13)

**`src/games/sugar/TicTacToe.jsx`**
- `WINNING_LINES` (top of file) — 8 hardcoded index-triples for a 3x3 board.
  Needs regenerating for 4x4 with whatever k-in-a-row is chosen (rows,
  columns, and both diagonal directions — for k=3 on a 4x4 grid there are
  multiple diagonal starting offsets per direction, not just the 2 corner-to-
  corner diagonals a 3x3 board has).
- `checkWinner(board)` — iterates `WINNING_LINES` as `[a, b, c]` triples;
  needs to become a variable-length line check if k-in-a-row ends up bigger
  than 3, or can stay triples if the answer is "still 3-in-a-row."
- Two separate `board: Array(9).fill(null)` — one in `createRoom`, one in
  the play-again/rematch reset. Both need `Array(16)`.
- `board[index]` bounds/placement logic (`placeMarker` or equivalent) — check
  it doesn't assume index range 0-8 anywhere else.

**`src/games/sugar/TicTacToeBoard.jsx`**
- `CELL_CENTERS` (top of file) — 9 hardcoded `[x, y]` pairs for the win-line
  SVG overlay, built for a `viewBox="0 0 3 3"`. Needs 16 entries for a 4x4
  grid and the SVG `viewBox="0 0 3 3"` (search for it — one occurrence, on
  the win-line `<svg>`) needs to become `"0 0 4 4"`.
- The board container's inline style has
  `gridTemplateColumns: 'repeat(3, 1fr)'` and `gridTemplateRows: 'repeat(3, 1fr)'`
  — change both to `repeat(4, 1fr)`.
- `board.map((cell, index) => ...)` itself is already length-agnostic (it
  just maps whatever array it's given), so cell rendering shouldn't need
  structural changes — only the container grid dimensions and the win-line
  math above it.

**Database**
- `supabase/migrations/20260701120000_create_tic_tac_toe_rooms.sql` —
  `board jsonb not null default '[]'::jsonb`. No migration needed purely for
  board size (jsonb has no length constraint here) — confirm there isn't a
  CHECK constraint elsewhere before assuming this, but a read of this
  migration on 2026-09-13 didn't show one.

## Don't forget while in there

- `TicTacToeLobby.jsx`'s `GridIcon` decorative SVG is a generic 2x2-line
  grid glyph, not tied to 3x3/4x4 — no change needed, but eyeball it.
- Check whether the win-line overlay's stroke width / arcade glow filters
  (tuned for a 3-cell-wide board) still look right proportionally on a
  4-cell board — cosmetic, fix if it looks off, not a blocker.
- The existing "TIC-TAK-TOE - change end game box to match other games" and
  "let who be X and who be O be randomized" backlog items are separate,
  already-tracked TODOs in the README — don't fold them into this task
  unless the user asks; keep this change scoped to the board size + win
  condition.

## Verification

Build (`npm run build`), then actually play a full game in the browser (not
just visually — via two Playwright contexts like the rest of this project's
realtime games) to confirm: the grid renders 4x4, moves land in the right
cell, a win is correctly detected and highlighted along the actual winning
line (not the old 3x3 line math), and a draw is still detected correctly on
a full 16-cell board. Screenshot the win-line overlay specifically — that's
the piece most likely to be subtly wrong (misaligned line) even if the game
logic is correct.

## Do NOT touch without separate sign-off

- Game logic changes unrelated to board size (turn randomization, X/O
  randomization — those are separate README items).
- Don't touch the room-code/copy-button or create/join-flow work from the
  previous session — that's marked DONE, leave it alone.
- Don't commit or push — the user controls all git commits.
