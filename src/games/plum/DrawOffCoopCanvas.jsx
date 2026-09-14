import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Eraser, Undo2 } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

// Tailwind's preflight reset is not active in this project, so `box-sizing` is
// content-box everywhere. Any box that combines padding with a width/height
// constraint has to opt into border-box explicitly or it overflows its parent.
const BORDER_BOX = { boxSizing: 'border-box' };

const panelStyle = {
  ...BORDER_BOX,
  border: '1px solid var(--divider)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface-strong)',
};

const tileLabelStyle = {
  fontSize: '0.6rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: 'var(--primary)',
};

// Brush presets, thinnest first - matches the single-player tray. The chosen
// width rides along in the stroke broadcast so the guesser sees the same line.
const BRUSH_SIZES = [
  { size: 1, label: 'Hairline' },
  { size: 3, label: 'Fine' },
  { size: 5, label: 'Medium' },
  { size: 9, label: 'Bold' },
  { size: 16, label: 'Marker' },
];

// Must be one of BRUSH_SIZES above, or no chip renders as active and the label
// falls back to a raw px value. Matches single-player's default (Medium).
const DEFAULT_BRUSH_SIZE = 5;

// Width used for strokes from a client that predates the `w` field in the payload.
const LEGACY_STROKE_WIDTH = 4;

const DrawOffCoopCanvas = ({ room, role, onGuessCorrect, currentWord }) => {
  const canvasRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [feedbackText, setFeedbackText] = useState('Waiting for your guess...');
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [strokeCount, setStrokeCount] = useState(0);

  // Full stroke history so a stroke can be undone by popping it and replaying
  // everything that's left. Segments are stored normalized (0-1), same shape
  // as the wire format, so replay works identically to `drawRemoteStroke`.
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef([]);
  const remoteCurrentStrokeRef = useRef([]);

  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  // Same default ink as single-player so the two modes look like the same game.
  const [brushColor, setBrushColor] = useState(isArcade ? '#39ff14' : '#0f172a');

  useEffect(() => {
    setBrushColor(theme === 'theme-arcade' ? '#39ff14' : '#0f172a');
  }, [theme]);

  const broadcastChannel = useRef(null);

  // Read the themed canvas/ink colours off the element so the sketchpad matches
  // the active theme instead of always being black ink on a white rectangle.
  const getCanvasColors = useCallback((canvas) => {
    const styles = getComputedStyle(canvas);
    return {
      background: styles.getPropertyValue('--canvas-bg').trim() || '#ffffff',
      stroke: styles.getPropertyValue('--stroke-color').trim() || '#000000',
    };
  }, []);

  // Canvas size in CSS pixels, plus the device-pixel backing size. The context
  // is scaled by the same ratio so all drawing below stays in CSS pixels.
  const getBackingSize = useCallback((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || canvas.offsetWidth || 800));
    const height = Math.max(1, Math.round(rect.height || canvas.offsetHeight || 600));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    return { width, height, ratio, backingWidth: Math.round(width * ratio), backingHeight: Math.round(height * ratio) };
  }, []);

  // `preserve` keeps the current drawing across a resize by rescaling a snapshot
  // onto the new backing store. Resizing a canvas always clears it, and there is
  // no stroke history here to replay, so without this a window resize would wipe
  // the drawer's work mid-round.
  const prepareCanvas = useCallback((preserve = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height, ratio, backingWidth, backingHeight } = getBackingSize(canvas);

    if (preserve && canvas.width === backingWidth && canvas.height === backingHeight) return;

    let snapshot = null;
    if (preserve && canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = backingWidth;
    canvas.height = backingHeight;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = getCanvasColors(canvas).background;
    ctx.fillRect(0, 0, width, height);
    if (snapshot) ctx.drawImage(snapshot, 0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [getBackingSize, getCanvasColors]);

  const clearCanvasLocal = useCallback(() => {
    prepareCanvas(false);
  }, [prepareCanvas]);

  // Attach via a ref callback so setup runs exactly when the element mounts.
  // An effect would fire before the canvas is in the DOM and silently leave the
  // backing store at the browser default of 300x150.
  const attachCanvas = useCallback((node) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    canvasRef.current = node;
    if (!node) return;

    prepareCanvas();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => prepareCanvas(true));
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, [prepareCanvas]);

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
        remoteCurrentStrokeRef.current.push(payload.payload);
      });
      broadcastChannel.current.on('broadcast', { event: 'stroke-end' }, () => {
        if (remoteCurrentStrokeRef.current.length > 0) {
          strokesRef.current.push({ segments: remoteCurrentStrokeRef.current });
          remoteCurrentStrokeRef.current = [];
        }
      });
      broadcastChannel.current.on('broadcast', { event: 'undo' }, () => {
        strokesRef.current.pop();
        redrawFromHistory();
      });
      broadcastChannel.current.on('broadcast', { event: 'clear' }, () => {
        strokesRef.current = [];
        remoteCurrentStrokeRef.current = [];
        clearCanvasLocal();
      });
    }

    broadcastChannel.current.subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel.current);
    };
  }, [room?.id, role]);

  // Payload stays normalized 0-1 (unchanged wire format), but it is mapped to
  // CSS pixels rather than backing-store pixels, because the context is
  // pre-scaled by the device pixel ratio. Shared by live drawing (both roles)
  // and history replay (undo), so all three stay visually identical.
  const renderSegment = useCallback((canvas, { x0, y0, x1, y1, w, c }) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(x0 * rect.width, y0 * rect.height);
    ctx.lineTo(x1 * rect.width, y1 * rect.height);
    // `c` and `w` are optional so strokes from an older client still render.
    ctx.strokeStyle = c || getCanvasColors(canvas).stroke;
    ctx.lineWidth = w || LEGACY_STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  }, [getCanvasColors]);

  const drawRemoteStroke = (segment) => renderSegment(canvasRef.current, segment);

  // Canvas is immediate-mode, so "undoing" a stroke means clearing and
  // replaying everything that's left in history — there's no other way to
  // remove ink that's already been rasterized.
  const redrawFromHistory = useCallback(() => {
    clearCanvasLocal();
    const canvas = canvasRef.current;
    if (!canvas) return;
    strokesRef.current.forEach((stroke) => {
      stroke.segments.forEach((segment) => renderSegment(canvas, segment));
    });
    setStrokeCount(strokesRef.current.length);
  }, [clearCanvasLocal, renderSegment]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const currentPos = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    if (role !== 'drawer') return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    currentPos.current = { x, y };
    currentStrokeRef.current = [];
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || role !== 'drawer') return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getCoordinates(e);

    const segment = {
      x0: currentPos.current.x / rect.width,
      y0: currentPos.current.y / rect.height,
      x1: x / rect.width,
      y1: y / rect.height,
      w: brushSize,
      c: brushColor,
    };

    renderSegment(canvas, segment);
    currentStrokeRef.current.push(segment);

    if (broadcastChannel.current) {
      broadcastChannel.current.send({ type: 'broadcast', event: 'stroke', payload: segment });
    }

    currentPos.current = { x, y };
  };

  const stopDrawing = () => {
    if (role === 'drawer' && currentStrokeRef.current.length > 0) {
      strokesRef.current.push({ segments: currentStrokeRef.current });
      currentStrokeRef.current = [];
      setStrokeCount(strokesRef.current.length);
      broadcastChannel.current?.send({ type: 'broadcast', event: 'stroke-end', payload: {} });
    }
    setIsDrawing(false);
  };

  const undoLastStroke = () => {
    if (role !== 'drawer' || strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redrawFromHistory();
    broadcastChannel.current?.send({ type: 'broadcast', event: 'undo', payload: {} });
  };

  const clearCanvas = () => {
    if (role !== 'drawer') return;
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setStrokeCount(0);
    clearCanvasLocal();
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'clear',
        payload: {}
      });
    }
  };

  // When word changes, clear canvas automatically
  useEffect(() => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    remoteCurrentStrokeRef.current = [];
    setStrokeCount(0);
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

  const isDrawer = role === 'drawer';

  return (
    <div
      style={{
        ...BORDER_BOX,
        marginInline: 'auto',
        width: '100%',
        maxWidth: 'min(72rem, 100%)',
        paddingInline: 'clamp(1rem, 3vw, 2rem)',
        paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
        color: 'var(--foreground)',
      }}
    >
      {/* Framed card, matching the single-player active section exactly - same
          --ring border, radius, surface and shadow, so both modes read as one game. */}
      <section
        style={{
          ...BORDER_BOX,
          position: 'relative',
          marginInline: 'auto',
          width: '100%',
          padding: 'clamp(0.85rem, 2vw, 1.35rem)',
          border: '1px solid var(--ring)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow)',
        }}
      >
      {/* Status tiles - auto-fit so they sit in a row on desktop and wrap on narrow screens */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
          gap: 'clamp(0.6rem, 1.5vw, 1rem)',
          marginBottom: 'clamp(0.85rem, 2vw, 1.25rem)',
        }}
      >
        <div style={{ ...panelStyle, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
          <p style={tileLabelStyle}>role</p>
          <p
            className="font-serif font-medium"
            style={{
              marginTop: '0.3rem',
              fontSize: 'clamp(1.15rem, 1rem + 0.6vw, 1.6rem)',
              lineHeight: 1.2,
              textTransform: 'capitalize',
              color: 'var(--foreground)',
            }}
          >
            {role}
          </p>
        </div>

        <div style={{ ...panelStyle, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
          <p style={tileLabelStyle}>score</p>
          <p
            className="font-serif font-medium"
            style={{
              marginTop: '0.3rem',
              fontSize: 'clamp(1.15rem, 1rem + 0.6vw, 1.6rem)',
              lineHeight: 1.2,
              color: 'var(--foreground)',
            }}
          >
            {room.words_guessed} / {room.target_words}
          </p>
        </div>

        <div style={{ ...panelStyle, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
          <p style={tileLabelStyle}>{isDrawer ? 'your word' : 'status'}</p>
          <p
            className="font-serif font-medium"
            style={{
              marginTop: '0.3rem',
              fontSize: isDrawer ? 'clamp(1.15rem, 1rem + 0.6vw, 1.6rem)' : 'clamp(0.9rem, 0.85rem + 0.3vw, 1.1rem)',
              lineHeight: 1.35,
              letterSpacing: isDrawer ? '0.12em' : undefined,
              textTransform: isDrawer ? 'uppercase' : undefined,
              color: isDrawer ? 'var(--primary)' : 'var(--foreground)',
              filter: isDrawer && isArcade ? 'drop-shadow(0 0 8px var(--primary))' : 'none',
            }}
          >
            {isDrawer ? currentWord : feedbackText}
          </p>
        </div>
      </div>

      {/* Sketchpad - height tracks the viewport so a big screen gets a big canvas,
          capped so a wide-but-short window can't push the guess box off-screen. */}
      <div style={{ ...panelStyle, padding: 'clamp(0.4rem, 1vw, 0.75rem)' }}>
        <div
          style={{
            ...BORDER_BOX,
            position: 'relative',
            overflow: 'hidden',
            height: 'clamp(16rem, calc(100vh - 30rem), 34rem)',
            border: '1px solid var(--divider)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
          }}
        >
          <canvas
            ref={attachCanvas}
            aria-label={isDrawer ? 'Draw Off co-op sketchpad' : "Your partner's drawing"}
            className={`h-full w-full touch-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ display: 'block' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {isDrawer && (
            <div
              style={{
                position: 'absolute',
                bottom: '0.85rem',
                right: '0.85rem',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <motion.button
                onClick={undoLastStroke}
                disabled={strokeCount === 0}
                className="transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  ...BORDER_BOX,
                  display: 'grid',
                  placeItems: 'center',
                  width: '2.75rem',
                  height: '2.75rem',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-strong)',
                  color: 'var(--foreground)',
                }}
                whileHover={strokeCount > 0 ? { y: -2 } : {}}
                whileTap={strokeCount > 0 ? { scale: 0.94 } : {}}
                aria-label="Undo last stroke"
              >
                <Undo2 className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={clearCanvas}
                className="transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                style={{
                  ...BORDER_BOX,
                  display: 'grid',
                  placeItems: 'center',
                  width: '2.75rem',
                  height: '2.75rem',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-strong)',
                  color: 'var(--foreground)',
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Clear canvas"
              >
                <Eraser className="h-5 w-5" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Brush tray - drawer only; the guesser has no reason to see it */}
      {isDrawer && (
        <div
          style={{
            ...panelStyle,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
            marginTop: 'clamp(0.85rem, 2vw, 1.25rem)',
            padding: 'clamp(0.75rem, 1.8vw, 1.1rem)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <label
              className="font-bold uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--muted)' }}
              htmlFor="coopBrushColor"
            >
              Ink
            </label>
            <div
              style={{
                ...BORDER_BOX,
                position: 'relative',
                width: '2rem',
                height: '2rem',
                overflow: 'hidden',
                borderRadius: '999px',
                border: '2px solid var(--ring)',
              }}
            >
              <input
                id="coopBrushColor"
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="cursor-pointer"
                style={{ position: 'absolute', inset: '-0.5rem', width: '3rem', height: '3rem', border: 0, background: 'transparent', padding: 0 }}
              />
            </div>
          </div>

          <div aria-hidden="true" style={{ width: '1px', alignSelf: 'stretch', background: 'var(--divider)' }} />

          <span
            className="font-bold uppercase"
            style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--muted)' }}
          >
            Brush
          </span>

          <div role="group" aria-label="Brush size" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {BRUSH_SIZES.map((brush) => {
              const active = brushSize === brush.size;
              return (
                <motion.button
                  key={brush.size}
                  type="button"
                  onClick={() => setBrushSize(brush.size)}
                  title={`${brush.label} (${brush.size}px)`}
                  aria-label={`${brush.label} brush, ${brush.size} pixels`}
                  aria-pressed={active}
                  className="transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{
                    ...BORDER_BOX,
                    display: 'grid',
                    placeItems: 'center',
                    width: '2.25rem',
                    height: '2.25rem',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: 'var(--radius)',
                    borderColor: active ? 'var(--primary)' : 'var(--divider)',
                    background: active ? 'color-mix(in srgb, var(--primary) 18%, var(--surface))' : 'var(--surface)',
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'block',
                      width: `${brush.size}px`,
                      height: `${brush.size}px`,
                      minWidth: '2px',
                      minHeight: '2px',
                      borderRadius: '999px',
                      background: brushColor,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', minWidth: '4.5rem' }}>
            {BRUSH_SIZES.find((b) => b.size === brushSize)?.label ?? `${brushSize}px`}
          </span>
        </div>
      )}

      {!isDrawer && (
        <form onSubmit={handleGuessSubmit} style={{ marginTop: 'clamp(0.85rem, 2vw, 1.25rem)' }}>
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess here..."
            className="w-full text-center font-medium outline-none transition focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
            style={{
              ...BORDER_BOX,
              paddingInline: 'clamp(1rem, 3vw, 1.5rem)',
              paddingBlock: '0.9rem',
              fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)',
              border: '1px solid var(--divider)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
            }}
          />
        </form>
      )}
      </section>
    </div>
  );
};

export default DrawOffCoopCanvas;
