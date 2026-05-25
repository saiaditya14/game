const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const DEFAULT_GAME_WORDS = [
  'apple',
  'cat',
  'dog',
  'car',
  'tree',
  'bicycle',
  'book',
  'camera',
  'chair',
  'clock',
  'cup',
  'eye',
  'flower',
  'glasses',
  'hat',
  'house',
  'key',
  'pants',
  'pizza',
  'shoe',
  'smiley face',
  'star',
  'sun',
  'umbrella',
];

const CLASS_HINTS: Record<string, string> = {
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

const buildResult = (value: string, targetWord: string, gameWords: string[]) => {
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
    return {
      verdict: 'match',
      guess: targetWord,
      reason,
      raw: value,
    };
  }

  if (clean === 'incomplete') {
    return {
      verdict: 'incomplete',
      guess: 'incomplete',
      reason,
      raw: value,
    };
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
    return {
      verdict: 'incomplete',
      guess: 'incomplete',
      reason,
      raw: value,
    };
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { base64Image, targetWord } = await req.json();

    if (!base64Image || !targetWord) {
      return jsonResponse({
        verdict: 'wrong',
        guess: 'unknown',
        reason: 'Missing image or target word in request.',
        raw: 'missing_request_fields',
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return jsonResponse({
        verdict: 'wrong',
        guess: 'unknown',
        reason: 'Missing GEMINI_API_KEY in Edge Function environment.',
        raw: 'missing_gemini_api_key',
      });
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const gameWords = DEFAULT_GAME_WORDS;
    const imageData = String(base64Image).replace(/^data:image\/\w+;base64,/, '');
    const systemPrompt =
      'You are a strict visual classifier for a Pictionary game. ' +
      'The drawings are crude black-on-white sketches. ' +
      'Return exactly three plain text lines and nothing else. ' +
      'Do not use JSON. Do not use markdown. Do not add a preface. ' +
      'Line 1 must be VERDICT: match OR incomplete OR wrong. ' +
      'Line 2 must be GUESS: one valid game class OR incomplete OR unknown. ' +
      'Line 3 must be REASON: a specific visual explanation.';
    const prompt =
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 220,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return jsonResponse({
        verdict: 'wrong',
        guess: 'unknown',
        reason: `Gemini API error ${response.status}: ${errorText.slice(0, 500)}`,
        raw: errorText,
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'wrong';
    const result = buildResult(text, targetWord, gameWords);

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({
      verdict: 'wrong',
      guess: 'unknown',
      reason: `Edge Function error: ${error instanceof Error ? error.message : String(error)}`,
      raw: error instanceof Error ? error.stack || error.message : String(error),
    });
  }
});
