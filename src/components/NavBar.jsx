import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2, Home, Palette } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const NavBar = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'theme-vanilla', label: 'Vanilla' },
    { id: 'theme-pink', label: 'Pink' },
    { id: 'theme-arcade', label: 'Arcade' },
    { id: 'theme-cozy', label: 'Cozy' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/70 bg-[color:var(--surface)]/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <NavLink
          to="/"
          className="group mr-auto flex min-w-0 items-center gap-3 rounded-theme px-2 py-1.5 text-primary transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          aria-label="Lovelyland home"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-theme border border-border/80 bg-background shadow-sm transition group-hover:-rotate-3 group-hover:scale-105">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-base font-extrabold leading-tight">Lovelyland</span>
            <span className="block text-[11px] font-medium uppercase text-[color:var(--muted)]">minigame hub</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-1 rounded-theme border border-border/70 bg-background/70 p-1 shadow-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-theme transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] ${
                isActive ? 'bg-primary text-background shadow-sm' : 'text-[color:var(--muted)] hover:bg-secondary hover:text-primary'
              }`
            }
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </NavLink>

          <label className="flex h-9 items-center gap-2 rounded-theme px-2 text-[color:var(--muted)] focus-within:ring-2 focus-within:ring-[color:var(--ring)]">
            <Palette className="h-4 w-4" />
            <span className="sr-only">Theme</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="theme-select h-full cursor-pointer rounded-theme bg-transparent pr-1 text-sm font-semibold text-primary outline-none"
            >
              {themes.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </nav>
  );
};
