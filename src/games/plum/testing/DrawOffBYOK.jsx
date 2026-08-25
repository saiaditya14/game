import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eraser, Loader2, Play, Send, Sparkles, KeyRound, X } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';

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

const buildResult = (value, targetWord, gameWords) => {
  const verdict = value.trim().toLowerCase();
  const jsonMatch = value.match(/\{[\s\S]*\}/);
  let parsed = null;

  try {
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(value);
  } catch (_error) {
    parsed = null;
  }

  const lineVerdict = value.match(/verdict\s*:\s*([^\n\r]+)/i)?.[1];
  const lineGuess = value.match(/guess\s*:\s*([^\n\r]+)/i)?.[1];
  const lineReason = value.match(/reason\s*:\s*([\s\S]+)/i)?.[1];

  const rawGuess = parsed?.guess
    ? String(parsed.guess).toLowerCase().trim()
    : lineGuess
      ? lineGuess.toLowerCase().trim()
      : verdict;
  const clean = rawGuess.replace(/^["']|["']$/g, '').trim();
  const rawReason = parsed?.reason
    ? String(parsed.reason).trim()
    : lineReason
      ? lineReason.trim()
      : '';
  const genericReasonPattern = /does not clearly match a valid game class|no valid class|not clearly match/i;
  const reason = rawReason && !genericReasonPattern.test(rawReason)
    ? rawReason
    : `Raw Gemini response: ${value}`;
  const rawVerdict = parsed?.verdict
    ? String(parsed.verdict).toLowerCase().trim()
    : lineVerdict
      ? lineVerdict.toLowerCase().trim()
      : '';

  if (rawVerdict === 'match') {
    return { verdict: 'match', guess: targetWord, reason, raw: value };
  }

  if (clean === 'incomplete') {
    return { verdict: 'incomplete', guess: 'incomplete', reason, raw: value };
  }

  const matchingClass = gameWords.find((word) => clean === word.toLowerCase());
  if (matchingClass) {
    return {
      verdict: rawVerdict === 'match' || matchingClass === targetWord ? 'match' : 'wrong',
      guess: matchingClass,
      reason,
      raw: value,
    };
  }

  if (clean.includes('incomplete')) {
    return { verdict: 'incomplete', guess: 'incomplete', reason, raw: value };
  }

  const mentionedClass = gameWords.find((word) => clean.includes(word.toLowerCase()));
  if (mentionedClass) {
    return {
      verdict: rawVerdict === 'match' || mentionedClass === targetWord ? 'match' : 'wrong',
      guess: mentionedClass,
      reason,
      raw: value,
    };
  }

  return {
    verdict: rawVerdict === 'incomplete' ? 'incomplete' : 'wrong',
    guess: clean === 'unknown' ? 'unknown' : 'unknown',
    reason,
    raw: value,
  };
};

const getInitialInkBounds = () => ({
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
});

// Tailwind's preflight reset is not active in this project, so `box-sizing` is
// content-box everywhere, and the spacing scale generates no CSS at all. Any box
// combining padding with a size constraint needs border-box + real values.
const BYOK_BORDER_BOX = { boxSizing: 'border-box' };

const BYOK_PANEL = {
  ...BYOK_BORDER_BOX,
  border: '1px solid var(--divider)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface-strong)',
};

const byokTileLabelStyle = {
  fontSize: '0.6rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: 'var(--primary)',
};

// Brush presets, thinnest first - matches the single-player tray.
const BYOK_BRUSH_SIZES = [
  { size: 1, label: 'Hairline' },
  { size: 3, label: 'Fine' },
  { size: 5, label: 'Medium' },
  { size: 9, label: 'Bold' },
  { size: 16, label: 'Marker' },
];

const byokActionClass =
  'inline-flex items-center justify-center font-extrabold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-55';

const byokPrimaryActionStyle = {
  ...BYOK_BORDER_BOX,
  width: '100%',
  minHeight: '3.25rem',
  gap: '0.55rem',
  paddingInline: '1.25rem',
  paddingBlock: '0.8rem',
  fontSize: 'clamp(0.85rem, 0.8rem + 0.2vw, 1rem)',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: 'var(--primary)',
  borderRadius: 'var(--radius)',
  background: 'var(--primary)',
  color: 'var(--surface)',
};

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

const DrawOffBYOK = () => {
  const canvasRef = useRef(null);
  const resizeObserverRef = useRef(null);
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

  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('drawOffGeminiKey') || '');
  const [keyInput, setKeyInput] = useState(userApiKey);
  
  const [targetWord, setTargetWord] = useState(null);
  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isJudging, setIsJudging] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('Waiting for your masterpiece...');
  const [judgeError, setJudgeError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [targetScore] = useState(3);
  const [difficulty, setDifficulty] = useState('easy');
  
  const { theme } = useTheme();
  const defaultColor = theme === 'theme-arcade' ? '#39ff14' : '#0f172a';
  const [brushColor, setBrushColor] = useState(defaultColor);
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    setBrushColor(theme === 'theme-arcade' ? '#39ff14' : '#0f172a');
  }, [theme]);

  // Key operations
  const saveKey = () => {
    const trimmed = keyInput.trim();
    localStorage.setItem('drawOffGeminiKey', trimmed);
    setUserApiKey(trimmed);
  };

  const clearKey = () => {
    localStorage.removeItem('drawOffGeminiKey');
    setUserApiKey('');
    setKeyInput('');
  };

  const getCanvasBackground = useCallback((canvas) => {
    return getComputedStyle(canvas).getPropertyValue('--canvas-bg').trim() || '#ffffff';
  }, []);

  const getDisplaySize = useCallback((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || canvas.offsetWidth || 720)),
      height: Math.max(1, Math.round(rect.height || canvas.offsetHeight || 460)),
    };
  }, []);

  // Backing store is sized in device pixels so strokes stay crisp on HiDPI
  // screens; capped at 2 so a 3x phone doesn't quadruple the judge payload.
  const getBackingSize = useCallback((canvas) => {
    const { width, height } = getDisplaySize(canvas);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    return { width, height, ratio, backingWidth: Math.round(width * ratio), backingHeight: Math.round(height * ratio) };
  }, [getDisplaySize]);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height, ratio, backingWidth, backingHeight } = getBackingSize(canvas);

    canvas.width = backingWidth;
    canvas.height = backingHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Scale the context by the same ratio so every drawing handler below keeps
    // working in CSS pixels and pointer coordinates land under the cursor.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = getCanvasBackground(canvas);
    ctx.fillRect(0, 0, width, height);

    // We intentionally don't set strokeStyle/lineWidth here
    // because `draw()` sets them dynamically every stroke using brushColor/brushSize.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [getBackingSize, getCanvasBackground]);

  const ensureCanvasReady = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { backingWidth, backingHeight } = getBackingSize(canvas);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      prepareCanvas();
    }
  }, [getBackingSize, prepareCanvas]);

  // The canvas lives inside an AnimatePresence branch, so it is NOT in the DOM
  // when the isGameActive effect fires - the outgoing screen is still animating
  // out. Initialising from an effect therefore hit a null ref and silently left
  // the backing store at the browser default of 300x150, which is why strokes
  // rendered stretched and offset from the cursor. Attaching via a ref callback
  // instead guarantees setup runs exactly when the element mounts.
  const attachCanvas = useCallback((node) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    canvasRef.current = node;
    if (!node) return;

    prepareCanvas();

    // Observe the canvas box rather than the window: its height is derived from
    // the viewport, so it can change without a window resize event.
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      // Never wipe work in progress; only resize while the canvas is still empty.
      if (!hasInkRef.current) {
        prepareCanvas();
      }
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, [prepareCanvas]);

  useEffect(() => {
    if (!isGameActive || !startTime) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isGameActive, startTime]);

  // Resizing is handled by the ResizeObserver wired up in attachCanvas above.

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

      if (!userApiKey) {
        setJudgeError('Missing API key. Please enter your Gemini API key above.');
        return;
      }

      const requestId = judgeRequestRef.current + 1;
      judgeRequestRef.current = requestId;
      const base64Image = getCanvasBase64Image(canvas);

      const submitDrawing = async () => {
        setIsJudging(true);
        setJudgeError('');

        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`;
          
          const systemPrompt =
            'You are a strict visual classifier for a Pictionary game. ' +
            'The drawings are crude sketches (often using various colors and line thicknesses) on a solid white background. ' +
            'Return exactly three plain text lines and nothing else. ' +
            'Do not use JSON. Do not use markdown. Do not add a preface. ' +
            'Line 1 must be VERDICT: match OR incomplete OR wrong. ' +
            'Line 2 must be GUESS: one valid game class OR incomplete OR unknown. ' +
            'Line 3 must be REASON: a specific visual explanation.';
            
          const activeHints = difficulty === 'hard' ? HARD_CLASS_HINTS : EASY_CLASS_HINTS;
          const userPrompt =
            `Target word: "${targetWord}"\n` +
            `Valid game classes: ${Object.keys(activeHints).join(', ')}\n\n` +
            `Instructions:\n` +
            `1. Analyze the sketch. Identify what it most looks like from the valid game classes.\n` +
            `2. Set "guess" to that valid game class (or "unknown" if it matches none).\n` +
            `3. Evaluate the "verdict" using these strict rules:\n` +
            `   - IF the sketch clearly resembles the Target word, verdict must be "match".\n` +
            `   - IF the sketch is a blank canvas, a single line, or chaotic scribbles, verdict must be "incomplete".\n` +
            `   - IF the sketch is a recognizable object but does NOT match the Target word, verdict must be "wrong".\n` +
            `4. Set "reason" to a detailed debugging explanation in 2-4 sentences. ` +
            `It must explicitly say: what visual elements you see, why those elements do or do not satisfy the Target word, ` +
            `and why you chose the guess. Do not use vague phrases like "does not clearly match a valid game class" without specifics.\n\n` +
            `Output format example:\n` +
            `VERDICT: match\n` +
            `GUESS: sun\n` +
            `REASON: I see a central circle with multiple rays radiating outward. That is the standard icon for a sun, so it satisfies the target.`;

          const payload = {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  { text: userPrompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 220,
            },
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Invalid API Key or API Error (${response.status})`);
          }

          if (requestId !== judgeRequestRef.current) return;

          const data = await response.json();
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!rawText) throw new Error("No text response from Gemini");

          const result = buildResult(rawText, targetWord, Object.keys(activeHints));
          
          const rawVerdict = String(result.verdict).trim().toLowerCase();
          const guess = String(result.guess).trim().toLowerCase();
          const reason = String(result.reason || '').trim();

          let finalVerdict;
          if (rawVerdict === 'match' || targetWord === guess) {
              finalVerdict = 'match';
          } else if (rawVerdict === 'incomplete' || guess === 'incomplete') {
              finalVerdict = 'incomplete';
          } else {
              finalVerdict = 'wrong';
          }

          if (finalVerdict === 'match') {
            setAiFeedback(reason ? `Nailed it! ${reason}` : 'Nailed it!');
          } else if (finalVerdict === 'incomplete') {
            setAiFeedback(`Incomplete! Reason: ${reason || 'No reason returned.'}`);
          } else {
            setAiFeedback(`Nope! AI guessed: ${guess || 'wrong'}. Reason: ${reason || 'No reason returned.'}`);
          }

          if (finalVerdict !== 'match') return;

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
          if (error.message.includes('Invalid API Key')) {
            setAiFeedback('Invalid API Key.');
          } else {
            setAiFeedback('Network/API Error: Check console.');
          }
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
  }, [clearCanvas, isGameActive, isJudging, targetWord, userApiKey, targetScore, difficulty]);

  const startDrawing = (event) => {
    if (isJudging) return;
    if (!isGameActive || !userApiKey) return;
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
    if (!isDrawingRef.current || !userApiKey) return;
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
    <div
      style={{
        ...BYOK_BORDER_BOX,
        marginInline: 'auto',
        width: '100%',
        maxWidth: 'min(72rem, 100%)',
        paddingInline: 'clamp(1rem, 3vw, 2rem)',
        paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
        color: 'var(--foreground)',
      }}
    >
      {/* The full header is for the lobby. During play it collapses to a single
          compact line so the drawing stage and its controls fit one screen. */}
      <header
        style={{
          textAlign: 'center',
          marginBottom: isGameActive ? '0.85rem' : 'clamp(1.25rem, 3vh, 2rem)',
        }}
      >
        <p
          className="font-bold uppercase"
          style={{ fontSize: '0.62rem', letterSpacing: '0.24em', color: 'var(--primary)' }}
        >
          byok testing mode
        </p>
        <h1
          className="font-serif font-bold"
          style={{
            marginTop: isGameActive ? '0.15rem' : '0.5rem',
            fontSize: isGameActive ? 'clamp(1.1rem, 1rem + 0.5vw, 1.4rem)' : 'clamp(2rem, 1.5rem + 2vw, 3rem)',
            lineHeight: 1.15,
            color: 'var(--foreground)',
          }}
        >
          Draw Off
        </h1>
        {!isGameActive && (
          <p
            style={{
              marginTop: '0.6rem',
              marginInline: 'auto',
              maxWidth: '38rem',
              fontSize: 'clamp(0.82rem, 0.78rem + 0.2vw, 0.98rem)',
              lineHeight: 1.6,
              color: 'var(--muted)',
            }}
          >
            Bring Your Own Key: draw the prompt, submit when it is ready, and race the AI to three
            correct guesses using your own Gemini key.
          </p>
        )}
      </header>

      {/* API key - hidden during play so it does not compete with the canvas */}
      {!isGameActive && (
        <div
          style={{
            ...BYOK_PANEL,
            marginInline: 'auto',
            width: '100%',
            maxWidth: '32rem',
            marginBottom: 'clamp(1rem, 3vh, 1.5rem)',
            padding: 'clamp(1rem, 3vw, 1.4rem)',
          }}
        >
          <label
            className="font-bold uppercase"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.8rem',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              color: 'var(--muted)',
            }}
            htmlFor="byokKey"
          >
            <KeyRound className="h-4 w-4" /> Gemini API Key
          </label>

          {userApiKey ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <span
                className="font-bold"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)' }}
              >
                <CheckCircle2 className="h-4 w-4" /> Key saved
              </span>
              <motion.button
                onClick={clearKey}
                className="font-bold uppercase transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                style={{
                  ...BYOK_BORDER_BOX,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  paddingInline: '0.8rem',
                  paddingBlock: '0.5rem',
                  fontSize: '0.6rem',
                  letterSpacing: '0.14em',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'transparent',
                  color: 'var(--muted)',
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <X className="h-3.5 w-3.5" /> Clear
              </motion.button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
                gap: '0.6rem',
              }}
            >
              <input
                id="byokKey"
                type="password"
                placeholder="Enter Gemini API key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="outline-none transition placeholder:text-[color:var(--muted)] focus:ring-2 focus:ring-[color:var(--ring)]"
                style={{
                  ...BYOK_BORDER_BOX,
                  gridColumn: '1 / -1',
                  minHeight: '2.85rem',
                  paddingInline: '0.9rem',
                  fontSize: '0.88rem',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                }}
              />
              <motion.button
                onClick={saveKey}
                disabled={!keyInput.trim()}
                className="font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  ...BYOK_BORDER_BOX,
                  gridColumn: '1 / -1',
                  minHeight: '2.85rem',
                  paddingInline: '1.25rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--primary)',
                  color: 'var(--surface)',
                }}
                whileHover={keyInput.trim() ? { y: -2 } : undefined}
                whileTap={keyInput.trim() ? { scale: 0.98 } : undefined}
              >
                Save key
              </motion.button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isGameActive && !isComplete && (
          <motion.div
            key="start"
            style={{ marginInline: 'auto', width: '100%', maxWidth: '32rem' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                ...BYOK_BORDER_BOX,
                padding: 'clamp(1.75rem, 4vw, 2.5rem)',
                textAlign: 'center',
                border: '1px solid var(--ring)',
                borderRadius: 'var(--radius) var(--radius) 0 0',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  ...BYOK_BORDER_BOX,
                  display: 'grid',
                  placeItems: 'center',
                  width: '3.5rem',
                  height: '3.5rem',
                  marginInline: 'auto',
                  marginBottom: '1.1rem',
                  border: '1px solid var(--primary)',
                  borderRadius: 'calc(var(--radius) + 0.35rem)',
                  background: 'var(--surface-strong)',
                  color: 'var(--primary)',
                }}
              >
                <Sparkles className="h-6 w-6" />
              </div>

              <h2
                className="font-serif font-bold"
                style={{ fontSize: 'clamp(1.4rem, 1.2rem + 0.7vw, 1.9rem)', lineHeight: 1.2, color: 'var(--foreground)' }}
              >
                Ready to sprint?
              </h2>

              <p
                style={{
                  marginTop: '0.7rem',
                  marginBottom: '1.6rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--muted)',
                }}
              >
                Get {targetScore} target words past the sketch judge as fast as you can.
              </p>

              <motion.button
                type="button"
                onClick={startSprint}
                className={byokActionClass}
                style={{ ...byokPrimaryActionStyle, marginInline: 'auto', maxWidth: '16rem' }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="h-4 w-4" />
                Start Sprint
              </motion.button>
            </div>

            <div
              style={{
                ...BYOK_BORDER_BOX,
                padding: 'clamp(1.1rem, 3vw, 1.5rem)',
                border: '1px solid var(--divider)',
                borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
                background: 'var(--surface-strong)',
              }}
            >
              <p
                className="font-bold uppercase"
                style={{
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  color: 'var(--muted)',
                }}
              >
                difficulty
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { id: 'easy', label: 'Easy Mode' },
                  { id: 'hard', label: 'Hard Mode' },
                ].map((option) => {
                  const active = difficulty === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() => setDifficulty(option.id)}
                      className="font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                      style={{
                        ...BYOK_BORDER_BOX,
                        paddingBlock: '0.7rem',
                        paddingInline: '0.75rem',
                        fontSize: '0.82rem',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderRadius: 'var(--radius)',
                        borderColor: active ? 'var(--primary)' : 'var(--divider)',
                        background: active ? 'var(--primary)' : 'var(--surface)',
                        color: active ? 'var(--surface)' : 'var(--muted)',
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {option.label}
                    </motion.button>
                  );
                })}
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
            style={{
              ...BYOK_BORDER_BOX,
              position: 'relative',
              marginInline: 'auto',
              width: '100%',
              padding: 'clamp(0.85rem, 2vw, 1.35rem)',
              border: '1px solid var(--ring)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
              <div style={{ ...BYOK_PANEL, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
                <p style={byokTileLabelStyle}>target word</p>
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
                  {targetWord}
                </p>
              </div>

              <div style={{ ...BYOK_PANEL, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
                <p style={byokTileLabelStyle}>score</p>
                <p
                  className="font-serif font-medium"
                  style={{
                    marginTop: '0.3rem',
                    fontSize: 'clamp(1.15rem, 1rem + 0.6vw, 1.6rem)',
                    lineHeight: 1.2,
                    color: 'var(--foreground)',
                  }}
                >
                  {score} / {targetScore}
                </p>
              </div>

              <div style={{ ...BYOK_PANEL, padding: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <p style={byokTileLabelStyle}>judge</p>
                  {isJudging && <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--primary)' }} />}
                </div>
                <p
                  style={{
                    marginTop: '0.3rem',
                    fontSize: 'clamp(0.85rem, 0.8rem + 0.3vw, 1.05rem)',
                    lineHeight: 1.45,
                    color: 'var(--foreground)',
                  }}
                >
                  {isJudging ? 'AI is squinting at your drawing...' : aiFeedback}
                </p>
              </div>
            </div>

            {/* Drawing stage - height tracks the viewport so a big screen gets a big canvas,
                capped so a wide-but-short window can't push the toolbar off-screen. */}
            <div style={{ ...BYOK_PANEL, position: 'relative', padding: 'clamp(0.4rem, 1vw, 0.75rem)' }}>
              {!userApiKey && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 'var(--radius)',
                    background: 'color-mix(in srgb, var(--surface) 82%, transparent)',
                  }}
                >
                  <div
                    className="font-bold"
                    style={{
                      ...BYOK_PANEL,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      paddingInline: '1.1rem',
                      paddingBlock: '0.75rem',
                      fontSize: '0.85rem',
                      color: 'var(--primary)',
                    }}
                  >
                    <KeyRound className="h-4 w-4" /> Enter your API key above to draw
                  </div>
                </div>
              )}

              <div
                style={{
                  ...BYOK_BORDER_BOX,
                  position: 'relative',
                  overflow: 'hidden',
                  height: 'clamp(16rem, calc(100vh - 38.5rem), 34rem)',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                }}
              >
                <canvas
                  ref={attachCanvas}
                  aria-label="Draw Off sprint canvas"
                  className={`h-full w-full touch-none transition-opacity ${isJudging ? 'cursor-wait opacity-45' : 'cursor-crosshair opacity-100'}`}
                  style={{ display: 'block' }}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
                {isJudging && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'color-mix(in srgb, var(--surface) 72%, transparent)',
                    }}
                  >
                    <div
                      className="font-bold"
                      style={{
                        ...BYOK_PANEL,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        paddingInline: '1.1rem',
                        paddingBlock: '0.75rem',
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                      }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is squinting at your drawing...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Brush tray */}
            <div
              style={{
                ...BYOK_PANEL,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'clamp(0.75rem, 2vw, 1.5rem)',
                marginTop: 'clamp(0.85rem, 2vw, 1.25rem)',
                padding: 'clamp(0.75rem, 1.8vw, 1.1rem)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <label
                  className="font-bold uppercase"
                  style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--muted)' }}
                  htmlFor="brushColor"
                >
                  Ink
                </label>
                <div
                  style={{
                    ...BYOK_BORDER_BOX,
                    position: 'relative',
                    width: '2rem',
                    height: '2rem',
                    overflow: 'hidden',
                    borderRadius: '999px',
                    border: '2px solid var(--ring)',
                  }}
                >
                  <input
                    id="brushColor"
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="cursor-pointer"
                    style={{ position: 'absolute', inset: '-0.5rem', width: '3rem', height: '3rem', border: 0, background: 'transparent', padding: 0 }}
                  />
                </div>
              </div>

              <div aria-hidden="true" style={{ width: '1px', alignSelf: 'stretch', background: 'var(--divider)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span
                  className="font-bold uppercase"
                  style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--muted)' }}
                >
                  Brush
                </span>
                <div role="group" aria-label="Brush size" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {BYOK_BRUSH_SIZES.map((brush) => {
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
                          ...BYOK_BORDER_BOX,
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
                  {BYOK_BRUSH_SIZES.find((b) => b.size === brushSize)?.label ?? `${brushSize}px`}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginTop: 'clamp(0.85rem, 2vw, 1.25rem)',
              }}
            >
              <motion.button
                type="button"
                onClick={() => clearCanvas()}
                className={byokActionClass}
                style={{
                  ...byokPrimaryActionStyle,
                  flex: '1 1 12rem',
                  borderColor: 'var(--ring)',
                  background: 'var(--surface-strong)',
                  color: 'var(--foreground)',
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <Eraser className="h-5 w-5" />
                Clear
              </motion.button>

              <motion.button
                type="button"
                onClick={handleDrawingSubmit}
                disabled={isJudging || !userApiKey}
                className={byokActionClass}
                style={{ ...byokPrimaryActionStyle, flex: '2 1 18rem' }}
                whileHover={isJudging || !userApiKey ? undefined : { y: -2 }}
                whileTap={isJudging || !userApiKey ? undefined : { scale: 0.99 }}
              >
                {isJudging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isJudging ? 'Judging...' : 'Submit Drawing'}
              </motion.button>
            </div>

            {judgeError && (
              <p
                style={{
                  ...BYOK_PANEL,
                  marginTop: '1rem',
                  padding: '0.9rem 1.1rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'var(--muted)',
                }}
              >
                {judgeError}
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};


export default DrawOffBYOK;
