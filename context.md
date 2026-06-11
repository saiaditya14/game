@# Project Context

**Tech Stack**:
- **Framework**: React 18+ (initialized via Vite)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Client-side AI**: Transformers.js / `@xenova/transformers` for local vision inference
- **Database/Sync**: Supabase (real-time and async database syncing)
- **Deployment**: GitHub Pages (planned)

**Design Architecture**:
- The application relies heavily on CSS variable theming to support multiple distinct visual styles across different sub-sections of the site (e.g., Vanilla, Pink, Arcade, and Cozy).
- Reusable components and styles are centralized.
- Lovelyland is the current product name for the minigame hub.
- Current UI refinement workflow: iterate theme-by-theme, starting with Vanilla, then apply learnings to Pink, Arcade, and Cozy after review.
- Shared UI now expects richer theme tokens in `src/styles/index.css`: `--surface`, `--surface-strong`, `--muted`, `--ring`, `--shadow`, `--card-gradient`, and `--card-sheen`.
- **Multiplayer Role Selection Constraint:** When users join a multiplayer room (e.g. Draw Off Co-op), a player who has already selected their preferred role must be shown a "Waiting for Partner" state, removing their ability to switch choices or claim both roles while ensuring they do not advance to the empty playing canvas until their partner selects the remaining role.
- The top navigation and game cards are designed as reusable themed components, so component structure should stay shared while each style's personality comes from CSS variables.
- Current Vanilla feedback: prefer sleeker/lighter text, clearly visible gaps between game cards both across rows and between rows, theme selection as a dropdown instead of individual buttons, and no "four little worlds" eyebrow in the home header.
- **Layout Conformance Constraint:** All central UI elements (Lobbies, Mode Selectors, Canvas Containers, Start Prompts) must NOT stretch edge-to-edge on large desktop screens. Regardless of the container size (e.g. `max-w-6xl`), the inner card/box itself must be constrained (e.g. `max-w-xl mx-auto` or `max-w-[52rem] mx-auto`) to ensure it always looks properly bounded, cute, and gives plenty of visual breathing room to the sides, matching the Main Hub spacing.
- Game card spacing is controlled by the shared `.game-grid` class in `src/styles/index.css`; use that class instead of ad hoc grid gap utilities so card spacing remains visibly separated across pages.
- Theme dropdown styling is controlled by `.theme-select`; keep both the select and option colors tied to theme variables so dark themes like Arcade remain readable.
- Game cards should follow the sleek catalog-card direction: three cards per row on wide screens, horizontal side scrolling on smaller screens, quiet serif titles, small uppercase category chips, and an image/placeholder area instead of emojis. Real per-game images can be passed through `imageSrc` on `GameCard`.
- Game card dividers use the themed `--divider` token and `.game-card-divider`; keep separators visible in all four styles, especially Arcade.
- Section headers should live inside `.game-section-shell` with the card grid so "Your Turn" and "Start a New Game" align with the centered card row instead of the page edge.
- The "Draw Off" catalog card uses dynamic theme-based images mapped to the active CSS-variable theme, defaults Cozy to the Vanilla image, and follows the catalog-card direction with full-bleed cropped imagery, uppercase chips, and no emojis.

**Current Features**:
- "Draw Off" is accessed through a mode selector Hub (`src/games/plum/DrawOffHub.jsx`) which splits into Single Player Sprint, 2-Player Co-op, and BYOK.
- Single Player (`/draw-off-single`) uses Transformers.js CLIP zero-shot image classification locally in the browser.
- Co-op Mode (`/draw-off-coop`) uses Supabase Realtime broadcast channels to stream drawing strokes between a drawer and a guesser instantly, circumventing database writes for mouse movements.
- Monopoly lives at `/monopoly` under `src/games/sugar/monopoly/`. It currently has a static/testing board and a desktop-first sidebar with Players, Trades, and a lower panel that toggles between Event Log and My Properties using placeholder data until real Monopoly game state exists.
- Monopoly board rendering is split between `PastelMonopoly.jsx`, `MonopolyBoard.jsx`, and `BoardSpace.jsx`. The board is a 15x15 CSS grid with 56 spaces around a center image (`images/monopoly_board.jpeg`) and custom Faerie Kingdom Quest property names.
- Monopoly spaces are currently hardcoded in `MonopolyBoard.jsx`; there is no live Monopoly game state, ownership, dice, movement, trade, or bankruptcy logic yet. Board tiles use `colorGroup`, `kind`, `edge`, and `corner` metadata to render pastel property bands, Lucide icons, prices, rotated side labels, and fitted corner labels.
- Monopoly sizing is controlled mainly by CSS variables on `.sugaropoly-page` in `src/styles/index.css`, including board size, tile font sizes, icon size, property band size, layout gap, and sidebar width. Recent work removed the old testing behavior that forced the board to stay 1020px on small screens; board tile text, prices, icons, bands, padding, and borders now scale from `--monopoly-board-size`.
- Monopoly uses a route-specific topbar in `PastelMonopoly.jsx` instead of the shared `NavBar`; `src/components/NavBar.jsx` currently returns `null` for `/monopoly`. The Sugaropoly topbar carries Lovelyland/home navigation, theme selection, the "Faerie Kingdom Quest" title, and fullscreen. Do not reintroduce the fullscreen control as an overlay on the board; prior testing showed it collides visually with board cells.
- Monopoly layout direction: the sidebar should behave like a true right-side sidebar pinned to the page/viewport edge on desktop, while the board uses the remaining space. Avoid centering the board and sidebar as a combined floating group. When viewport space is too small, preserve the preferred behavior where the sidebar moves below the board rather than overlapping the board.
- Monopoly responsive status: the board/sidebar/topbar layout is mid-iteration and should be visually checked across desktop, tablet, and narrow viewport widths before finalizing. Known issues to watch for are board text overflow at tiny sizes, the topbar becoming too tall or dropping the game title below controls, and the sidebar appearing attached to the board instead of reading as a side rail.
- Monopoly board tiny-viewport handling uses proportional CSS-variable scaling first: tile names, prices, icons, and property bands keep shrinking with `--monopoly-board-size`; board text avoids mid-word breaking; top/bottom rows get an intermediate inward nudge before prices disappear; then prices, regular tile names, and finally corner text progressively hide at very small viewport thresholds.
- Monopoly sidebar accepts optional `players`, `trades`, `properties`, `events`, `currentPlayerId`, and `onBankruptcy` props. It caps displayed players at 8, sizes the Players panel tightly up to 6 visible rows, scrolls for players 7-8, keeps Trades natural height, and lets the lower Event Log/My Properties panel expand into leftover sidebar space with internal scrolling. The lower panel uses a compact pink house/log icon action to switch between events and owned properties. The sidebar width remains unchanged so the board dimensions are not affected by this rework.

**Multiplayer Development Strategy**:
1. We build "Single Player Sprint" testing versions of every game first to validate the core game loop, UI, and local state.
2. These test versions live in a `testing/` subfolder within the creator's directory (e.g., `src/games/plum/testing/`).
3. During the testing phase, the main landing page `GameCard` and the React Router should strictly point to these single-player testing components.
4. Only once the local game loop is perfected do we build the 2-player Supabase-connected version in the main game folder and update the router to point to the production version.

**Draw Off AI Notes / Known Issues**:
- The current Draw Off testing version uses `Xenova/clip-vit-base-patch32` through `@xenova/transformers` with quantized CLIP weights. This was the best working browser path found so far; avoid switching back to ml5/DoodleNet/QuickDraw without a strong reason because prior testing found those classifiers too brittle for the desired game feel.
- CLIP can classify rough drawings semantically better than DoodleNet, but it is too forgiving with strong partial clues. Examples observed: a pizza can be confused with a smiley face, a cat can score after only an early whisker, and a bicycle can score after only partial wheel structure.
- Raw AI guesses are useful for debugging but may be distracting in the final sprint UI. Consider hiding the guess cards in normal play and showing only compact status/feedback such as "AI thinking", "keep drawing", or success feedback.
- Running CLIP inference on the main React thread can briefly block canvas drawing. The preferred low-latency architecture is to move Transformers.js inference into a Web Worker so canvas strokes remain instant while stale classifications can still finish in the background.
- Do not cancel every stale classification automatically. A user adding more detail may be cautious, and older stroke-end snapshots can still be valid for scoring if they were produced from a complete-enough drawing.
- Avoid manual submit as the primary interaction for Draw Off; it breaks the desired fast, watchful sprint feel. Prefer stroke-end classification, throttling, and worker-based inference.
- Proposed scoring fixes: require enough ink before scoring, use target-specific complexity gates, require the target to beat the runner-up by a confidence margin, and optionally require two consecutive matching classifications before awarding a point.
- Proposed completeness checks should be cheap canvas metrics first: stroke count, total stroke distance, bounding-box spread, width/height coverage, time since target appeared, and possibly direction/turn count. These should decide whether a drawing is complete enough before accepting CLIP's label.
- A prompted small VLM is not currently the preferred path: likely heavier/slower than CLIP in-browser and not guaranteed to understand rough doodle completeness. A future higher-quality option would be a custom small sketch classifier trained on the game categories plus null/incomplete/scribble examples, exported for browser inference.

**Connect Four Notes / Current Implementation**:
- "Connect Four" is authored under the Sugar folder and lives in `src/games/sugar/`.
- The active route is `/connect-four`, wired in `src/App.jsx`, and the home catalog card in `src/pages/HomePage.jsx` links to that route.
- Main wrapper: `src/games/sugar/ConnectFour.jsx`. It owns room creation, room joining, player identity, realtime subscription, move validation, turn changes, win/draw detection, abort handling, and the exit-back-to-lobby behavior.
- Lobby component: `src/games/sugar/ConnectFourLobby.jsx`. It shows the instruction page, "Create a Game", and "Join a Game" controls. Room codes are generated client-side as 4-6 character uppercase codes.
- Board component: `src/games/sugar/ConnectFourBoard.jsx`. It renders the 7x6 board, player badges/timers, turn indicator, abort/settings controls, animated piece drops, winning strike, and the winner modal.
- Supabase schema lives in `src/games/sugar/connect-four-schema.sql`. A matching migration was also added at `supabase/migrations/20260525120000_create_connect_four_rooms.sql`.
- Database table: `public.connect_four_rooms`. Important fields are `code`, `board`, `current_player`, `status`, `winner`, `player_one`, `player_two`, `last_move`, `started_at`, `created_at`, and `updated_at`.
- The board is stored as a 1D array of 42 slots in `board`, using `null`, `1`, and `2`. Index math is `row * 7 + column`.
- Player identity is stored locally in `localStorage` under `lovelyland-connect-four-player-id`. `player_one` and `player_two` store those client IDs.
- Supabase Realtime uses `postgres_changes` on `public.connect_four_rooms` filtered by the current room `id`. This syncs board state, turn state, joins, wins, draws, and aborts.
- The create flow inserts a waiting room with `player_one`; the join flow finds by `code`, writes `player_two`, sets `status` to `playing`, and starts the match for both clients through realtime.
- The move flow checks that the local player matches `current_player`, finds the lowest empty row in the clicked column, updates the board, checks for a win/draw, flips `current_player`, and writes the move to Supabase.
- Winning cells are stored inside existing `last_move.winning_cells` JSON, so no extra database columns are needed for the gold strike overlay.
- The win UI draws a gold strike over the four winning coins, highlights those coins, and shows a centered "Congrats!" modal with a blurred game backdrop and an "Exit game" button returning the current browser to the Connect Four lobby.
- Board rendering notes: pieces must stay true circles. The board uses a fixed `aspect-[7/6]`, explicit rows/columns, clipped circular slots, and absolute inset disc spans. Avoid changing this back to unconstrained per-button sizing because it previously caused stretched coins and floating drop artifacts.
- Piece colors intentionally use theme variables via inline style (`--primary` for Player 1 and `--accent` for Player 2) instead of dynamic Tailwind class names. This avoids Player 1 disappearing in some builds/themes.
- Only the newest move should animate. Stable piece keys are important because keying every piece to `last_move.at` caused old coins to reanimate on every realtime update.
- Current schema policies are permissive for the prototype (`anon`/`authenticated` can select, insert, and update rooms). Before production, tighten RLS so only the two room participants can update their room and only valid state transitions are allowed.
- Do not put the Supabase service role key in `.env` or browser code. The frontend should use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
