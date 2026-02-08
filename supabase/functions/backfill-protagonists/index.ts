import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/adminAuth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch transmissions without a protagonist
    const { data: transmissions, error } = await supabase
      .from('transmissions')
      .select('id, title, author')
      .is('protagonist', null)
      .limit(50);

    if (error) throw error;
    if (!transmissions || transmissions.length === 0) {
      return new Response(JSON.stringify({ message: 'No transmissions need protagonist inference', updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Inferring protagonists for ${transmissions.length} transmissions`);
    let updated = 0;

    for (const t of transmissions) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              { role: 'system', content: 'You are a literary reference tool. Given a book title and author, return ONLY the name of the main protagonist/narrator. Just the character name, nothing else. If unsure, return "Unknown".' },
              { role: 'user', content: `Book: "${t.title}" by ${t.author}` }
            ],
            temperature: 0.1,
            max_tokens: 50,
          }),
        });

        if (!response.ok) {
          console.error(`AI error for "${t.title}":`, response.status);
          continue;
        }

        const data = await response.json();
        const protagonist = data.choices?.[0]?.message?.content?.trim();

        if (protagonist && protagonist !== 'Unknown') {
          await supabase.from('transmissions').update({ protagonist }).eq('id', t.id);
          console.log(`${t.title} -> ${protagonist}`);
          updated++;
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Error for "${t.title}":`, e);
      }
    }

    return new Response(JSON.stringify({ message: `Updated ${updated}/${transmissions.length} transmissions`, updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
