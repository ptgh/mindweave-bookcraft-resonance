import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, json } from "../_shared/adminAuth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return json(500, { error: 'AI not configured' });
    }

    const { bookTitle, bookAuthor } = await req.json();

    if (!bookTitle || !bookAuthor) {
      return json(400, { error: 'Missing bookTitle or bookAuthor' });
    }

    console.log(`Inferring protagonist for "${bookTitle}" by ${bookAuthor}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a literary reference tool. Given a book title and author, return ONLY the name of the main protagonist/narrator. Just the character name, nothing else. If the book has multiple protagonists, return the most central one. If you are unsure, return "Unknown".'
          },
          {
            role: 'user',
            content: `Book: "${bookTitle}" by ${bookAuthor}`
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      console.error('AI error:', response.status);
      return json(200, { protagonist: null });
    }

    const data = await response.json();
    const protagonist = data.choices?.[0]?.message?.content?.trim() || null;

    console.log(`Inferred protagonist: ${protagonist}`);

    return json(200, { protagonist: protagonist === 'Unknown' ? null : protagonist });

  } catch (error) {
    console.error('Infer protagonist error:', error);
    return json(200, { protagonist: null });
  }
});
