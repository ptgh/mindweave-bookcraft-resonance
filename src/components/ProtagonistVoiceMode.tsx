import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProtagonistVoiceModeProps {
  bookTitle: string;
  bookAuthor: string;
  protagonistName: string;
  portraitUrl?: string | null;
  conversationId: string | null;
  onConversationId: (id: string) => void;
  onClose: () => void;
}

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking";

const ProtagonistVoiceMode = ({
  bookTitle,
  bookAuthor,
  protagonistName,
  portraitUrl,
  conversationId,
  onConversationId,
  onClose,
}: ProtagonistVoiceModeProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [pulseScale, setPulseScale] = useState(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioRef.current?.pause();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Audio visualiser for mic input
  const startVisualiser = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setPulseScale(1 + avg / 200);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopVisualiser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setPulseScale(1);
  }, []);

  // Full voice loop: listen → transcribe → AI reply → speak
  const startVoiceLoop = useCallback(async () => {
    setVoiceState("connecting");
    setTranscript("");
    setReply("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startVisualiser(stream);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopVisualiser();
        setVoiceState("processing");

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];

          try {
            // 1. Transcribe
            const { data: sttData } = await supabase.functions.invoke("elevenlabs-stt", {
              body: { audio: base64, format: "webm" },
            });

            const userText = sttData?.text;
            if (!userText) {
              setVoiceState("idle");
              return;
            }
            setTranscript(userText);

            // 2. Get AI reply
            const { data: chatData } = await supabase.functions.invoke("protagonist-chat", {
              body: {
                message: userText,
                bookTitle,
                bookAuthor,
                protagonistName,
                conversationId,
              },
            });

            if (chatData?.conversationId && !conversationId) {
              onConversationId(chatData.conversationId);
            }

            const replyText = chatData?.reply || "I seem to have lost my train of thought.";
            setReply(replyText);

            // 3. Speak the reply
            setVoiceState("speaking");
            const ttsResp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ text: replyText, voiceName: "roger" }),
              }
            );

            if (ttsResp.ok) {
              const blob = await ttsResp.blob();
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              audioRef.current = audio;
              audio.onended = () => {
                URL.revokeObjectURL(url);
                setVoiceState("idle");
              };
              audio.onerror = () => {
                URL.revokeObjectURL(url);
                setVoiceState("idle");
              };
              await audio.play();
            } else {
              setVoiceState("idle");
            }
          } catch (err) {
            console.error("Voice loop error:", err);
            setVoiceState("idle");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setVoiceState("listening");
    } catch (err) {
      console.error("Mic access denied:", err);
      setVoiceState("idle");
    }
  }, [bookTitle, bookAuthor, protagonistName, conversationId, onConversationId, startVisualiser, stopVisualiser]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    }
  }, []);

  const endSession = useCallback(() => {
    audioRef.current?.pause();
    stopRecording();
    stopVisualiser();
    onClose();
  }, [onClose, stopRecording, stopVisualiser]);

  const handleMainAction = () => {
    if (voiceState === "idle") {
      startVoiceLoop();
    } else if (voiceState === "listening") {
      stopRecording();
    } else if (voiceState === "speaking") {
      audioRef.current?.pause();
      setVoiceState("idle");
    }
  };

  const stateLabel: Record<VoiceState, string> = {
    idle: `Tap to speak with ${protagonistName}`,
    connecting: "Connecting...",
    listening: "Listening... tap when done",
    processing: "Thinking...",
    speaking: `${protagonistName} is speaking`,
  };

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      {/* Close / end call */}
      <button
        onClick={endSession}
        className="absolute top-6 right-6 p-3 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors"
        title="End voice session"
      >
        <PhoneOff className="w-5 h-5" />
      </button>

      {/* Character label */}
      <p className="text-slate-500 text-xs mb-2 tracking-wider uppercase">
        Voice Mode
      </p>
      <h2 className="text-slate-200 text-lg font-medium mb-1">{protagonistName}</h2>
      <p className="text-slate-500 text-[11px] mb-8">
        from "{bookTitle}" by {bookAuthor}
      </p>

      {/* Avatar with pulse ring */}
      <button
        onClick={handleMainAction}
        disabled={voiceState === "processing" || voiceState === "connecting"}
        className="relative mb-10 group focus:outline-none"
      >
        {/* Outer pulse rings */}
        <div
          className="absolute inset-0 rounded-full border-2 transition-all duration-200"
          style={{
            transform: `scale(${pulseScale * 1.15})`,
            borderColor:
              voiceState === "listening"
                ? "rgba(34,211,238,0.4)"
                : voiceState === "speaking"
                ? "rgba(139,92,246,0.4)"
                : "rgba(100,116,139,0.15)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full border transition-all duration-300"
          style={{
            transform: `scale(${pulseScale * 1.3})`,
            borderColor:
              voiceState === "listening"
                ? "rgba(34,211,238,0.15)"
                : voiceState === "speaking"
                ? "rgba(139,92,246,0.15)"
                : "transparent",
          }}
        />

        <Avatar
          className="h-40 w-40 border-2 transition-colors duration-300"
          style={{
            borderColor:
              voiceState === "listening"
                ? "rgba(34,211,238,0.6)"
                : voiceState === "speaking"
                ? "rgba(139,92,246,0.6)"
                : "rgba(100,116,139,0.3)",
            boxShadow:
              voiceState === "listening"
                ? "0 0 40px rgba(34,211,238,0.2)"
                : voiceState === "speaking"
                ? "0 0 40px rgba(139,92,246,0.2)"
                : "none",
          }}
        >
          {portraitUrl ? (
            <AvatarImage src={portraitUrl} alt={protagonistName} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-slate-800 text-slate-400 text-3xl">
            {protagonistName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {/* Loading spinner overlay */}
        {(voiceState === "processing" || voiceState === "connecting") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
      </button>

      {/* State label */}
      <p className="text-slate-400 text-sm mb-6 animate-pulse">
        {stateLabel[voiceState]}
      </p>

      {/* Transcript / Reply display */}
      <div className="max-w-md w-full px-6 space-y-3 text-center min-h-[80px]">
        {transcript && (
          <p className="text-slate-500 text-xs">
            <span className="text-slate-600">You:</span> {transcript}
          </p>
        )}
        {reply && (
          <p className="text-slate-300 text-sm italic">"{reply}"</p>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-10 flex items-center gap-6">
        {voiceState === "idle" && (
          <button
            onClick={startVoiceLoop}
            className="p-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all hover:scale-105"
          >
            <Phone className="w-6 h-6" />
          </button>
        )}
        {voiceState === "listening" && (
          <button
            onClick={stopRecording}
            className="p-5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all animate-pulse"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProtagonistVoiceMode;
