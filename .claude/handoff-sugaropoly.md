# Handoff: Sugaropoly style pass

Read `.claude/gameplan.md` and its "How to work" section first, then `context.md`'s
Sugaropoly notes. Load these memories before touching anything: `sugaropoly-pink-only`,
`tailwind-named-spacing-broken`, `feedback-ui-density-and-iteration`,
`feedback-pacing-directness`, `feedback-commits`, `ui-theming-state`.

Everything below is **confirmed with the user** (2026-08-26). Scope is deliberately
narrow — do not widen it.

---

## The user's actual asks, verbatim intent

1. **The Create/Join lobby page is "definitely not up to snuff"** — it does not match
   the quality of the rest of the game. This is the main job.
2. **The rest of the page is good** — "a really cute thing going for it, albeit
   distinctive style." KEEP IT. Do not homogenise Sugaropoly into the rest of the
   site's look. Its distinctiveness is a feature.
3. **Remove the theme changer entirely.**
4. **Try the pink theme's background behind the board** — user is explicitly unsure
   ("not sure if that's a good idea or not"). This is an EXPERIMENT to show them, not
   a committed requirement. See the dedicated section below.

---

## Ground rules

**Sugaropoly is pink-only, permanently.** Confirmed by the user. Don't build or verify
against champagne/arcade/cozy, and don't flag "not theme-tested" as a defect here.

**Its design lives in CSS, not JSX.** `src/styles/index.css` lines ~234–2508 (~2,270
lines, ~80% of the whole stylesheet) is a bespoke semantic system:
`.sugaropoly-lobby-card`, `.monopoly-tile`, `.monopoly-corner`, driven by custom
properties (`--monopoly-board-size`, `--monopoly-sidebar-width`,
`--monopoly-layout-gap`). It already uses `clamp()`-based responsive sizing. **This
system is the "cute thing" the user wants kept** — fix things *inside* it. Do NOT
convert it to the inline-`style`/`var(--token)` pattern used by the other games. JSX in
`src/games/sugar/monopoly/` is thin by comparison (~1,200 lines across 11 files).

---

## The bug class behind "not up to snuff"

**Verify this yourself before starting — don't take it on faith.** The project runs
Tailwind v4 but `src/styles/index.css` opens with the v3 entrypoint (`@tailwind base;`
etc.). Under v4 that resolves to nothing, so **every named-spacing utility (`p-5`,
`gap-2`, `min-h-12`, `px-5`, `py-3`, `max-w-xl`…) generates zero CSS**, and Tailwind's
preflight reset never loads either (`box-sizing` is `content-box` everywhere; `body`
keeps its default margin).

Sugaropoly's own CSS classes are written correctly and DO apply. But wherever a
component reaches *past* that CSS into a Tailwind utility for sizing, it silently gets
nothing. The design is half-wired — which is very likely why the lobby reads as low
quality while the board (pure CSS, no Tailwind sizing) reads as cute and deliberate.

Concrete, measured proof in `src/games/sugar/monopoly/MonopolyLobby.jsx`:

```js
const lobbyButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold ...';
```

`min-h-12`, `gap-2`, `px-5`, `py-3`, `text-sm` all emit nothing. Measured in a real
browser at `/monopoly`: the Create/Join buttons render at **30px tall with
`padding: 1px 6px`** — browser defaults — while `.sugaropoly-lobby-primary` /
`-secondary` (`index.css` ~line 539) correctly supply the gradient, border and shadow.
The icon also collides with the label (dead `gap-2`).

**Do NOT fix this by switching the CSS entrypoint** to `@import "tailwindcss"`. That
would activate hundreds of dormant spacing classes across every other page and theme at
once and wreck already-tuned, locked layouts (see `ui-theming-state`). Fix locally:
add the missing sizing to the existing `.sugaropoly-*` CSS block, matching its idiom
(custom properties + `clamp()`). Prefer that over inline styles here — it keeps
Sugaropoly's system intact, which is the whole point.

---

## Job 1 — the lobby (the main work)

Files: `src/games/sugar/monopoly/MonopolyLobby.jsx` + the `.sugaropoly-lobby*` rules in
`src/styles/index.css` (~line 456 onward).

Confirmed problems, measured at 1440×900 / 1920×1080 / 390×844 in theme-pink:

1. **Create/Join buttons are browser-default sized** (30px tall, `1px 6px` padding,
   icon touching label). Give them real height/padding/gap via the CSS class — ~48px
   tall was the intent of the dead `min-h-12`. This also affects the Join-form submit
   button and the waiting-room Start/Leave buttons, which share `lobbyButtonClass`.

2. **Card and page backgrounds compete.** `.sugaropoly-lobby-card` (~line 465) is a
   multi-stop gradient — blue radial top-left, yellow radial top-right, over a
   pink→cyan diagonal — sitting on a page that is *also* a broad pastel wash, at
   similar lightness. The card's only real separation is its 3px border, and the
   corner blooms pull the eye to the card's corners instead of its title and buttons.
   Calm one layer (most likely flattening the card interior) so the card reads as
   sitting ON the page. **This is a taste call — show the user before committing.**

3. **Density at wide viewports.** At 1440×900 the card occupies ~a third of the screen
   inside a large empty void; worse at 1920×1080. See
   `feedback-ui-density-and-iteration` — this user dislikes small fixed content
   stranded in big viewports. Don't just inflate the card to fill space; consider
   whether the void wants a treatment. Ask if unsure.

Match the quality bar of the board/sidebar, in Sugaropoly's own visual language.

---

## Job 2 — delete the theme changer

`src/games/sugar/monopoly/PastelMonopoly.jsx`:
- Line ~199 renders `.sugaropoly-theme-control` — a `<select>` wired to the app-wide
  `useTheme()`.
- Line ~36 holds its local `themes` array (`theme-vanilla` / `pink` / `arcade` / `cozy`).

**Delete the control outright — do not narrow it to pink.** Also remove the now-unused
`themes` array and the `Palette` import if nothing else uses them, and the
`.sugaropoly-theme-control` CSS rules (`index.css` ~lines 294, 319) if they become
dead. Leave the rest of that nav row — home, leave-room, fullscreen — the user
confirmed the top bar is otherwise fine.

⚠️ **Consequence you must handle:** `theme` is global app state. With the picker gone,
whatever theme the user last selected elsewhere persists into Sugaropoly. If they were
on arcade, Sugaropoly renders with arcade tokens — and the pink background experiment
below silently won't work. Decide and raise with the user: does `PastelMonopoly` force
`setTheme('theme-pink')` on mount (and if so, does it restore the previous theme on
unmount, or leave the app pink)? This is a real decision, not an implementation
detail — surface it, don't silently pick.

---

## Job 3 — EXPERIMENT: pink's background behind the board

The user wants to *see* this, and is openly unsure about it. Prototype it, screenshot
it at a few widths, show them, let them decide. Do not treat it as a committed
requirement, and do not build it into a state that's hard to back out.

**Why this is cheaper than it looks:** `ThemeScene` is mounted at `src/App.jsx` line
~25, **outside** `<BrowserRouter>`. It therefore already renders on every route
including `/monopoly`. When the theme is pink it paints (see `ThemeScene.jsx` ~line
588): the pixel-art wallpaper `images/Trial 1.jpg` (`backgroundSize: cover`,
`imageRendering: pixelated`), a soft pink readability veil, and an R3F canvas of 24
falling cherry blossoms. It sits at `position: fixed; inset: 0; z-index: 0`, and the
app content wrapper sits at `zIndex: 10`.

So the pink scene is **already behind Sugaropoly right now** — Sugaropoly's own opaque
page background is simply painted over it. The experiment is largely a matter of
letting it show through (make the Sugaropoly page background transparent or partially
so), NOT mounting anything new. No extra WebGL context is created.

Things that will decide whether it's actually a good idea — evaluate honestly and tell
the user, including if the answer is "this looks worse":
- **Board legibility.** The board is many small tiles with text. Falling blossoms and a
  busy pixel wallpaper behind them may destroy readability. A stronger scrim/veil
  between scene and board is likely needed; the existing veil is tuned for the
  homepage's large text, not a dense board.
- **Motion distraction** during actual play — constant animation behind a strategy
  board is very different from behind a homepage.
- **Performance** — R3F animating continuously behind a full game screen.
- It may work behind the *lobby* but not behind the *board*. Those can differ; say so
  if that's what you find.

Do NOT modify `ThemeScene.jsx`, the pink scene, or the wallpaper — the pink theme is
LOCKED (`ui-theming-state`). Achieve the effect purely from Sugaropoly's own layers.

---

## Do not touch without separate sign-off

- **The board, sidebar, property cards, dice overlay, victory overlay.** The user says
  these are good. The same dead-Tailwind bug is likely present in some of them — if you
  find it (`git grep` Tailwind spacing utilities across
  `src/games/sugar/monopoly/*.jsx`, then confirm against computed styles), **report
  what you found and where, but do not fix it without asking.** This user works
  screen-by-screen and confirms taste calls before moving on.
- The top nav row beyond removing the theme control.
- `monopolyRules.js`, its tests, Supabase queries, realtime code, any game logic.
  Presentation layer only.
- Other games (Draw Off, Gambling Corner, etc.) — Draw Off's UI pass is complete; leave
  it alone.

---

## Verification standard (non-negotiable)

This bug class is **invisible in source review** — the Tailwind classes look correct in
the JSX, which is exactly how it survived this long. Playwright is installed.

- Screenshot before/after, and read the screenshots.
- Measure real computed values (`getBoundingClientRect`, `getComputedStyle`) for
  anything you claim is now sized or spaced correctly. Never claim "it's 48px now" off
  a screenshot.
- **When comparing two screens for visual parity, walk the ENTIRE ancestor chain up to
  `<body>`.** A probe that stops a couple of levels above the element will miss an
  outer frame and wrongly report two screens as identical — this exact mistake was made
  during the Draw Off pass and the user caught it from a screenshot.
- Test at ~390px, ~1440px, ~1920px — density and background issues are
  viewport-dependent.
- theme-pink only.

## Finally

**Do not commit or push.** The user controls all git commits. Report what changed, what
you deliberately left alone, and — for Job 3 — give a straight recommendation on
whether the pink background actually helps.
