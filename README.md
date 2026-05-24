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
