import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('[token] ELEVENLABS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID') || 'agent_8501khxttz5zf9rt0zpn1vtkv1qj';

    console.log('[token] Requesting WebSocket signed URL for agent:', AGENT_ID);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    const responseText = await response.text();
    console.log('[token] ElevenLabs API status:', response.status, 'body length:', responseText.length);

    if (!response.ok) {
      console.error('[token] ElevenLabs signed URL error:', response.status, responseText);
      return new Response(JSON.stringify({ error: `Signed URL generation failed: ${response.status}`, details: responseText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[token] Failed to parse ElevenLabs response:', parseErr);
      return new Response(JSON.stringify({ error: 'Invalid response from voice service' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data.signed_url) {
      console.error('[token] No signed_url in response. Keys:', Object.keys(data));
      return new Response(JSON.stringify({ error: 'No signed_url in voice service response', keys: Object.keys(data) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[token] WebSocket signed URL generated successfully');

    return new Response(JSON.stringify({ signed_url: data.signed_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[token] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Token generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
