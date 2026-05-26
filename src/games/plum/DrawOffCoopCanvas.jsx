import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Eraser } from 'lucide-react';

const DrawOffCoopCanvas = ({ room, role, onGuessCorrect, currentWord }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [feedbackText, setFeedbackText] = useState('Waiting for your guess...');
  
  const broadcastChannel = useRef(null);

  useEffect(() => {
    if (!supabase || !room?.id) return;

    broadcastChannel.current = supabase.channel(`draw-off-coop-${room.id}`, {
      config: {
        broadcast: { ack: false },
      },
    });

    if (role === 'guesser') {
      broadcastChannel.current.on('broadcast', { event: 'stroke' }, (payload) => {
        drawRemoteStroke(payload.payload);
      });
      broadcastChannel.current.on('broadcast', { event: 'clear' }, () => {
        clearCanvasLocal();
      });
    }

    broadcastChannel.current.subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel.current);
    };
  }, [room?.id, role]);

  const drawRemoteStroke = ({ x0, y0, x1, y1, width, height }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale from normalized 0-1 coordinates
    const scaledX0 = x0 * canvas.width;
    const scaledY0 = y0 * canvas.height;
    const scaledX1 = x1 * canvas.width;
    const scaledY1 = y1 * canvas.height;

    ctx.beginPath();
    ctx.moveTo(scaledX0, scaledY0);
    ctx.lineTo(scaledX1, scaledY1);
    ctx.strokeStyle = 'black'; // could map to var(--foreground) but drawing usually black or theme specified
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const currentPos = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    if (role !== 'drawer') return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    currentPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || role !== 'drawer') return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(currentPos.current.x, currentPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    // Broadcast stroke
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'stroke',
        payload: {
          x0: currentPos.current.x / canvas.width,
          y0: currentPos.current.y / canvas.height,
          x1: x / canvas.width,
          y1: y / canvas.height,
        }
      });
    }

    currentPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = () => {
    if (role !== 'drawer') return;
    clearCanvasLocal();
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'clear',
        payload: {}
      });
    }
  };

  // Initialize white background
  useEffect(() => {
    clearCanvasLocal();
  }, []);

  // When word changes, clear canvas automatically
  useEffect(() => {
    clearCanvasLocal();
    setGuessInput('');
    setFeedbackText('Waiting for your guess...');
  }, [currentWord]);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (role !== 'guesser') return;
    
    // Prevent empty guess submission
    if (!guessInput.trim()) return;

    if (guessInput.trim().toLowerCase() === currentWord.toLowerCase()) {
      setFeedbackText('Nailed it!');
      setTimeout(() => onGuessCorrect(), 800); // brief celebration delay before next word
    } else {
      setFeedbackText(`Nope! "${guessInput}" is wrong!`);
      setGuessInput('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-10">
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">Role</p>
          <p className="mt-1 font-serif text-3xl font-medium capitalize">{role}</p>
        </div>
        
        <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">Score</p>
          <p className="mt-1 font-serif text-3xl font-medium">
            {room.words_guessed} / {room.target_words}
          </p>
        </div>

        <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">Status</p>
          <p className="mt-1 font-serif text-2xl font-medium">
            {role === 'drawer' ? (
              <span className="uppercase tracking-widest text-[color:var(--pink)]">{currentWord}</span>
            ) : (
              <span>{feedbackText}</span>
            )}
          </p>
        </div>
      </div>

      <div 
        className="relative overflow-hidden rounded-xl border border-[color:var(--ring)] bg-white shadow-[var(--shadow)]"
        style={{ height: 'clamp(18rem, 58vh, 23rem)' }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`h-full w-full touch-none bg-white ${role === 'drawer' ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {role === 'drawer' && (
          <button
            onClick={clearCanvas}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface-strong)] text-foreground border border-[color:var(--divider)] shadow-sm transition-transform hover:scale-105 active:scale-95"
            aria-label="Clear Canvas"
          >
            <Eraser className="h-5 w-5" />
          </button>
        )}
      </div>

      {role === 'guesser' && (
        <form onSubmit={handleGuessSubmit} className="mt-6">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess here..."
            className="w-full rounded-xl border border-[color:var(--divider)] bg-[color:var(--surface)] px-6 py-4 text-center text-xl font-medium outline-none transition focus:border-[color:var(--pink)] focus:ring-1 focus:ring-[color:var(--pink)]"
          />
        </form>
      )}
    </div>
  );
};

export default DrawOffCoopCanvas;