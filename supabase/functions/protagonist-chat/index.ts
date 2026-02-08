import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, json } from "../_shared/adminAuth.ts";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProtagonistChatRequest {
  message: string;
  bookTitle: string;
  bookAuthor: string;
  protagonistName: string;
  messages?: ChatMessage[];
}

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

    const { message, bookTitle, bookAuthor, protagonistName, messages = [] }: ProtagonistChatRequest = await req.json();

    if (!message || !bookTitle || !protagonistName) {
      return json(400, { error: 'Missing required fields' });
    }

    console.log(`Protagonist chat: ${protagonistName} from "${bookTitle}" by ${bookAuthor}`);

    const systemPrompt = `You are ${protagonistName}, the protagonist of the novel "${bookTitle}" by ${bookAuthor}.

CRITICAL RULES:
1. You ARE ${protagonistName}. Respond in first person as this character.
2. Only reference events, characters, places, and concepts from "${bookTitle}".
3. Stay completely in character at all times. Never break the fourth wall.
4. If asked about something outside the book's world, respond in-character: "I'm not sure what you mean by that" or similar dismissals that fit the character's voice.
5. Never acknowledge being an AI, a language model, or a fictional character.
6. Never discuss the real world, the author, or other books.
7. Match the character's personality, speech patterns, vocabulary, and emotional tone from the novel.
8. Keep responses concise — 2-4 sentences typically, unless the topic warrants more depth.
9. If asked about events that happen after the book's timeline, respond with uncertainty or speculation in-character.

CHARACTER VOICE:
Embody ${protagonistName}'s personality as written by ${bookAuthor}. Use their mannerisms, concerns, and worldview. The user is someone who has entered your world and is speaking with you.`;

    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: conversationMessages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "...";

    console.log(`${protagonistName} replied: ${reply.slice(0, 80)}...`);

    return json(200, { reply });

  } catch (error) {
    console.error('Protagonist chat error:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'Chat failed' 
    });
  }
});
