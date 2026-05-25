import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eraser, Loader2, Play, Send, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

// const DOODLE_WORDS = ["apple", "cat", "dog", "car", "tree", "bicycle", "book", "camera", "chair", "clock", "cup", "eye", "flower", "glasses", "hat", "house", "key", "pants", "pizza", "shoe", "smiley face", "star", "sun", "umbrella"];

const EASY_CLASS_HINTS = {
  apple: 'round fruit outline, stem, leaf, apple shape',
  cat: 'cat face or body, pointy ears, whiskers, eyes, tail',
  dog: 'dog face or body, ears, snout, nose, legs, tail',
  car: 'vehicle body, wheels, windows, side view',
  tree: 'trunk with leafy top, branches, canopy',
  bicycle: 'two wheels connected by frame, handlebar, seat',
  book: 'rectangle cover, pages, spine, open book shape',
  camera: 'rectangle body, circular lens, top button/viewfinder',
  chair: 'seat, legs, backrest',
  clock: 'circle or square clock face with hands or tick marks',
  cup: 'cup or mug shape, open top, handle, base',
  eye: 'eye outline, iris or pupil, eyelids',
  flower: 'petals around center, stem, leaves',
  glasses: 'two lenses connected by bridge, eyeglass frame',
  hat: 'brim with crown/top, cap or hat silhouette',
  house: 'square/rectangle building, roof, door, window',
  key: 'loop/ring, shaft, teeth at the end',
  pants: 'two trouser legs, waistband, pants outline',
  pizza: 'triangular slice with toppings or whole round pizza divided into slices',
  shoe: 'footwear side profile, sole, opening, sneaker shape',
  'smiley face': 'face circle with eyes and smiling mouth',
  star: 'five-point star or recognizable star shape',
  sun: 'circle or round center with rays/lines around it',
  umbrella: 'curved canopy with handle or umbrella outline',
};

const HARD_CLASS_HINTS = {
  // Classic Simple (Keep a few as warm-ups)
  apple: 'round fruit, stem, leaf', 
  cat: 'cat face, pointy ears, whiskers', 
  car: 'vehicle body, wheels',
  
  // The New "Intricate but Fun" Tier
  'sunset behind mountains': 'two or more triangular mountains, half-circle sun peeking behind them, sun rays',
  rabbit: 'animal with very long ears, fluffy tail, whiskers, small nose',
  dinosaur: 'reptilian body, either tiny arms and big head (t-rex) or plates on back (stegosaurus)',
  helicopter: 'aircraft cabin/bubble, top rotor blades, tail rotor, landing skids',
  'eiffel tower': 'tall tapering lattice structure, wide base with arches, tiers',
  lighthouse: 'tall tapering cylinder building, light beams radiating from top, stripes',
  'spider web': 'radial lines extending outward, connected by concentric circles or hexagons',
  campfire: 'crossed rectangular logs at the base, jagged flame shapes on top',
  mermaid: 'human torso and arms, long fish tail with fins, long hair',
  sailboat: 'boat hull, one or more large triangular sails, mast, sitting on water line',
  castle: 'stone walls, towers with jagged crenellations on top, arched gate or drawbridge'
};

const pickTargetWord = (previousWord, activeHints) => {
  const choices = Object.keys(activeHints).filter((word) => word !== previousWord);
  return choices[Math.floor(Math.random() * choices.length)];
};

const getInitialInkBounds = () => ({
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
});

const actionButtonBase = 'inline-flex min-h-14 w-full items-center justify-center gap-2 border-2 px-5 py-3 text-base font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-55';
const primaryActionClass = `${actionButtonBase} border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--surface)] shadow-sm hover:brightness-95`;
const secondaryActionClass = `${actionButtonBase} border-[color:var(--ring)] bg-[color:var(--surface-strong)] text-foreground hover:bg-[color:var(--surface)]`;

const getCanvasBase64Image = (canvas) => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;

  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.fillStyle = '#FFFFFF';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.drawImage(canvas, 0, 0);

  return exportCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
};

const DrawOffSingle = () => {
  const canvasRef = useRef(null);
  const debounceTimer = useRef(null);
  const judgeRequestRef = useRef(0);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const inkBoundsRef = useRef(getInitialInkBounds());
  const inkDistanceRef = useRef(0);
  const strokeCountRef = useRef(0);
  const targetStartedAtRef = useRef(0);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const hasAutoClearedOnVisitRef = useRef(false);

  const [targetWord, setTargetWord] = useState(null);
  const [score, setScore] = useState(0);
  const [targetScore] = useState(3);
  const [difficulty, setDifficulty] = useState('easy');
  const [brushColor, setBrushColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(5);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isJudging, setIsJudging] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('Waiting for your masterpiece...');
  const [judgeError, setJudgeError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const getCanvasBackground = useCallback((canvas) => {
    return getComputedStyle(canvas).getPropertyValue('--canvas-bg').trim() || '#ffffff';
  }, []);

  const getDisplaySize = useCallback((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(canvas.offsetWidth || rect.width || 720)),
      height: Math.max(1, Math.round(canvas.offsetHeight || rect.height || 460)),
    };
  }, []);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = getDisplaySize(canvas);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = getCanvasBackground(canvas);
    ctx.fillRect(0, 0, width, height);
    
    // We intentionally don't set strokeStyle/lineWidth here 
    // because `draw()` sets them dynamically every stroke using brushColor/brushSize.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [getCanvasBackground, getDisplaySize]);

  const ensureCanvasReady = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getDisplaySize(canvas);
    if (canvas.width !== width || canvas.height !== height) {
      prepareCanvas();
    }
  }, [getDisplaySize, prepareCanvas]);

  useEffect(() => {
    if (!isGameActive || !startTime) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isGameActive, startTime]);

  useEffect(() => {
    if (!isGameActive) return undefined;

    const handleResize = () => {
      if (!hasInkRef.current) {
        prepareCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isGameActive, prepareCanvas]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const trackInk = useCallback((from, to) => {
    const bounds = inkBoundsRef.current;
    bounds.minX = Math.min(bounds.minX, from.x, to.x);
    bounds.minY = Math.min(bounds.minY, from.y, to.y);
    bounds.maxX = Math.max(bounds.maxX, from.x, to.x);
    bounds.maxY = Math.max(bounds.maxY, from.y, to.y);
    inkDistanceRef.current += Math.hypot(to.x - from.x, to.y - from.y);
  }, []);

  const clearCanvas = useCallback((nextFeedback = 'Waiting for your masterpiece...') => {
    const feedback = typeof nextFeedback === 'string' ? nextFeedback : 'Waiting for your masterpiece...';

    window.clearTimeout(debounceTimer.current);
    judgeRequestRef.current += 1;
    isDrawingRef.current = false;
    prepareCanvas();
    hasInkRef.current = false;
    inkBoundsRef.current = getInitialInkBounds();
    inkDistanceRef.current = 0;
    strokeCountRef.current = 0;
    setAiFeedback(feedback);
    setIsJudging(false);
  }, [prepareCanvas]);

  useEffect(() => () => window.clearTimeout(debounceTimer.current), []);

  useEffect(() => {
    if (score === targetScore && score > 0) {
      window.clearTimeout(debounceTimer.current);
      judgeRequestRef.current += 1;
      setIsJudging(false);
      setIsGameActive(false);
      setIsComplete(true);
    }
  }, [score, targetScore]);

  useEffect(() => {
    if (!isGameActive) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        if (!hasAutoClearedOnVisitRef.current) {
          clearCanvas();
          hasAutoClearedOnVisitRef.current = true;
        } else if (!hasInkRef.current) {
          prepareCanvas();
        }
      }, 0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [clearCanvas, isGameActive, prepareCanvas]);

  const startSprint = () => {
    setScore(0);
    setElapsedTime(0);
    setAiFeedback('Waiting for your masterpiece...');
    setJudgeError('');
    setIsComplete(false);
    const activeHints = difficulty === 'hard' ? HARD_CLASS_HINTS : EASY_CLASS_HINTS;
    const nextTarget = pickTargetWord(null, activeHints);
    setTargetWord(nextTarget);
    targetStartedAtRef.current = Date.now();
    setStartTime(Date.now());
    setIsGameActive(true);
  };

  const handleDrawingSubmit = useCallback(() => {
    window.clearTimeout(debounceTimer.current);

    const submitAfterPause = window.setTimeout(() => {
      const canvas = canvasRef.current;

      if (!canvas || !hasInkRef.current || !isGameActive || !targetWord || isJudging) {
        return;
      }

      const requestId = judgeRequestRef.current + 1;
      judgeRequestRef.current = requestId;
      const base64Image = getCanvasBase64Image(canvas);

      const submitDrawing = async () => {
        if (!supabase) {
          setJudgeError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
          return;
        }

        setIsJudging(true);
        setJudgeError('');

        try {
          const activeHints = difficulty === 'hard' ? HARD_CLASS_HINTS : EASY_CLASS_HINTS;
          console.log('Sending Base64 length:', base64Image.length);
          const { data, error } = await supabase.functions.invoke('judge-drawing', {
            body: {
              base64Image,
              targetWord,
              classHints: activeHints,
            },
          });
          console.log('Raw AI Response:', data);
          if (data?.raw) {
            console.log('Raw Gemini Text:', data.raw);
          }

          if (requestId !== judgeRequestRef.current) return;
          if (error) throw error;

          const result = typeof data === 'string' ? { verdict: data, guess: data, reason: '' } : data || {};
          const verdict = String(result.verdict || result.guess || 'wrong').trim().toLowerCase();
          const guess = String(result.guess || verdict).trim().toLowerCase();
          const reason = String(result.reason || '').trim();

          if (verdict === 'match' || guess === targetWord) {
            setAiFeedback(reason ? `Nailed it! ${reason}` : 'Nailed it!');
          } else if (verdict === 'incomplete') {
            setAiFeedback(`Incomplete! Reason: ${reason || 'No reason returned.'}`);
          } else if (Object.keys(activeHints).includes(guess)) {
            setAiFeedback(`Nope! AI guessed: ${guess}. Reason: ${reason || 'No reason returned.'}`);
          } else if (guess && guess !== 'wrong') {
            setAiFeedback(`Nope! AI guessed: ${guess}. Reason: ${reason || 'No reason returned.'}`);
          } else {
            setAiFeedback(`Nope! AI guessed: ${guess || 'wrong'}. Reason: ${reason || 'No reason returned.'}`);
          }

          if (verdict !== 'match' && guess !== targetWord) return;

          setScore((currentScore) => {
            const nextScore = currentScore + 1;
            clearCanvas('Nailed it!');

            if (nextScore < targetScore) {
              setTargetWord((currentTarget) => {
                const activeHints = difficulty === 'hard' ? HARD_CLASS_HINTS : EASY_CLASS_HINTS;
                const nextTarget = pickTargetWord(currentTarget, activeHints);
                targetStartedAtRef.current = Date.now();
                return nextTarget;
              });
            }

            return nextScore;
          });
        } catch (error) {
          if (requestId !== judgeRequestRef.current) return;
          console.error('Draw Off judge request failed:', error);
          setAiFeedback('Network/API Error: Check console.');
          setJudgeError(error?.message || 'The judge could not read that drawing.');
        } finally {
          if (requestId === judgeRequestRef.current) {
            setIsJudging(false);
          }
        }
      };

      submitDrawing();
    }, 120);

    debounceTimer.current = submitAfterPause;
  }, [clearCanvas, isGameActive, isJudging, targetWord, targetScore, difficulty]);

  const startDrawing = (event) => {
    if (isJudging) return;
    if (!isGameActive) return;
    event.preventDefault();
    window.clearTimeout(debounceTimer.current);
    judgeRequestRef.current += 1;

    const canvas = canvasRef.current;
    if (!hasInkRef.current) ensureCanvasReady();
    canvas.setPointerCapture?.(event.pointerId);

    isDrawingRef.current = true;
    strokeCountRef.current += 1;
    lastPointRef.current = getCanvasPoint(event);
  };

  const draw = (event) => {
    if (isJudging) return;
    if (!isDrawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasPoint(event);
    const lastPoint = lastPointRef.current;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    trackInk(lastPoint, point);
    lastPointRef.current = point;
    hasInkRef.current = true;
  };

  const stopDrawing = (event) => {
    if (isJudging) return;
    if (!isDrawingRef.current) return;
    event.preventDefault();

    canvasRef.current?.releasePointerCapture?.(event.pointerId);
    isDrawingRef.current = false;
  };

  return (
    <div className="mx-auto max-w-6xl px-2 py-10 text-foreground sm:px-4">
      <header className="mb-8 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">single player sprint</p>
        <h1 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Draw Off</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          Draw the prompt, submit when it is ready, and race the AI to three correct guesses.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!isGameActive && !isComplete && (
          <motion.div
            key="start"
            className="mx-auto max-w-xl shadow-[var(--shadow)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="border border-border/70 bg-[color:var(--surface)] p-8 text-center" style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}>
              <Sparkles className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 font-serif text-3xl font-medium">Ready to sprint?</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Get {targetScore} target words past the sketch judge as fast as you can.
              </p>
              <motion.button
                type="button"
                onClick={startSprint}
                className={`mx-auto mt-6 max-w-56 ${primaryActionClass}`}
                style={{ borderRadius: 'var(--radius)' }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="h-4 w-4" />
                Start Sprint
              </motion.button>
            </div>
            
            <div className="border border-t-0 border-border/70 bg-[color:var(--surface-strong)] p-5" style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}>
              <label className="text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)] mb-3 flex items-center justify-center gap-2">
                Difficulty
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 rounded border py-2 text-sm font-bold transition-colors ${
                    difficulty === 'easy' 
                      ? 'border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--surface)]' 
                      : 'border-border/70 bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-[color:var(--primary)]'
                  }`}
                >
                  Easy Mode
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty('hard')}
                  className={`flex-1 rounded border py-2 text-sm font-bold transition-colors ${
                    difficulty === 'hard' 
                      ? 'border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--surface)]' 
                      : 'border-border/70 bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-[color:var(--primary)]'
                  }`}
                >
                  Hard Mode
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isComplete && (
          <motion.div
            key="complete"
            className="mx-auto max-w-xl border border-border/70 bg-[color:var(--surface)] p-8 text-center shadow-[var(--shadow)]"
            style={{ borderRadius: 'var(--radius)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-serif text-3xl font-medium">Sprint Complete!</h2>
            <p className="mt-3 text-lg font-semibold">Final time: {elapsedTime.toFixed(1)} seconds</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">You got {targetScore} out of {targetScore}. Very tidy chaos.</p>
            <motion.button
              type="button"
              onClick={startSprint}
              className={`mx-auto mt-6 max-w-56 ${primaryActionClass}`}
              style={{ borderRadius: 'var(--radius)' }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="h-4 w-4" />
              Play Again
            </motion.button>
          </motion.div>
        )}

        {isGameActive && (
          <motion.section
            key="active"
            className="relative border bg-[color:var(--surface)] p-4 shadow-[var(--shadow)]"
            style={{
              borderColor: 'var(--ring)',
              borderRadius: 'var(--radius)',
              marginInline: 'auto',
              maxWidth: '52rem',
              width: 'min(100%, 52rem)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_1.35fr]">
              <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">target word</p>
                <p className="mt-1 font-serif text-3xl font-medium capitalize">{targetWord}</p>
              </div>
              <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">score</p>
                <p className="mt-1 font-serif text-3xl font-medium">{score} / {targetScore}</p>
              </div>
              <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">judge</p>
                  {isJudging && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <p className="mt-1 font-serif text-2xl font-medium">
                  {isJudging ? 'AI is squinting at your drawing...' : aiFeedback}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden border border-border/70 bg-[color:var(--surface-strong)] p-3" style={{ borderRadius: 'var(--radius)' }}>
              <div
                className="relative overflow-hidden border border-border/70 bg-[color:var(--surface)]"
                style={{ borderRadius: 'var(--radius)', height: 'clamp(18rem, 58vh, 23rem)' }}
              >
                <canvas
                  ref={canvasRef}
                  aria-label="Draw Off sprint canvas"
                  className={`h-full w-full touch-none transition-opacity ${isJudging ? 'cursor-wait opacity-45' : 'cursor-crosshair opacity-100'}`}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
                {isJudging && (
                  <div className="absolute inset-0 grid place-items-center bg-[color:var(--surface)]/70">
                    <div className="inline-flex items-center gap-2 border border-border/70 bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-primary" style={{ borderRadius: 'var(--radius)' }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is squinting at your drawing...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6 rounded border border-border/70 bg-[color:var(--surface-strong)] p-4 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex items-center gap-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--muted)]" htmlFor="brushColor">Ink Color</label>
                <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[color:var(--ring)] shadow-sm transition-transform hover:scale-105">
                  <input
                    id="brushColor"
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="absolute -inset-2 h-12 w-12 cursor-pointer border-0 bg-transparent p-0"
                  />
                </div>
              </div>
              
              <div className="h-6 w-px bg-border/40 hidden sm:block"></div>

              <div className="flex flex-1 items-center gap-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--muted)]" htmlFor="brushSize">Thickness</label>
                <div className="flex flex-1 items-center gap-3 rounded-full bg-[color:var(--surface)] px-3 py-1 border border-border/60">
                  <input
                    id="brushSize"
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-border/50 accent-[color:var(--primary)]"
                  />
                  <div className="flex w-6 justify-center">
                    <div 
                      className="rounded-full bg-[color:var(--foreground)]" 
                      style={{ width: `${brushSize}px`, height: `${brushSize}px`, backgroundColor: brushColor }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <motion.button
                type="button"
                onClick={() => clearCanvas()}
                className={`${secondaryActionClass} sm:w-1/3`}
                style={{ borderRadius: 'var(--radius)' }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <Eraser className="h-5 w-5" />
                Clear
              </motion.button>

              <motion.button
                type="button"
                onClick={handleDrawingSubmit}
                disabled={isJudging}
                className={`${primaryActionClass} sm:w-2/3`}
                style={{ borderRadius: 'var(--radius)' }}
                whileHover={isJudging ? undefined : { y: -2 }}
                whileTap={isJudging ? undefined : { scale: 0.99 }}
              >
                {isJudging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isJudging ? 'Judging...' : 'Submit Drawing'}
              </motion.button>
            </div>

            {judgeError && (
              <p className="mt-4 border border-border/70 bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--muted)]" style={{ borderRadius: 'var(--radius)' }}>
                {judgeError}
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrawOffSingle;
