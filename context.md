# Project Context

**Tech Stack**:
- **Framework**: React 18+ (initialized via Vite)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
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
