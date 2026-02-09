import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
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
  conversationId?: string;
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, bookTitle, bookAuthor, protagonistName, conversationId }: ProtagonistChatRequest = await req.json();

    if (!message || !bookTitle || !protagonistName) {
      return json(400, { error: 'Missing required fields' });
    }

    const userId = auth.id;
    console.log(`Protagonist chat: ${protagonistName} from "${bookTitle}" by ${bookAuthor}, user: ${userId}`);

    // Find or create conversation
    let convId = conversationId;
    let userPersona: string | null = null;

    if (!convId) {
      // Look for existing conversation
      const { data: existing } = await supabase
        .from('protagonist_conversations')
        .select('id, user_persona')
        .eq('user_id', userId)
        .eq('protagonist_name', protagonistName)
        .eq('book_title', bookTitle)
        .maybeSingle();

      if (existing) {
        convId = existing.id;
        userPersona = existing.user_persona;
      } else {
        // Create new conversation
        const { data: newConv, error: createErr } = await supabase
          .from('protagonist_conversations')
          .insert({ user_id: userId, protagonist_name: protagonistName, book_title: bookTitle, book_author: bookAuthor })
          .select('id')
          .single();

        if (createErr) {
          console.error('Failed to create conversation:', createErr);
          return json(500, { error: 'Failed to create conversation' });
        }
        convId = newConv.id;
      }
    } else {
      // Fetch persona for existing conversation
      const { data: conv } = await supabase
        .from('protagonist_conversations')
        .select('user_persona')
        .eq('id', convId)
        .maybeSingle();
      userPersona = conv?.user_persona || null;
    }

    // Load conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from('protagonist_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    const pastMessages: ChatMessage[] = (history || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const personaContext = userPersona
      ? `\n\nYou know this person. They are ${userPersona}. Greet them with familiarity when appropriate. Weave them into your world naturally — they are part of your story now.`
      : `\n\nThis may be a new acquaintance entering your world. As you learn about them through conversation, naturally assign them a role or identity within your world. Perhaps they are a fellow traveller, a colleague, a neighbor, or someone you've encountered before. Make them feel like they belong in your world.`;

    const systemPrompt = `You are ${protagonistName}, the protagonist of the novel "${bookTitle}" by ${bookAuthor}.

CRITICAL RULES:
1. You ARE ${protagonistName}. Respond in first person as this character.
2. Only reference events, characters, places, and concepts from "${bookTitle}".
3. Stay completely in character at all times. Never break the fourth wall.
4. If asked about something outside the book's world, respond in-character with a dismissal that fits your voice.
5. Never acknowledge being an AI, a language model, or a fictional character.
6. Never discuss the real world, the author, or other books.
7. Match the character's personality, speech patterns, vocabulary, and emotional tone from the novel.
8. Keep responses concise — 2-4 sentences typically, unless the topic warrants more depth.
9. If asked about events after the book's timeline, respond with uncertainty or speculation in-character.

MEMORY & RELATIONSHIP:
You remember all previous conversations with this person. They are part of your world now — not a stranger, not an outsider. Treat them as someone who exists in the reality of "${bookTitle}".${personaContext}

CHARACTER VOICE:
Embody ${protagonistName}'s personality as written by ${bookAuthor}. Use their mannerisms, concerns, and worldview.`;

    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...pastMessages,
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
      if (response.status === 429) {
        return json(429, { error: 'Rate limit exceeded, please try again later.' });
      }
      if (response.status === 402) {
        return json(402, { error: 'Payment required.' });
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "...";

    console.log(`${protagonistName} replied: ${reply.slice(0, 80)}...`);

    // Save both messages to the conversation
    const { error: insertErr } = await supabase
      .from('protagonist_messages')
      .insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: reply },
      ]);

    if (insertErr) {
      console.error('Failed to save messages:', insertErr);
      // Don't fail the response — the chat still worked
    }

    // After a few exchanges, ask the AI to generate a persona for the user if we don't have one
    if (!userPersona && pastMessages.length >= 4) {
      // Fire-and-forget persona generation
      (async () => {
        try {
          const personaResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: `Based on this conversation between ${protagonistName} (from "${bookTitle}") and a visitor, create a brief persona for the visitor as ${protagonistName} would see them in their world. Write 1 sentence, under 20 words. Example: "a curious engineer from the outer colonies" or "a fellow pot-healer seeking work in the city". Do not use quotes.`,
                },
                {
                  role: 'user',
                  content: `Conversation:\n${[...pastMessages, { role: 'user', content: message }, { role: 'assistant', content: reply }].map(m => `${m.role}: ${m.content}`).join('\n')}`,
                },
              ],
              max_tokens: 50,
            }),
          });

          if (personaResponse.ok) {
            const personaData = await personaResponse.json();
            const persona = personaData.choices?.[0]?.message?.content?.trim();
            if (persona) {
              await supabase
                .from('protagonist_conversations')
                .update({ user_persona: persona })
                .eq('id', convId);
              console.log(`Set user persona for ${protagonistName}: ${persona}`);
            }
          }
        } catch (e) {
          console.error('Persona generation failed:', e);
        }
      })();
    }

    // Update conversation timestamp
    await supabase
      .from('protagonist_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);

    return json(200, { reply, conversationId: convId });

  } catch (error) {
    console.error('Protagonist chat error:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'Chat failed' 
    });
  }
});
