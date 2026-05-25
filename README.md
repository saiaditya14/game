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