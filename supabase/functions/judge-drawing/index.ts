const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalizeVerdict = (value: string) => {
  const verdict = value.trim().toLowerCase();

  if (verdict.includes('match')) return 'match';
  if (verdict.includes('incomplete')) return 'incomplete';
  return 'wrong';
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
      return new Response('wrong', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response('wrong', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const imageData = String(base64Image).replace(/^data:image\/\w+;base64,/, '');
    const systemPrompt =
      'You are a harsh but fair Pictionary judge. ' +
      "1. If it is just a few random scribbles, dots, or is clearly incomplete, reply ONLY with 'incomplete'. " +
      "2. If it reasonably resembles the target, reply ONLY with 'match'. " +
      "3. If it looks like something else entirely, reply ONLY with 'wrong'.";
    const prompt = `The user was told to draw: "${targetWord}". Look at this sketch.`;

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
                    mime_type: 'image/png',
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4,
          },
        }),
      },
    );

    if (!response.ok) {
      return new Response('wrong', {
        status: 502,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'wrong';

    return new Response(normalizeVerdict(text), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    });
  } catch (_error) {
    return new Response('wrong', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
