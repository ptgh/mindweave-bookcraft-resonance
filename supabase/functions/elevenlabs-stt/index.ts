import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STTRequest {
  audio: string; // Base64 encoded audio
  format?: 'webm' | 'mp3' | 'wav' | 'ogg';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ElevenLabs not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { audio, format = 'webm' }: STTRequest = await req.json();

    if (!audio) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Audio data is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('STT Request received, format:', format);

    // Decode base64 audio
    const audioBytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Create form data for ElevenLabs Scribe API
    const formData = new FormData();
    
    const mimeTypes: Record<string, string> = {
      'webm': 'audio/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg'
    };
    
    const blob = new Blob([audioBytes], { type: mimeTypes[format] || 'audio/webm' });
    formData.append('file', blob, `audio.${format}`);
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'eng');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Transcription failed: ${response.status}` 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcription = await response.json();

    console.log('STT transcription successful:', transcription.text?.slice(0, 100));

    return new Response(JSON.stringify({ 
      success: true,
      text: transcription.text || '',
      words: transcription.words || [],
      language: transcription.language_code || 'eng'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('STT error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Transcription failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
