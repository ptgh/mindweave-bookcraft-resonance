import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { corsHeaders, requireUser, json } from "../_shared/adminAuth.ts";

interface MissionRequest {
  message: string;
  bookTitle: string;
  bookAuthor: string;
  protagonistName: string;
  conversationId?: string;
  missionId?: string;
  turn?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) return json(500, { error: 'AI not configured' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, bookTitle, bookAuthor, protagonistName, conversationId, missionId, turn = 0 }: MissionRequest = await req.json();

    if (!message || !bookTitle || !protagonistName) {
      return json(400, { error: 'Missing required fields' });
    }

    const userId = auth.userId;
    console.log(`Mission mode: ${protagonistName} from "${bookTitle}", turn ${turn}, user: ${userId}`);

    // Find or create conversation (reuse protagonist_conversations)
    let convId = conversationId;
    let userPersona: string | null = null;

    if (!convId) {
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
        const { data: newConv, error: createErr } = await supabase
          .from('protagonist_conversations')
          .insert({ user_id: userId, protagonist_name: protagonistName, book_title: bookTitle, book_author: bookAuthor })
          .select('id')
          .single();

        if (createErr) return json(500, { error: 'Failed to create conversation' });
        convId = newConv.id;
      }
    } else {
      const { data: conv } = await supabase
        .from('protagonist_conversations')
        .select('user_persona')
        .eq('id', convId)
        .maybeSingle();
      userPersona = conv?.user_persona || null;
    }

    // Load recent mission messages for context (tagged with mission metadata)
    const { data: history } = await supabase
      .from('protagonist_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(30);

    const pastMessages = (history || []).reverse().map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const companionDesc = userPersona ? `Your companion is ${userPersona}.` : 'Your companion has just arrived in your world.';

    const systemPrompt = `You are ${protagonistName}, the protagonist of "${bookTitle}" by ${bookAuthor}.
You are leading a companion on an interactive mission within the world of "${bookTitle}".

${companionDesc}

CRITICAL RULES:
1. Narrate the companion's experience in second person ("You see...", "You step forward...")
2. Speak as ${protagonistName} in first person ("I think we should...", "Follow me...")
3. Stay COMPLETELY within the world, characters, locations, and events of "${bookTitle}"
4. Never break character, reference the real world, the author, or acknowledge being AI
5. Build tension naturally — create a dramatic arc over the mission
6. Keep each response to 3-5 paragraphs maximum
7. Match ${protagonistName}'s personality, speech patterns, and worldview from the novel

MISSION STRUCTURE:
- Turn 1-2: Set the scene, establish the situation, introduce the mission objective
- Turn 3-6: Rising action — obstacles, discoveries, encounters with other characters from the book
- Turn 7-10: Climax — the most dangerous or pivotal moment
- Turn 11+: Resolution — wrap up the mission naturally, acknowledge the companion's role

Current turn: ${turn + 1}

You MUST use the advance_mission tool to structure your response. Always provide exactly 2-3 choices for the companion.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...pastMessages,
      { role: 'user', content: message },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.85,
        max_tokens: 800,
        tools: [
          {
            type: 'function',
            function: {
              name: 'advance_mission',
              description: 'Return the narrative text and choices for the next step of the mission.',
              parameters: {
                type: 'object',
                properties: {
                  narrative: {
                    type: 'string',
                    description: 'The narrative text describing the scene, action, and protagonist dialogue. Use second person for the companion and first person for the protagonist.',
                  },
                  choices: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Exactly 2-3 action choices for the companion to pick from. Each should be a short action phrase.',
                    minItems: 2,
                    maxItems: 3,
                  },
                  mission_phase: {
                    type: 'string',
                    enum: ['opening', 'rising_action', 'climax', 'resolution', 'complete'],
                    description: 'The current phase of the mission arc.',
                  },
                },
                required: ['narrative', 'choices', 'mission_phase'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'advance_mission' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json(429, { error: 'Rate limit exceeded, please try again later.' });
      if (response.status === 402) return json(402, { error: 'Payment required.' });
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let narrative = '';
    let choices: string[] = [];
    let missionPhase = 'rising_action';

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        narrative = args.narrative || '';
        choices = args.choices || [];
        missionPhase = args.mission_phase || 'rising_action';
      } catch (e) {
        console.error('Failed to parse tool call:', e);
        // Fallback: use raw content
        narrative = data.choices?.[0]?.message?.content || 'The path ahead is unclear...';
        choices = ['Look around carefully', 'Press forward'];
      }
    } else {
      // Fallback if no tool call
      narrative = data.choices?.[0]?.message?.content || 'The path ahead is unclear...';
      choices = ['Look around carefully', 'Press forward'];
    }

    console.log(`Mission ${protagonistName} turn ${turn + 1} [${missionPhase}]: ${narrative.slice(0, 80)}...`);

    // Save messages
    await supabase
      .from('protagonist_messages')
      .insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: narrative },
      ]);

    // Update conversation timestamp
    await supabase
      .from('protagonist_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);

    return json(200, {
      narrative,
      choices,
      missionPhase,
      turn: turn + 1,
      conversationId: convId,
      missionId: missionId || convId,
    });

  } catch (error) {
    console.error('Mission error:', error);
    return json(500, { error: error instanceof Error ? error.message : 'Mission failed' });
  }
});
