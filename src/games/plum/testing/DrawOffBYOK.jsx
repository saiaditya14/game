import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eraser, Loader2, Play, Send, Sparkles, KeyRound, X } from 'lucide-react';

const DOODLE_WORDS = ["apple", "cat", "dog", "car", "tree", "bicycle", "book", "camera", "chair", "clock", "cup", "eye", "flower", "glasses", "hat", "house", "key", "pants", "pizza", "shoe", "smiley face", "star", "sun", "umbrella"];

const CLASS_HINTS = {
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

const pickTargetWord = (previousWord) => {
  const choices = DOODLE_WORDS.filter((word) => word !== previousWord);
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
            'The drawings are crude black-on-white sketches. ' +
            'Return exactly three plain text lines and nothing else. ' +
            'Do not use JSON. Do not use markdown. Do not add a preface. ' +
            'Line 1 must be VERDICT: match OR incomplete OR wrong. ' +
            'Line 2 must be GUESS: one valid game class OR incomplete OR unknown. ' +
            'Line 3 must be REASON: a specific visual explanation.';
            
          const userPrompt =
            `Target word: "${targetWord}"\n` +
            `Valid game classes: ${Object.keys(CLASS_HINTS).join(', ')}\n\n` +
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

          const result = buildResult(rawText, targetWord, DOODLE_WORDS);
          
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
  }, [clearCanvas, isGameActive, isJudging, targetWord, userApiKey]);

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
  };

  return (
    <div className="mx-auto max-w-6xl px-2 py-10 text-foreground sm:px-4">
      <header className="mb-8 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">single player sprint</p>
        <h1 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Draw Off</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          Bring Your Own Key (BYOK) Mode: Draw the prompt, submit when it is ready, and race the AI to three correct guesses using your own Gemini Key.
        </p>
      </header>
      
      {/* API Key Input Section */}
      <div className="mx-auto max-w-xl mb-8">
        <div className="border border-border/70 bg-[color:var(--surface-strong)] p-5 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
          <label className="text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)] mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Gemini API Key
          </label>
          {userApiKey ? (
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[color:var(--primary)] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Key Saved
                </span>
                <button 
                  onClick={clearKey}
                  className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Clear Key
                </button>
             </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="password"
                placeholder="Enter Gemini API Key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="flex-1 rounded border border-border/70 bg-[color:var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              />
              <button 
                onClick={saveKey}
                disabled={!keyInput.trim()}
                className="rounded bg-[color:var(--primary)] px-4 py-2 text-sm font-bold text-[color:var(--surface)] hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

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
              className={`mx-auto mt-6 max-w-56 ${primaryActionClass}`}
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

            <div className="relative overflow-hidden border border-border/70 bg-[color:var(--surface-strong)] p-3" style={{ borderRadius: 'var(--radius)' }}>
              {!userApiKey && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-[color:var(--surface)]/80 backdrop-blur-[1px]">
                    <div className="inline-flex items-center gap-2 border border-border/70 bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-primary" style={{ borderRadius: 'var(--radius)' }}>
                      <KeyRound className="h-4 w-4" /> Please enter your API key to draw
                    </div>
                  </div>
              )}
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

            <div className="mt-4 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
              <motion.button
                type="button"
                onClick={() => clearCanvas()}
                className={secondaryActionClass}
                style={{ borderRadius: 'var(--radius)' }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <Eraser className="h-5 w-5" />
                Clear Canvas
              </motion.button>

              <motion.button
                type="button"
                onClick={handleDrawingSubmit}
                disabled={isJudging || !userApiKey}
                className={primaryActionClass}
                style={{ borderRadius: 'var(--radius)' }}
                whileHover={isJudging || !userApiKey ? undefined : { y: -2 }}
                whileTap={isJudging || !userApiKey ? undefined : { scale: 0.99 }}
              >
                {isJudging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Submit Drawing
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

export default DrawOffBYOK;