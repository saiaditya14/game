# Handoff: Room code copy button, all games

Confirmed with the user (2026-09-12) as the first item to pick off the README's
"NEXT UP" list. Load `feedback-pacing-directness` and `feedback-commits` first.

## The actual ask

"Room code copy button on all games, with a proper polished component like
Gambling Corner's or Sugaropoly's — not a bare icon." The user's framing assumed
this was purely a "missing polish" problem. It's bigger than that — see below.

## What's actually there today (verified by reading code, not guessing)

**Lobby/waiting-room screens already have a good copy pattern** in most games —
this part is largely fine, don't redo it:
- `TicTacToeLobby.jsx`, `ConnectFourLobby.jsx`, `QuickMathsLobby.jsx`,
  `CategoryBlitzLobby.jsx`, `VerbalMemoryDuelLobby.jsx`, `WordRaceLobby.jsx`,
  `GamblingLobby.jsx`, `MonopolyLobby.jsx` — all have a `copied` state, a
  `motion.button` with `Copy`/`Check` icon swap, ~2s reset. Reference
  implementation: `TicTacToeLobby.jsx` around line 124-178 (`doCopy` plus the
  button JSX) — it's clean, token-driven, already what "good" looks like.

**The real gap: once the game actually STARTS, the room code disappears
entirely** for most games — not just "no copy button," no display at all:
- `TicTacToe.jsx`, `QuickMathsDuel.jsx`, `ConnectFour.jsx` — the top-level
  component only passes `roomCode={room?.code}` to the Lobby (rendered while
  `!room || !playerNumber`). Once the game starts, it renders `TicTacToeBoard` /
  `QuickMathsBoard` / `ConnectFourBoard` instead, and NONE of those three Board
  components reference `roomCode` or `room.code` anywhere — confirmed via grep,
  zero matches. The code is just gone from the screen mid-game.
- `WordRaceBoard.jsx`, `CategoryBlitzBoard.jsx` — same, zero matches, no in-game
  room code display at all.
- `VerbalMemoryDuelBoard.jsx` — the one partial exception: it DOES render
  `Room {room.code}` in-game (line ~150), but as bare text, no copy button, no
  `motion`/feedback of any kind.

**The two games that already show it in-game** (the ones the user referenced as
the quality bar) — but even these have a rough edge:
- `gambling/TableStatusBar.jsx` — has a real clipboard-copy pattern in-game.
  Check this one closely as the best in-game reference; it may already be
  exactly right.
- `monopoly/PastelMonopoly.jsx` topbar — `sugaropoly-room-pill` button calls
  `navigator.clipboard?.writeText(room.code)` on click, but has **no visual
  feedback at all** (no checkmark swap, no toast) — plainer than Sugaropoly's
  own lobby version, which got the full `Check`-swap treatment this session
  (see `MonopolyLobby.jsx`'s `copyRoomCode` + `isCodeCopied` state). Worth
  matching the two up while in there.
- `DrawOffCoop.jsx` / `DrawOffRoleSelect.jsx` — not yet checked in detail,
  do that first before assuming either way.

## Recommended approach

Don't hand-roll this 8 more times. Extract one shared component — this is the
same kind of cross-game extraction already sitting in the backlog for
`GameExitScreen` (`src/games/sugar/GameExitScreen.jsx` already exists as
precedent for "shared component used by multiple `src/games/sugar/*` games").
Something like `RoomCodeChip` or `RoomCodeCopyButton` taking `code` and
rendering the pill + copy affordance + copied-state, styled via the existing
`--primary`/`--ring`/`--radius` tokens so it adapts per theme like everything
else in `src/games/sugar/`. Use it in BOTH the lobby waiting-room AND thread it
into every Board component so the code stays visible (and copyable) for the
entire game, not just before it starts.

Sugaropoly is a partial exception — it's pink-only/fixed-identity by design
(see `sugaropoly-ui-overhaul` memory), so its version may need to stay a
one-off styled the same way but not literally importing the shared component,
unless the shared component is themeable enough via CSS vars to fit
Sugaropoly's hardcoded-hex palette too. Check before assuming either way.

## Scope check before starting

- Confirm `DrawOffCoop.jsx`/`DrawOffRoleSelect.jsx`'s current state (listed
  above as unchecked).
- Confirm whether `GamblingLobby.jsx`'s in-game handoff (does the room code
  carry into `GamblingCorner.jsx`'s active tables — Indian Poker/Dice
  Poker/Hold'em?) already works, since `TableStatusBar.jsx` suggests yes but
  verify against the specific table types, not just Hold'em.

## Do NOT touch without separate sign-off

- Game logic, Supabase queries, realtime code — presentation layer only, same
  rule as every other UI pass in this project.
- Don't widen scope to redesign the lobby copy buttons that already work well
  (Tic-Tac-Toe's pattern, etc.) — extract/reuse them, don't "improve" them
  without a reason.

## Finally

Do not commit or push — the user controls all git commits. Report what
changed, and screenshot/measure claims per `verify-ui-in-browser` — don't
claim something displays correctly off source reading alone, confirm in a
real browser like every other pass this project has done.
