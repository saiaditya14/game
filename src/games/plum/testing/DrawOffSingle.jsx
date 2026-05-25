import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eraser, Loader2, Play, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const DOODLE_WORDS = ["apple", "cat", "dog", "car", "tree", "bicycle", "book", "camera", "chair", "clock", "cup", "eye", "flower", "glasses", "hat", "house", "key", "pants", "pizza", "shoe", "smiley face", "star", "sun", "umbrella"];

const pickTargetWord = (previousWord) => {
  const choices = DOODLE_WORDS.filter((word) => word !== previousWord);
  return choices[Math.floor(Math.random() * choices.length)];
};

const getInitialInkBounds = () => ({
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
});

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
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isJudging, setIsJudging] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('Waiting for your masterpiece...');
  const [judgeError, setJudgeError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const getStrokeColor = useCallback((canvas) => {
    return getComputedStyle(canvas).getPropertyValue('--stroke-color').trim() || '#0f172a';
  }, []);

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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 11;
    ctx.strokeStyle = getStrokeColor(canvas);
  }, [getCanvasBackground, getDisplaySize, getStrokeColor]);

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
    window.clearTimeout(debounceTimer.current);
    judgeRequestRef.current += 1;
    prepareCanvas();
    hasInkRef.current = false;
    inkBoundsRef.current = getInitialInkBounds();
    inkDistanceRef.current = 0;
    strokeCountRef.current = 0;
    setAiFeedback(nextFeedback);
    setIsJudging(false);
  }, [prepareCanvas]);

  useEffect(() => () => window.clearTimeout(debounceTimer.current), []);

  useEffect(() => {
    if (score !== 3) return;

    window.clearTimeout(debounceTimer.current);
    judgeRequestRef.current += 1;
    setIsJudging(false);
    setIsGameActive(false);
    setIsComplete(true);
  }, [score]);

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
    const nextTarget = pickTargetWord(null);
    setTargetWord(nextTarget);
    targetStartedAtRef.current = Date.now();
    setStartTime(Date.now());
    setIsGameActive(true);
  };

  const handleDrawingSubmit = useCallback(() => {
    window.clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(() => {
      const canvas = canvasRef.current;

      if (!canvas || !hasInkRef.current || !isGameActive || !targetWord || isJudging) {
        return;
      }

      const requestId = judgeRequestRef.current + 1;
      judgeRequestRef.current = requestId;
      const base64Image = canvas.toDataURL('image/png');

      const submitDrawing = async () => {
        if (!supabase) {
          setJudgeError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
          return;
        }

        setIsJudging(true);
        setJudgeError('');

        try {
          const { data, error } = await supabase.functions.invoke('judge-drawing', {
            body: {
              base64Image,
              targetWord,
            },
          });

          if (requestId !== judgeRequestRef.current) return;
          if (error) throw error;

          const verdict = String(data || '').trim().toLowerCase();

          if (verdict === 'match') {
            setAiFeedback('Nailed it!');
          } else if (verdict === 'incomplete') {
            setAiFeedback('Looks incomplete, keep drawing...');
          } else {
            setAiFeedback("Nope, that's not it!");
          }

          if (verdict !== 'match') return;

          setScore((currentScore) => {
            const nextScore = currentScore + 1;
            clearCanvas('Nailed it!');

            if (nextScore < 3) {
              setTargetWord((currentTarget) => {
                const nextTarget = pickTargetWord(currentTarget);
                targetStartedAtRef.current = Date.now();
                return nextTarget;
              });
            }

            return nextScore;
          });
        } catch (error) {
          if (requestId !== judgeRequestRef.current) return;
          setJudgeError(error?.message || 'The judge could not read that drawing.');
        } finally {
          if (requestId === judgeRequestRef.current) {
            setIsJudging(false);
          }
        }
      };

      submitDrawing();
    }, 600);
  }, [clearCanvas, isGameActive, isJudging, targetWord]);

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

    ctx.strokeStyle = getStrokeColor(canvas);
    ctx.lineWidth = 11;
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
    handleDrawingSubmit();
  };

  return (
    <div className="mx-auto max-w-6xl px-2 py-10 text-foreground sm:px-4">
      <header className="mb-8 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">single player sprint</p>
        <h1 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Draw Off</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          Draw the prompt, lift your cursor, and race the AI to three correct guesses.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!isGameActive && !isComplete && (
          <motion.div
            key="start"
            className="mx-auto max-w-xl border border-border/70 bg-[color:var(--surface)] p-8 text-center shadow-[var(--shadow)]"
            style={{ borderRadius: 'var(--radius)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Sparkles className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-4 font-serif text-3xl font-medium">Ready to sprint?</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Get three target words past the sketch judge as fast as you can.
            </p>
            <motion.button
              type="button"
              onClick={startSprint}
              className="mt-6 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-bold text-[color:var(--surface)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              style={{ borderRadius: 'var(--radius)' }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="h-4 w-4" />
              Start Sprint
            </motion.button>
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
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">You got 3 out of 3. Very tidy chaos.</p>
            <motion.button
              type="button"
              onClick={startSprint}
              className="mt-6 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-bold text-[color:var(--surface)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
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
                <p className="mt-1 font-serif text-3xl font-medium">{score} / 3</p>
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

            <div className="mb-4 border border-border/70 bg-[color:var(--surface-strong)] p-4 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <p className="font-serif text-2xl font-medium">
                {isJudging ? 'AI is squinting at your drawing...' : aiFeedback}
              </p>
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

            <motion.button
              type="button"
              onClick={clearCanvas}
              className="w-full py-4 mt-4 text-lg font-bold bg-surface-strong text-foreground border-2 border-ring hover:opacity-80 rounded-xl transition-opacity"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Eraser className="h-5 w-5" />
                Clear Canvas
              </span>
            </motion.button>

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
