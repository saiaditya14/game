import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Home, Maximize2, Minimize2, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { MonopolyBoard } from './MonopolyBoard';
import { MonopolySidebar } from './MonopolySidebar';

export const PastelMonopoly = () => {
  const { theme, setTheme } = useTheme();
  const pageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const themes = [
    { id: 'theme-vanilla', label: 'Vanilla' },
    { id: 'theme-pink', label: 'Pink' },
    { id: 'theme-arcade', label: 'Arcade' },
    { id: 'theme-cozy', label: 'Cozy' },
  ];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === pageRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await pageRef.current?.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return (
    <div className="sugaropoly-page" ref={pageRef}>
      <nav className="sugaropoly-topbar" aria-label="Sugaropoly navigation">
        <Link className="sugaropoly-brand-link" to="/" aria-label="Lovelyland home">
          <span className="sugaropoly-brand-mark">
            <Gamepad2 aria-hidden="true" />
          </span>
          <span className="sugaropoly-brand-copy">
            <span>Lovelyland</span>
            <small>minigame hub</small>
          </span>
        </Link>

        <div className="sugaropoly-title-lockup" aria-label="Current game">
          <Sparkles aria-hidden="true" />
          <span>Faerie Kingdom Quest</span>
        </div>

        <div className="sugaropoly-topbar-actions">
          <Link className="sugaropoly-nav-icon-button" to="/" aria-label="Home" title="Home">
            <Home aria-hidden="true" />
          </Link>

          <label className="sugaropoly-theme-control">
            <Palette aria-hidden="true" />
            <span className="sr-only">Theme</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="theme-select"
            >
              {themes.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="sugaropoly-nav-icon-button"
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enable fullscreen mode'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div className="sugaropoly-layout">
        <div className="sugaropoly-board-pane">
          <MonopolyBoard />
        </div>

        <div className="sugaropoly-sidebar-pane">
          <MonopolySidebar />
        </div>
      </div>
    </div>
  );
};

export default PastelMonopoly;
