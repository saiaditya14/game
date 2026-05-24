import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, CheckCircle2, Eraser, Loader2, Play, Sparkles } from 'lucide-react';
import {
  env,
  pipeline,
} from '@xenova/transformers';

const DOODLE_WORDS = ["apple", "cat", "dog", "car", "tree", "bicycle", "book", "camera", "chair", "clock", "cup", "eye", "flower", "glasses", "hat", "house", "key", "pants", "pizza", "shoe", "smiley face", "star", "sun", "umbrella"];

const CLIP_MODEL = 'Xenova/clip-vit-base-patch32';
const ACCEPTANCE_MARGIN = 0.04;
const MIN_STROKE_DISTANCE = 90;
const MIN_DRAWING_SPREAD_RATIO = 0.12;
const DEFAULT_COMPLEXITY_GATE = {
  distance: MIN_STROKE_DISTANCE,
  spreadRatio: MIN_DRAWING_SPREAD_RATIO,
  strokes: 1,
  minSeconds: 0.35,
};
const COMPLEXITY_GATES = {
  bicycle: { distance: 260, spreadRatio: 0.24, strokes: 2, minSeconds: 1.1 },
  car: { distance: 180, spreadRatio: 0.2, strokes: 1, minSeconds: 0.8 },
  cat: { distance: 170, spreadRatio: 0.16, strokes: 2, minSeconds: 0.8 },
  dog: { distance: 170, spreadRatio: 0.16, strokes: 2, minSeconds: 0.8 },
  house: { distance: 190, spreadRatio: 0.2, strokes: 1, minSeconds: 0.8 },
  pizza: { distance: 150, spreadRatio: 0.15, strokes: 1, minSeconds: 0.7 },
  tree: { distance: 170, spreadRatio: 0.18, strokes: 1, minSeconds: 0.8 },
  umbrella: { distance: 180, spreadRatio: 0.18, strokes: 1, minSeconds: 0.8 },
};
const CLIP_PROMPT_MAP = {
  apple: ['a simple line drawing of an apple with a stem', 'a hand drawn apple fruit outline'],
  cat: ['a simple line drawing of a cat face with pointy ears and whiskers', 'a hand drawn cat with triangular ears and whiskers'],
  dog: ['a simple line drawing of a dog face with floppy ears and a snout', 'a hand drawn dog with a nose, muzzle, and ears'],
  car: ['a simple side view drawing of a car with wheels', 'a hand drawn car with two wheels'],
  tree: ['a simple line drawing of a tree with trunk and leafy top', 'a hand drawn tree with branches'],
  bicycle: ['a simple line drawing of a bicycle with two wheels', 'a hand drawn bike frame and wheels'],
  book: ['a simple line drawing of an open book with pages', 'a hand drawn closed book cover'],
  camera: ['a simple line drawing of a camera with lens', 'a hand drawn camera icon'],
  chair: ['a simple line drawing of a chair with legs and backrest', 'a hand drawn chair'],
  clock: ['a simple line drawing of a clock face with hands', 'a hand drawn analog clock'],
  cup: ['a simple line drawing of a cup with handle', 'a hand drawn mug'],
  eye: ['a simple line drawing of a single eye with iris', 'a hand drawn eye shape'],
  flower: ['a simple line drawing of a flower with petals and stem', 'a hand drawn flower bloom'],
  glasses: ['a simple line drawing of eyeglasses with two lenses', 'a hand drawn pair of glasses'],
  hat: ['a simple line drawing of a hat with brim', 'a hand drawn hat'],
  house: ['a simple line drawing of a house with roof, door, and window', 'a hand drawn house outline'],
  key: ['a simple line drawing of a key with teeth and round handle', 'a hand drawn key'],
  pants: ['a simple line drawing of pants with two legs', 'a hand drawn pair of trousers'],
  pizza: ['a simple line drawing of a triangular pizza slice with cheese and pepperoni', 'a hand drawn pizza slice, not a round face'],
  shoe: ['a simple side view drawing of a shoe with sole', 'a hand drawn sneaker'],
  'smiley face': ['a simple smiley face with two eyes and a curved mouth', 'a round face drawing with eyes and a smile'],
  star: ['a simple five pointed star drawing', 'a hand drawn star shape'],
  sun: ['a simple line drawing of the sun with rays', 'a hand drawn sun with rays around a circle'],
  umbrella: ['a simple line drawing of an umbrella with curved handle', 'a hand drawn umbrella canopy'],
};
const CLIP_LABELS = DOODLE_WORDS.flatMap((word) =>
  (CLIP_PROMPT_MAP[word] || [`a simple sketch of a ${word}`]).map((label) => ({ word, label })),
);
const TRANSFORMERS_CACHE = 'transformers-cache';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.useFS = false;
env.localModelPath = '/__lovelyland_no_local_models__/';

const normalizeGuess = (value = '') => value.toLowerCase().replaceAll('_', ' ').trim();
const formatConfidence = (confidence = 0) => `${Math.round(confidence * 100)}%`;
const formatBytes = (bytes = 0) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

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

const clearStaleModelCache = async () => {
  if (typeof caches === 'undefined') return;

  try {
    const cache = await caches.open(TRANSFORMERS_CACHE);
    const requests = await cache.keys();

    await Promise.all(
      requests.map(async (request) => {
        const url = new URL(request.url);
        const isOldLocalFallback = url.pathname.startsWith('/models/');
        const isFailedMobileClipAttempt = url.pathname.includes('/mobileclip_s1/');

        if (isOldLocalFallback || isFailedMobileClipAttempt) {
          await cache.delete(request);
          return;
        }

        const isClipJson =
          url.pathname.includes('/Xenova/clip-vit-base-patch32/') &&
          url.pathname.endsWith('.json');

        if (!isClipJson) return;

        const response = await cache.match(request);
        const contentType = response?.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          await cache.delete(request);
        }
      }),
    );
  } catch (error) {
    console.warn('Could not clean stale Transformers cache entries:', error);
  }
};

const DrawOffSingle = () => {
  const canvasRef = useRef(null);
  const classifierRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const inkBoundsRef = useRef(getInitialInkBounds());
  const inkDistanceRef = useRef(0);
  const strokeCountRef = useRef(0);
  const targetStartedAtRef = useRef(0);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const hasAutoClearedOnVisitRef = useRef(false);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [targetWord, setTargetWord] = useState(null);
  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [modelError, setModelError] = useState('');
  const [modelStatus, setModelStatus] = useState('Preparing local vision model...');
  const [modelDetail, setModelDetail] = useState('');
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

  const getCanvasDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
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
    let isMounted = true;

    const loadModel = async () => {
      try {
        const getProgressOptions = (label) => ({
          progress_callback: (event) => {
            if (!isMounted) return;
            console.debug('Draw Off model load:', event);

            if (event.status === 'initiate') {
              setModelStatus(`Starting ${label}...`);
              setModelDetail(event.file || '');
            }

            if (event.status === 'download' && event.file) {
              setModelStatus(`Downloading ${event.file}`);
              setModelDetail('Connecting to Hugging Face...');
            }

            if (event.status === 'progress' && event.file) {
              setModelStatus(`Downloading ${event.file} (${Math.round(event.progress || 0)}%)`);
              const loaded = formatBytes(event.loaded);
              const total = formatBytes(event.total);
              setModelDetail(total ? `${loaded} of ${total}` : `${loaded} downloaded`);
            }

            if (event.status === 'done' && event.file) {
              setModelStatus(`Finished ${event.file}`);
              setModelDetail('Preparing next model file...');
            }
          },
        });

        await clearStaleModelCache();

        classifierRef.current = await pipeline(
          'zero-shot-image-classification',
          CLIP_MODEL,
          {
            quantized: true,
            ...getProgressOptions('CLIP model'),
          },
        );

        if (!isMounted) return;
        setModelStatus('AI brain ready');
        setModelDetail('');
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Draw Off model load failed:', error);
        if (!isMounted) return;
        setModelError(`The AI model could not load: ${error?.message || 'unknown error'}`);
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const getInkStats = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const bounds = inkBoundsRef.current;
    if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) return null;

    const spread = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

    return {
      distance: inkDistanceRef.current,
      spread,
      baseSize: Math.min(canvas.width, canvas.height),
      strokes: strokeCountRef.current,
      secondsOnTarget: targetStartedAtRef.current ? (Date.now() - targetStartedAtRef.current) / 1000 : 0,
    };
  }, []);

  const hasEnoughInk = useCallback((word) => {
    const stats = getInkStats();
    if (!stats) return false;

    const gate = {
      ...DEFAULT_COMPLEXITY_GATE,
      ...(COMPLEXITY_GATES[normalizeGuess(word)] || {}),
    };
    const minSpread = stats.baseSize * gate.spreadRatio;

    return (
      stats.distance >= gate.distance &&
      stats.spread >= minSpread &&
      stats.strokes >= gate.strokes &&
      stats.secondsOnTarget >= gate.minSeconds
    );
  }, [getInkStats]);

  const getInkHint = useCallback((word) => {
    const stats = getInkStats();
    if (!stats) return 'Give the AI a little more to work with before it can count.';

    const gate = {
      ...DEFAULT_COMPLEXITY_GATE,
      ...(COMPLEXITY_GATES[normalizeGuess(word)] || {}),
    };
    const minSpread = stats.baseSize * gate.spreadRatio;

    if (stats.secondsOnTarget < gate.minSeconds) return 'Give the drawing one more beat before the AI can count it.';
    if (stats.strokes < gate.strokes) return 'Add a little more structure before the AI can count it.';
    if (stats.distance < gate.distance || stats.spread < minSpread) return 'Draw a bit more of the shape before the AI can count it.';
    return 'Give the AI a little more to work with before it can count.';
  }, [getInkStats]);

  const clearCanvas = useCallback(() => {
    prepareCanvas();
    hasInkRef.current = false;
    inkBoundsRef.current = getInitialInkBounds();
    inkDistanceRef.current = 0;
    strokeCountRef.current = 0;
    setGuesses([]);
    setIsClassifying(false);
  }, [prepareCanvas]);

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
    setGuesses([]);
    setModelError('');
    setIsComplete(false);
    const nextTarget = pickTargetWord(null);
    setTargetWord(nextTarget);
    targetStartedAtRef.current = Date.now();
    setStartTime(Date.now());
    setIsGameActive(true);
  };

  const classifyDrawing = useCallback(async () => {
    const classifier = classifierRef.current;
    const imageDataUrl = getCanvasDataUrl();

    if (!classifier || !imageDataUrl || !isModelLoaded || !hasInkRef.current || !isGameActive) return;

    if (!hasEnoughInk(targetWord)) {
      setGuesses([]);
      setModelError(getInkHint(targetWord));
      return;
    }

    setIsClassifying(true);

    try {
      const rawResults = await classifier(
        imageDataUrl,
        CLIP_LABELS.map(({ label }) => label),
      );
      const guessMap = new Map();

      rawResults.forEach((result) => {
          const match = CLIP_LABELS.find(({ label }) => label === result.label);
        const word = match?.word || result.label;
        const existing = guessMap.get(word);

        if (!existing || result.score > existing.score) {
          guessMap.set(word, {
            label: word,
            score: result.score,
          });
        }
      });

      const results = [...guessMap.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setModelError('');
      setGuesses(results);

      const topGuess = normalizeGuess(results[0]?.label);
      const guessMargin = (results[0]?.score || 0) - (results[1]?.score || 0);
      if (topGuess !== normalizeGuess(targetWord) || guessMargin < ACCEPTANCE_MARGIN) return;

      setScore((currentScore) => {
        const nextScore = currentScore + 1;
        clearCanvas();

        if (nextScore >= 3) {
          setIsGameActive(false);
          setIsComplete(true);
          return 3;
        }

        setTargetWord((currentTarget) => {
          const nextTarget = pickTargetWord(currentTarget);
          targetStartedAtRef.current = Date.now();
          return nextTarget;
        });
        return nextScore;
      });
    } catch {
      setModelError('The AI had trouble reading that drawing. Clear and try again.');
    } finally {
      setIsClassifying(false);
    }
  }, [clearCanvas, getCanvasDataUrl, getInkHint, hasEnoughInk, isGameActive, isModelLoaded, targetWord]);

  const startDrawing = (event) => {
    if (!isGameActive || !isModelLoaded) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!hasInkRef.current) ensureCanvasReady();
    canvas.setPointerCapture?.(event.pointerId);

    isDrawingRef.current = true;
    strokeCountRef.current += 1;
    lastPointRef.current = getCanvasPoint(event);
  };

  const draw = (event) => {
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
    if (!isDrawingRef.current) return;
    event.preventDefault();

    canvasRef.current?.releasePointerCapture?.(event.pointerId);
    isDrawingRef.current = false;
    classifyDrawing();
  };

  if (!isModelLoaded) {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl place-items-center px-4 py-12 text-center text-foreground">
        <motion.div
          className="border border-border/70 bg-[color:var(--surface)] p-8 shadow-[var(--shadow)]"
          style={{ borderRadius: 'var(--radius)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-[color:var(--surface)]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            {modelError ? <Brain className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
          </motion.div>
          <h1 className="mt-5 font-serif text-4xl font-medium">Loading AI Brain...</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--muted)]">
            {modelError || modelStatus}
          </p>
          {!modelError && modelDetail && (
            <p className="mt-1 text-xs font-semibold text-[color:var(--muted)]">{modelDetail}</p>
          )}
          {!modelError && (
            <div className="mt-5 h-2 w-full overflow-hidden bg-[color:var(--surface-strong)]" style={{ borderRadius: '999px' }}>
              <motion.div
                className="h-full w-1/3 bg-primary"
                animate={{ x: ['-120%', '320%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}
          {!modelError && <p className="mt-2 text-xs font-semibold text-[color:var(--muted)]">First load can take a while. Later loads use the browser cache.</p>}
        </motion.div>
      </div>
    );
  }

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
              Get three target words recognized by the local vision model as fast as you can.
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
              Run It Back
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
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">target word</p>
                <p className="mt-1 font-serif text-3xl font-medium capitalize">{targetWord}</p>
              </div>
              <div className="border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">score</p>
                <p className="mt-1 font-serif text-3xl font-medium">{score} / 3</p>
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
                  className="h-full w-full cursor-crosshair touch-none"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
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

            <div className="mt-5 border border-border/70 bg-[color:var(--surface-strong)] p-4" style={{ borderRadius: 'var(--radius)' }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-medium">AI Guesses</h2>
                {isClassifying && (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking
                  </span>
                )}
              </div>

              {modelError && <p className="mb-3 text-sm text-[color:var(--muted)]">{modelError}</p>}

              <div className="grid gap-3 md:grid-cols-3">
                {guesses.length > 0 ? (
                  guesses.map((guess, index) => (
                    <motion.div
                      key={`${guess.label}-${index}`}
                      className="border border-border/70 bg-[color:var(--surface)] p-3"
                      style={{ borderRadius: 'var(--radius)' }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">guess {index + 1}</p>
                      <p className="mt-1 font-medium capitalize">{normalizeGuess(guess.label)}</p>
                      <p className="text-sm text-[color:var(--muted)]">{formatConfidence(guess.score)}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-[color:var(--muted)] md:col-span-3">Draw the target, then lift your cursor or finger to get guesses.</p>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrawOffSingle;
