import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MonopolyBoard } from './MonopolyBoard';
import { MonopolySidebar } from './MonopolySidebar';

export const PastelMonopoly = () => {
  const pageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      <header className="sugaropoly-header">
        <button
          className="sugaropoly-fullscreen-button"
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enable fullscreen mode'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </header>

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
