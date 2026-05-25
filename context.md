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
- The top navigation and game cards are designed as reusable themed components, so component structure should stay shared while each style's personality comes from CSS variables.
- Current Vanilla feedback: prefer sleeker/lighter text, clearly visible gaps between game cards both across rows and between rows, theme selection as a dropdown instead of individual buttons, and no "four little worlds" eyebrow in the home header.
- Game card spacing is controlled by the shared `.game-grid` class in `src/styles/index.css`; use that class instead of ad hoc grid gap utilities so card spacing remains visibly separated across pages.
- Theme dropdown styling is controlled by `.theme-select`; keep both the select and option colors tied to theme variables so dark themes like Arcade remain readable.
- Game cards should follow the sleek catalog-card direction: three cards per row on wide screens, horizontal side scrolling on smaller screens, quiet serif titles, small uppercase category chips, and an image/placeholder area instead of emojis. Real per-game images can be passed through `imageSrc` on `GameCard`.
- Game card dividers use the themed `--divider` token and `.game-card-divider`; keep separators visible in all four styles, especially Arcade.
- Section headers should live inside `.game-section-shell` with the card grid so "Your Turn" and "Start a New Game" align with the centered card row instead of the page edge.
- The "Draw Off" catalog card uses dynamic theme-based images mapped to the active CSS-variable theme, defaults Cozy to the Vanilla image, and follows the catalog-card direction with full-bleed cropped imagery, uppercase chips, and no emojis.

**Current Features**:
- "Draw Off" lives in `src/games/plum/DrawOff.jsx`; the active single-player sprint route uses Transformers.js CLIP zero-shot image classification locally in the browser.
- The active `/draw-off` route currently points to the Single Player Sprint testing version at `src/games/plum/testing/DrawOffSingle.jsx`.

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
