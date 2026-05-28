import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MonopolyBoard } from './MonopolyBoard';
// import { MonopolySidebar } from './MonopolySidebar';

export const PastelMonopoly = () => {
  const layoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === layoutRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!layoutRef.current) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await layoutRef.current.requestFullscreen();
  };

  return (
    <div className="sugaropoly-page">
      <header className="sugaropoly-header">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-500 uppercase drop-shadow-sm">Sugaropoly</h1>
          <p className="text-rose-500 font-semibold mt-1">A sweet pastel property trading game</p>
        </div>
      </header>

      <div ref={layoutRef} className="sugaropoly-layout">
        <button
          type="button"
          className="sugaropoly-fullscreen-button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </button>

        <div className="sugaropoly-board-pane">
          <MonopolyBoard />
        </div>

        {/* <div className="sugaropoly-sidebar-pane">
          <MonopolySidebar />
        </div> */}
      </div>
    </div>
  );
};

export default PastelMonopoly;
