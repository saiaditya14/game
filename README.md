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


Todolist:
Need an overhaul of UI in general
Need an overhaul of button UI in draw off
Play test system prompt for draw off a little but seems fine and fun to babie
Security issues in joining such as what if more than two join? what if one leaves how to come back? 
Monopoly sidebar now has desktop/fullscreen Players, Trades, and My Properties panels. Future cramped-layout pass should move it into a rich.io-style bottom drawer or toggleable panel instead of always showing the side rail.
Monopoly board zoom/sidebar stability should be rechecked after the sidebar revamp; desktop side rail is now fixed-width and sticky, but narrow desktop/tablet responsive guards are still future work.
Monopoly board and sidebar should eventually size independently with the viewport instead of being tightly tethered; the current fixed relationship has served its purpose for the first layout pass.
After the Monopoly fullscreen button is redesigned/repositioned, align the board top edge and sidebar top edge consistently in both normal and fullscreen modes.
Monopoly dice analysis is done in `monopoly_dice_sim.py`; use 2d8 for Sugaropoly movement. Next: implement simple 2d8 dice rolling and circular board movement before adding special rules.
NAVBAR needs an overhaul bro
Babie feedback:

Thinner brushes (better UI for the same otherwise done)
Number of rounds could be togglable

FOR CONNECT FOUR
i want sparkles when the game get over and the congrats box pops up.

Future Future:
Monopoly could eventually get a dedicated phone interaction pattern instead of trying to make the full 15x15 board readable at extremely tiny viewport sizes, but phone is not the intended base target right now.
