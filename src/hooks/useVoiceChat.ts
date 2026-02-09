import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceChatOptions {
  onTranscription?: (text: string) => void;
}

export function useVoiceChat({ onTranscription }: UseVoiceChatOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];

          try {
            const response = await supabase.functions.invoke('elevenlabs-stt', {
              body: { audio: base64Audio, format: 'webm' },
            });

            if (response.data?.success && response.data.text) {
              onTranscription?.(response.data.text);
            } else {
              toast({
                title: 'Transcription Failed',
                description: 'Could not transcribe audio. Please try again.',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('STT error:', error);
            toast({
              title: 'Voice Input Error',
              description: 'Speech-to-text service unavailable.',
              variant: 'destructive',
            });
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access for voice input.',
        variant: 'destructive',
      });
    }
  }, [onTranscription, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const speakText = useCallback(async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);

      const response = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voiceName: 'roger' },
      });

      if (response.data?.success && response.data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${response.data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);

        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  return {
    isRecording,
    isSpeaking,
    voiceEnabled,
    startRecording,
    stopRecording,
    speakText,
    toggleVoice,
  };
}
