# Game Structure Reference Card — Lovelyland

## File / folder conventions

Games live in `src/games/<person>/`. Two persons in use:
- `plum/` — person 2's games (Draw Off)
- `sugar/` — person 1's games (Connect Four, Monopoly/Sugaropoly)

A flat game (Connect Four) looks like:
```
src/games/sugar/
  ConnectFour.jsx          ← root component (state, Supabase, logic)
  ConnectFourBoard.jsx     ← pure board UI
  ConnectFourLobby.jsx     ← lobby UI (create / join)
  connect-four-schema.sql  ← DB schema (run once in Supabase dashboard)
  hand.md                  ← authorship note (who owns this folder)
```

A complex game (Monopoly) uses a subfolder:
```
src/games/sugar/monopoly/
  PastelMonopoly.jsx       ← root component
  MonopolyLobby.jsx
  MonopolySetup.jsx
  MonopolyBoard.jsx
  MonopolySidebar.jsx
  PropertyCard.jsx
  TurnAction.jsx
  TradeEditor.jsx
  VictoryOverlay.jsx
  MonopolyDiceOverlay.jsx
  monopolyData.js          ← static board data, rules defaults
  monopolyRules.js         ← pure game logic
  monopolyRules.test.js
  rollVisuals.js
  rollVisuals.test.js
src/games/sugar/monopoly-schema.sql
```

---

## Routing — how a game plugs into App.jsx

1. Import the root component in `src/App.jsx`.
2. Add a `<Route path="/your-game" element={<YourGame />} />` inside the existing `<Routes>`.
3. Add a `<Link>` to the game on `src/pages/HomePage.jsx` (inside the "Start a New Game" section), wrapping a `<GameCard>`.

```jsx
// App.jsx — add import + route
import YourGame from './games/sugar/YourGame';
// ...
<Route path="/your-game" element={<YourGame />} />

// HomePage.jsx — add card
<motion.div variants={cardItemVariants}>
  <Link to="/your-game" ...>
    <GameCard title="Your Game" description="..." badge="New" category="Classic" meta="2 player" />
  </Link>
</motion.div>
```

No lazy loading is used for game components (only `ThemeScene` is lazy). Import directly.

---

## Theme system

Theme is a CSS class on `<html>`: `theme-champagne`, `theme-pink`, `theme-arcade`, `theme-cozy`.  
All design tokens are CSS custom properties scoped to those classes in `src/styles/index.css`.  
**Note:** `theme-vanilla` is a dead name — the correct default theme is `theme-champagne`.

**Reading the theme in a component:**
```js
import { useTheme } from '../../components/ThemeProvider';
const { theme, setTheme } = useTheme();
```

`theme` is one of `'theme-champagne' | 'theme-pink' | 'theme-arcade' | 'theme-cozy'`.

**Token usage pattern:**
```jsx
// CSS variables in inline styles (safe for dynamic values)
style={{ background: 'var(--surface)', borderColor: 'var(--ring)' }}

// Tailwind utility class aliases (available in index.css)
className="bg-primary text-foreground border-border"
```

Key tokens: `--surface`, `--surface-strong`, `--primary`, `--muted`, `--ring`, `--radius`, `--shadow`, `--divider`. Color tokens are set per-theme in `src/styles/index.css`.

**CRITICAL — overlay centering:** Tailwind's `fixed`, `inset-0`, and `flex items-center justify-center` do NOT generate CSS in this repo (spacing scale is dead). Always use inline styles for any full-screen overlay or modal:
```jsx
<div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
```
Never use `className="fixed inset-0 flex items-center justify-center"` — it will render in the top-left corner.

---

## Shared abort / game-over modal

**`GameExitScreen`** lives in `src/games/sugar/GameExitScreen.jsx` (extracted from `QuickMathsDuel.jsx` during the Word Race build). It handles two statuses:
- `status="aborted"` — mid-game abort, shows "Game Aborted / heading home"
- `status="closed"` — exit after game over, shows "Game Over / heading home"

Both auto-navigate to `'/'` after 1800 ms (driven by a `useEffect` in the root component watching `room.status`). Import it directly (`import GameExitScreen from './GameExitScreen'`) for every new game that needs abort/exit — do not redefine it inline. Currently consumed by Quick-Maths Duel and Word Race. **TODO: retrofit Tic-Tac-Toe / Connect Four** to use the same modal instead of their own abort screens (a later pass, not automatic).

If a new game needs more than one quit-like action (e.g. "abort an empty room" vs "forfeit mid-race"), collapse them into a **single contextual button** whose label/behavior branches on game state — don't surface two separate buttons for overlapping quit/forfeit intents (see `WordRace.jsx`'s `onLeave`/`leaveGame`).

DB status values to include in every new game schema: `'waiting' | 'playing' | 'finished' | 'aborted' | 'closed'`

---

**Theme-conditional rendering pattern:**
```js
const isArcade = theme === 'theme-arcade';
const labelByTheme = {
  'theme-pink': 'hii ♡',
  'theme-arcade': 'PLAYER SELECT',
  'theme-cozy': 'Settle in...',
  'theme-vanilla': 'Welcome back.',
};
const label = labelByTheme[theme] ?? labelByTheme['theme-vanilla'];
```

---

## Minimal new game scaffold

### `src/games/sugar/MyGame.jsx`
```jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../components/ThemeProvider';
import { supabase } from '../../lib/supabaseClient';

const ROOM_KEY = 'lovelyland-mygame-room-id';

const MyGame = () => {
  const { theme } = useTheme();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Realtime sync
  useEffect(() => {
    if (!supabase || !room?.id) return;
    const channel = supabase
      .channel(`mygame-room-${room.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mygame_rooms', filter: `id=eq.${room.id}` },
        ({ new: next }) => { if (next) setRoom(next); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  const createRoom = async () => {
    if (!supabase) { setError('Supabase not configured.'); return; }
    setBusy(true);
    const { data, error: e } = await supabase
      .from('mygame_rooms')
      .insert({ /* initial state */ })
      .select().single();
    setBusy(false);
    if (e) { setError(e.message); return; }
    setRoom(data);
    window.localStorage.setItem(ROOM_KEY, data.id);
  };

  if (!room) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center px-4 py-10">
        <button
          type="button"
          onClick={createRoom}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-[color:var(--surface)] font-bold"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Create Room
        </button>
        {error && <p className="mt-4 text-sm text-[color:var(--muted)]">{error}</p>}
      </main>
    );
  }

  return (
    <div>
      {/* game UI */}
    </div>
  );
};

export default MyGame;
```

### `src/games/sugar/mygame-schema.sql`
```sql
create extension if not exists pgcrypto;

create table if not exists public.mygame_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 4 and 6),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'aborted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-update trigger (copy pattern from connect-four-schema.sql)

alter table public.mygame_rooms enable row level security;
create policy "read" on public.mygame_rooms for select to anon, authenticated using (true);
create policy "insert" on public.mygame_rooms for insert to anon, authenticated with check (true);
create policy "update" on public.mygame_rooms for update to anon, authenticated using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table public.mygame_rooms;
exception when duplicate_object then null;
end $$;
```

### Wire up in App.jsx + HomePage.jsx
See "Routing" section above. That's the complete checklist — schema in Supabase dashboard, import + route in App, card in HomePage.
