import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Eraser, Loader2, Sparkles } from 'lucide-react';

const ML5_SCRIPT_ID = 'ml5-browser-bundle';
const ML5_SRC = 'https://unpkg.com/ml5@0.12.2/dist/ml5.min.js';

const loadMl5 = () => {
  if (window.ml5) {
    return Promise.resolve(window.ml5);
  }

  const existingScript = document.getElementById(ML5_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.ml5), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = ML5_SCRIPT_ID;
    script.src = ML5_SRC;
    script.async = true;
    script.onload = () => resolve(window.ml5);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const formatConfidence = (confidence = 0) => `${Math.round(confidence * 100)}%`;

const DrawOff = () => {
  const canvasRef = useRef(null);
  const classifierRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const [isModelReady, setIsModelReady] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [modelError, setModelError] = useState('');
  const [guesses, setGuesses] = useState([]);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = 720;
    const height = 460;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 13;
    ctx.strokeStyle = '#1f2937';
  }, []);

  useEffect(() => {
    let isMounted = true;

    prepareCanvas();

    loadMl5()
      .then((ml5) => {
        if (!isMounted) return;

        classifierRef.current = ml5.imageClassifier('DoodleNet', () => {
          if (!isMounted) return;
          setIsModelReady(true);
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setModelError('The AI model could not load. Check your connection and refresh.');
      });

    return () => {
      isMounted = false;
    };
  }, [prepareCanvas]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;

    return {
      x: ((source.clientX - rect.left) / rect.width) * 720,
      y: ((source.clientY - rect.top) / rect.height) * 460,
    };
  };

  const classifyDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    const classifier = classifierRef.current;

    if (!canvas || !classifier || !isModelReady || !hasInkRef.current) return;

    setIsClassifying(true);
    classifier.classify(canvas, (error, results = []) => {
      setIsClassifying(false);

      if (error) {
        setModelError('The AI had trouble reading that drawing. Try clearing and drawing again.');
        return;
      }

      setModelError('');
      setGuesses(results.slice(0, 3));
    });
  }, [isModelReady]);

  const startDrawing = (event) => {
    if (!isModelReady) return;
    event.preventDefault();

    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasPoint(event);
    const lastPoint = lastPointRef.current;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
    hasInkRef.current = true;
  };

  const stopDrawing = (event) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();

    isDrawingRef.current = false;
    classifyDrawing();
  };

  const clearCanvas = () => {
    prepareCanvas();
    hasInkRef.current = false;
    setGuesses([]);
    setModelError('');
    setIsClassifying(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-foreground">
      <header className="mb-8 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">plum game</p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-foreground sm:text-5xl">Draw Off</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          Sketch a doodle, lift your pen, and let the local AI guess what you made.
        </p>
      </header>

      <div
        className="relative overflow-hidden border bg-[color:var(--surface-strong)] p-3"
        style={{ borderColor: 'var(--ring)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
      >
        <div className="relative h-[26rem] overflow-hidden border border-border/70 bg-[color:var(--surface)]" style={{ borderRadius: 'var(--radius)' }}>
          <canvas
            ref={canvasRef}
            aria-label="Draw Off drawing canvas"
            className="h-full w-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />

          <AnimatePresence>
            {!isModelReady && (
              <motion.div
                className="absolute inset-0 z-10 grid place-items-center bg-[color:var(--surface)]/95 p-6 text-center backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="max-w-sm">
                  <motion.div
                    className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-[color:var(--surface)]"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  >
                    {modelError ? <Brain className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
                  </motion.div>
                  <h2 className="mt-5 text-2xl font-semibold text-foreground">
                    {modelError ? 'AI Brain Paused' : 'Loading AI Brain...'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {modelError || 'DoodleNet is warming up locally in your browser.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="border border-border/70 bg-[color:var(--surface)] p-5" style={{ borderRadius: 'var(--radius)' }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-medium">AI Guesses</h2>
            {isClassifying && (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {guesses.length > 0 ? (
                guesses.map((guess, index) => (
                  <motion.div
                    key={`${guess.label}-${index}`}
                    className="flex items-center justify-between gap-4 border border-border/60 bg-[color:var(--surface-strong)] px-4 py-3"
                    style={{ borderRadius: 'var(--radius)' }}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-[color:var(--surface)]">
                        {index + 1}
                      </span>
                      <span className="font-medium capitalize">{guess.label.replaceAll('_', ' ')}</span>
                    </span>
                    <span className="text-sm font-semibold text-[color:var(--muted)]">{formatConfidence(guess.confidence)}</span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="flex items-center gap-3 border border-dashed border-border/80 bg-[color:var(--surface-strong)] px-4 py-5 text-[color:var(--muted)]"
                  style={{ borderRadius: 'var(--radius)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  Draw something and lift your cursor to get three guesses.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-bold text-[color:var(--surface)] shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] lg:w-auto"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Eraser className="h-4 w-4" />
              Clear Canvas
            </button>
          </motion.div>
          <p className="max-w-xs text-xs leading-5 text-[color:var(--muted)]">
            Your drawings are processed locally on your device and are never uploaded.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrawOff;
