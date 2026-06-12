# Lovelyland

A cute asynchronous minigame hub built with Vite, React, Tailwind CSS, Framer Motion, and Lucide icons.

## Requirements

- Node.js 20 or newer
- npm
- Git

## Clone And Run

```bash
git clone https://github.com/saiaditya14/game.git
cd game
npm install
npm run dev
```

Vite will print a local URL, usually:

```txt
http://localhost:5173/
```

Open that URL in your browser to work on the app.

## Daily Workflow

Before starting work:

```bash
git pull
npm install
npm run dev
```

Before pushing changes:

```bash
npm run build
git status
git add .
git commit -m "Describe your change"
git push
```

## Project Structure

```txt
src/
  components/   Shared UI like the nav bar and game cards
  games/
    sugar/      One partner's game implementations
    plum/       The other partner's game implementations
  pages/        Route-level pages
  styles/       Shared Tailwind and theme CSS
```

Keep new game work inside `src/games/sugar` or `src/games/plum`.

## What Not To Commit

The repo ignores generated and local-only files, including:

```txt
node_modules/
dist/
.env*
.vite/
```

Commit `package-lock.json` when dependencies change so both partners install the same versions.

## Draw Off Local Judge Setup

`DrawOffSingle` uses a Supabase Edge Function named `judge-drawing` to judge sketches with Gemini. The helper script only writes local environment files; it does not start Vite or Supabase.

Run this from the repo root in PowerShell:

```powershell
.\scripts\start-drawoff-local.ps1 `
  -SupabaseAnonKey "YOUR_SUPABASE_ANON_KEY" `
  -GeminiApiKey "YOUR_GEMINI_API_KEY"
```

Optional arguments:

```powershell
.\scripts\start-drawoff-local.ps1 `
  -SupabaseAnonKey "YOUR_SUPABASE_ANON_KEY" `
  -GeminiApiKey "YOUR_GEMINI_API_KEY" `
  -SupabaseUrl "http://127.0.0.1:54321" `
  -GeminiModel "gemini-2.5-flash"
```

The script writes:

```txt
.env.local
supabase/.env.local
```

To run the full local stack:

```powershell
supabase start
supabase functions serve judge-drawing --env-file supabase/.env.local
npm run dev
```

Then open:

```txt
http://localhost:5173/draw-off
```

## Sugaropoly / Faerie Kingdom Quest

Sugaropoly lives at `/monopoly` in `src/games/sugar/monopoly/`. The current version is a playable Supabase prototype: players can create a room, join by code, start from the host lobby, roll 2d8, move tokens around the 56-space board, and see synced turn/player state.

For local multiplayer development:

```powershell
supabase start
supabase migration up
npm run dev
```

The local Vite URL may use the project basename:

```txt
http://127.0.0.1:5173/game/monopoly
```

### Sugaropoly Done

- 56-space board confirmed in `MonopolyBoard.jsx`.
- Supabase `monopoly_rooms` migration exists for room code, players, current turn, status, latest roll, and event log.
- Create room, join room, host start, 2-8 player waiting room, and Realtime sync are implemented.
- Movement uses 2d8.
- Tokens move around the board with wraparound movement.
- Current player can roll; inactive players cannot roll.
- Dice overlay is local-only for the rolling player and clears quickly after the roll.
- Sidebar shows joined players, placeholder money, active turn, positions, and event log.
- Topbar and sidebar show a clearer current-turn prompt.
- Local players can leave a waiting or active room without deleting the room for everyone else.
- Full and already-started rooms show friendlier join feedback.
- Tokens render as larger circular player-color coins on the board-space rail with controlled overlap for crowded tiles.
- Rolled tokens use a short magic teleport beat with player-color ring/particle effects anchored to the exact token slot.
- Local dice rolls show bright pastel sparkle feedback.

### Sugaropoly Manual Test Notes

Use two browser tabs at `http://127.0.0.1:5173/game/monopoly` after `supabase start`, `supabase migration up`, and `npm run dev`.

- Tab 1: create a room and confirm the waiting room shows the room code and host.
- Tab 2: join with the room code and confirm both tabs show `2/8 players joined`.
- Tab 1: start the game and confirm both tabs show whose turn it is in the topbar/sidebar.
- Active player tab: roll 2d8 and confirm only that tab sees the dice overlay/sparkles, while both tabs see the moving token disappear/reappear with ring or particle teleport effects and the turn advance.
- Non-active player tab: confirm the roll button is unavailable until that player's turn.
- Leave flow: click Leave Room from a waiting or active tab and confirm that tab returns to the lobby while the other tab keeps the room state.
- Join feedback: try joining an already-started room, and try joining a room with 8 players, to confirm the clear blocked-state message.
- Crowded coin tile: with 2-8 joined players, get multiple players onto the same board space and confirm circular coins remain readable, overlap intentionally, stay attached to the correct rail/slot, and teleport effects appear on the moving coin's slot.

### Sugaropoly Blocked Until Property/Card Data Exists

- Property purchase prompts need a per-space property breakdown: purchasable vs tax vs card vs utility/gem/portal, purchase price, display copy, and initial owner state.
- Rent logic needs rent tables or formulas for every property group, plus rules for utilities/gems/portals if they behave differently.
- Property detail cards need finalized card content: title, type, price, rent values, art/icon treatment, and action buttons.
- Ownership display needs a data model for deeds, owner ids, mortgages/upgrades if those will exist, and how ownership is rendered on the board.
- Chance/Charm Chest behavior needs a card deck list and rules for each card before the spaces can do more than log a placeholder.
- Jail/time-out, pass-GO rewards, taxes, bankruptcy, trading, and win/end conditions all depend on the economy rules being defined.


Todolist:
Need an overhaul of UI in general
Need an overhaul of button UI in draw off
Play test system prompt for draw off a little but seems fine and fun to babie
Security issues in joining such as what if more than two join? what if one leaves how to come back? 
Monopoly dice analysis is done in `monopoly_dice_sim.py`; use 2d8 for Sugaropoly movement.
NAVBAR needs an overhaul bro
- Add a small "copy room code" control in the waiting room/topbar.
- Improve reconnect behavior by letting a returning browser resume its existing player from localStorage more visibly.
- Sugaropoly follow-up: test 4-8 player crowded tile coin readability and tune rail placement/overlap/effect scale if needed.
Babie feedback:

Thinner brushes (better UI for the same otherwise done)
Number of rounds could be togglable

FOR CONNECT FOUR
i want sparkles when the game get over and the congrats box pops up.

Future Future:
Monopoly could eventually get a dedicated phone interaction pattern instead of trying to make the full 15x15 board readable at extremely tiny viewport sizes, but phone is not the intended base target right now.
