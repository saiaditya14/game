# Lovelyland Project Context

Lovelyland is a cute minigame hub built with Vite, React, Tailwind CSS, Framer Motion, Lucide icons, and Supabase for multiplayer prototypes. Keep new game work inside `src/games/sugar` or `src/games/plum`; shared styling lives mostly in `src/styles/index.css`.

## Working Style

- Preserve the existing cute/pastel direction, but favor readable, playable UI over decoration.
- Keep changes scoped and understandable. Reuse existing patterns before adding abstractions.
- For frontends, build the actual playable surface first, not a marketing page.
- Run `npm.cmd run build` after implementation changes.
- Keep static property/economy definitions in `monopolyData.js`; do not scatter rule values through components.

## Sugaropoly / Faerie Kingdom Quest

- Route: `/monopoly`, usually served locally as `http://127.0.0.1:5173/game/monopoly`.
- Source: `src/games/sugar/monopoly/`.
- Main files: `PastelMonopoly.jsx`, `MonopolyBoard.jsx`, `MonopolyDiceOverlay.jsx`, `MonopolyLobby.jsx`, `MonopolySidebar.jsx`.
- Styles are in `src/styles/index.css` under the Sugaropoly/Monopoly sections.
- Supabase migration: `supabase/migrations/20260612120000_create_monopoly_rooms.sql`.
- There is no `src/games/sugar/monopoly/monopoly-schema.sql` in the current checkout.

Current Sugaropoly is a playable authenticated property/economy game:

- Create/join rooms by code.
- Host starts from lobby.
- Supports 2-8 players.
- Players roll 2d8.
- Tokens wrap around a 56-space board.
- Turns, players, latest roll, and event log sync through Supabase Realtime.
- Dice overlay is local-only for the rolling player and should clear quickly.
- Leaving a room is local-client friendly and should not break the room for others.

Current visual/gameplay decisions:

- Keep the Faerie Kingdom Quest pastel board/topbar/sidebar direction.
- Current turn should be obvious in topbar/sidebar.
- Player pieces are circular, player-color coins.
- Coins should be large and readable when possible, using controlled overlap on board-space rails instead of shrinking too aggressively.
- Crowded tiles with 2-8 coins need manual testing; tune overlap/rail placement if needed.
- Token movement is whimsical teleportation, not path sliding: the coin disappears, pauses during dice reveal, then reappears on the destination.
- Teleport effects are player-colored and anchored to the exact token slot. Only ring and particle-ball effects are currently in rotation.
- Other players should not see someone else's dice overlay.
- Do not leave the board center blurred after dice roll.
- Roll visuals are edge-triggered by unique roll ID. Realtime or economy updates carrying the same `latest_roll` must never replay token movement.

Implemented in the June 14, 2026 economy handoff:

- structured property/card data and reusable inspection/landing cards
- buying, rent, auctions, buildings, mortgages, taxes, debt, trades, bankruptcy, and victory
- GO, Free Park, doubles, and Time Out rules
- silent Supabase anonymous Auth, member-only reads, denied direct writes, and validated RPC actions

Chance and Charm Chest decks remain intentionally deferred; their spaces are harmless placeholders.

Sugaropoly near-term todos:

- Test 4-8 player crowded tile readability and tune coin overlap/effect scale.
- Improve reconnect/resume-from-localStorage messaging.
- Eventually design a dedicated phone interaction pattern; tiny phones are not the base target right now.

Sugaropoly deferred visual polish:

- Color-code owned board tiles or ownership rails using the owner's player color.
- Add small house and hotel markers directly on developed board spaces, with readable 1-4 house and hotel states.
- Add clearer mortgaged-property treatment on the board, such as a muted band or compact mortgage badge.
- Add compact owner indicators to portal, utility, and crystal spaces.
- Improve ownership and development visibility in crowded 4-8 player games without shrinking coins excessively.
- Polish auction, trade, debt, Time Out, and bankruptcy controls to match the deed-card and victory-screen visual quality.
- Replace temporary card art slots with bespoke, replaceable Sugaropoly artwork later.
- Consider subtle complete-color-group highlighting and build-eligible cues during the owner's turn.

## Draw Off

- Draw Off has single-player and co-op modes.
- Single-player uses browser-side CLIP/Transformers.js today; avoid switching classifiers casually because prior options were brittle.
- Future AI improvements should prefer worker-based inference, cheap canvas completeness checks, and less distracting normal-play debug output.
- Draw Off UI still needs lighter brush options and button polish.

## Connect Four

- Source: `src/games/sugar/ConnectFour.jsx`, `ConnectFourLobby.jsx`, `ConnectFourBoard.jsx`.
- Route: `/connect-four`.
- Supabase schema/migration exist for `connect_four_rooms`.
- Pieces must stay true circles with stable keys so old pieces do not reanimate on every realtime update.
- Desired future polish: sparkles when the winner modal appears.
