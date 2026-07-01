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

Sugaropoly lives at `/monopoly` in `src/games/sugar/monopoly/`. It is a playable authenticated Supabase property/economy game with host rules, 2d8 movement, purchases, rent, development, auctions, trades, debt, Time Out, bankruptcy, victory, and Realtime state.

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
- Canonical 56-space property data from `monopoly (1).pdf` lives in `monopolyData.js`.
- Property purchases, rent, crystals, portals, utilities, taxes, GO, Free Park, buildings, mortgages, debt, auctions, trades, Time Out, bankruptcy, forfeiture, and victory are implemented.
- Host setup controls starting cash, auctions, full-group base-rent doubling, Free Park jackpot, and optional target-cash victory.
- Turn state is authoritative and deferred through landing resolution and End Turn.
- Board spaces open reusable local inspection cards; only the active landed-space card exposes authoritative actions.
- Multiplayer identity uses silent Supabase anonymous Auth. Direct room writes are denied and validated actions run through Postgres RPCs.
- Focused pure-rule tests run with `npm test`.

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

### Sugaropoly Economy Test Matrix

- Solo development: create, choose rules, begin with one player, buy/decline, and continue cycling without triggering last-solvent victory. Solo bankruptcy ends the run with a defeat screen and rematch option.
- Two tabs: verify independent anonymous users, Realtime state, active-player-only dice/cards, and rejected out-of-turn RPC calls.
- Doubles: resolve the landing, choose End Turn/roll again, and confirm three consecutive doubles go directly to Time Out without the third move.
- GO: pass and land on GO and confirm exactly $200 is awarded.
- Property: test affordable/unaffordable Buy, decline with auctions off, and turn-by-turn bidding/pass removal with auctions on.
- Rent: test undeveloped group doubling on/off, developed rent, crystal bonuses once, 1-3 utilities at 4x/10x/15x, 1-4 portals, and mortgaged zero rent.
- Taxes and Free Park: test Tribute Tax cap, Treasury Tax, five-round jackpot window, disabled jackpot, and exclusion of Time Out fees.
- Development: require a complete group, allow uneven building, buy/sell only on the owner turn, and sell at half cost.
- Mortgage: confirm mortgage-and-liquidate, no rent/development while mortgaged, 110% unmortgage cost, and trading mortgaged deeds.
- Debt: recover by selling, mortgaging, or trading; verify End Turn remains blocked while cash is negative.
- Trades: exchange cash and undeveloped properties, reject/accept, and verify changed or unaffordable offers fail server validation.
- Time Out: visit harmlessly; leave by $50, doubles, or the third failed attempt and move using the release roll.
- Bankruptcy/forfeit: transfer to a player creditor, queue bank auctions when enabled, return deeds unowned when disabled, and advance the turn after an active-player leave.
- Victory: test last-solvent-player and cash-only target victory at End Turn.
- Cards: click any space for read-only inspection; click the landed space to restore unresolved controls; confirm other players never receive the automatic card.

### Supabase Configuration

Enable **Anonymous Sign-Ins** in Supabase Dashboard under **Authentication > Providers > Anonymous**. No login UI or OAuth redirect is required, so GitHub Pages and GitHub Actions remain static-host compatible.

Apply migrations before running Sugaropoly:

```powershell
supabase start
supabase migration up
npm test
npm run build
```

The economy migration revokes direct client inserts/updates/deletes on `monopoly_rooms`, keeps member-only Realtime reads, and grants authenticated users only the validated Sugaropoly RPC actions.

Todolist:
Need an overhaul of button UI in draw off.
Overhaul in connect 4?
Play test system prompt for draw off a little but seems fine and fun to babie.
Monopoly dice analysis is done in `monopoly_dice_sim.py`; use 2d8 for Sugaropoly movement.
NAVBAR needs an overhaul bro
- Improve reconnect behavior by letting a returning browser resume its existing player from localStorage more visibly.
- Sugaropoly follow-up: test 4-8 player crowded tile coin readability and tune rail placement/overlap/effect scale if needed.
Take babie feedback on the scenes, most likely faster falling of flowers and more bubbles in champagne but yea otherwise UI overhaul done!
Babie feedback:
Visiting rule for monopoly
Thinner brushes (better UI for the same otherwise done)
Number of rounds could be togglable

### Sugaropoly Later Visual Polish

- Color-code owned tiles or board-edge ownership rails with the owner's player color.
- Show small house/hotel icons on developed spaces, inspired by Richup's at-a-glance readability without copying its design.
- Add visible mortgage badges or muted tile treatment.
- Show compact owner markers on portals, utilities, and crystals.
- Add complete-group and build-eligible cues during the active owner's turn.
- Improve auction, trade, debt, Time Out, and bankruptcy styling.
- Create bespoke replaceable deed-card artwork.
- Keep all ownership/development markers readable with 4-8 overlapping player coins.
- Revamp board orders and outside of centre styling to be stronger

FOR CONNECT FOUR
i want sparkles when the game get over and the congrats box pops up.

Future Future:
Monopoly could eventually get a dedicated phone interaction pattern instead of trying to make the full 15x15 board readable at extremely tiny viewport sizes, but phone is not the intended base target right now.
