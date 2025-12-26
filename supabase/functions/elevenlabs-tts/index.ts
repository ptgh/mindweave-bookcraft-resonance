import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SF-themed voices - Roger has a contemplative, intellectual quality perfect for SF discussions
const SF_VOICES = {
  'roger': 'CwhRBWXzGAHq8TQ4Fs17',      // Contemplative, intellectual - default
  'eric': 'cjVigY5qzO86Huf0OWal',        // Calm, authoritative
  'charlie': 'IKne3meq5aSn9XLyUdCD',     // Warm, engaging
  'george': 'JBFqnCBsd6RMkjVDRZzb',      // Deep, resonant
  'alice': 'Xb7hH8MSUJpSbSDYk0k2',       // Clear, friendly
  'sarah': 'EXAVITQu4vr4xnSDxMaL',       // Expressive, dynamic
};

interface TTSRequest {
  text: string;
  voiceId?: string;
  voiceName?: keyof typeof SF_VOICES;
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

    const { text, voiceId, voiceName = 'roger' }: TTSRequest = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Text is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit text length to prevent abuse
    const maxLength = 5000;
    const trimmedText = text.slice(0, maxLength);
    
    // Resolve voice ID
    const resolvedVoiceId = voiceId || SF_VOICES[voiceName] || SF_VOICES['roger'];

    console.log('TTS Request:', { 
      textLength: trimmedText.length, 
      voiceId: resolvedVoiceId 
    });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: 'eleven_turbo_v2_5', // Fast, high quality
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `TTS generation failed: ${response.status}` 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert audio buffer to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log('TTS generated successfully, audio size:', audioBuffer.byteLength);

    return new Response(JSON.stringify({ 
      success: true,
      audioContent: base64Audio,
      format: 'mp3',
      voiceId: resolvedVoiceId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'TTS generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
