import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Loader2, WifiOff } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
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

type VoiceState = "idle" | "connecting" | "connected" | "error";

const ProtagonistVoiceMode = ({
  bookTitle,
  bookAuthor,
  protagonistName,
  portraitUrl,
  onClose,
}: ProtagonistVoiceModeProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pulseScale, setPulseScale] = useState(1);
  const animFrameRef = useRef<number>(0);
  const sessionStartedRef = useRef(false);
  const mountedRef = useRef(true);

  const handleMessage = useCallback((message: any) => {
    if (message?.type === "user_transcript") {
      const transcript = message?.user_transcription_event?.user_transcript;
      if (transcript) setLastTranscript(transcript);
    } else if (message?.type === "agent_response") {
      const response = message?.agent_response_event?.agent_response;
      if (response) setLastReply(response);
    }
  }, []);

  // NOTE: Do NOT pass overrides here — known SDK bug causes session abort.
  // Overrides are passed in startSession() instead.
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      if (mountedRef.current) setVoiceState("connected");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      if (mountedRef.current) {
        // Only set idle if we were connected (not an error disconnect)
        setVoiceState(prev => prev === "error" ? "error" : "idle");
      }
    },
    onMessage: handleMessage as any,
    onError: (error: any) => {
      console.error("Conversation error:", error);
      if (mountedRef.current) {
        setVoiceState("error");
        setErrorMessage(typeof error === "string" ? error : "Connection lost. Tap to retry.");
      }
    },
  });

  // Audio visualisation
  useEffect(() => {
    if (conversation.isSpeaking || voiceState === "connected") {
      let phase = 0;
      const speed = conversation.isSpeaking ? 0.1 : 0.04;
      const intensity = conversation.isSpeaking ? 0.2 : 0.08;
      const tick = () => {
        phase += speed;
        setPulseScale(1 + Math.sin(phase) * intensity + (conversation.isSpeaking ? Math.sin(phase * 2.7) * 0.06 : 0));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      cancelAnimationFrame(animFrameRef.current);
      setPulseScale(1);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [conversation.isSpeaking, voiceState]);

  const startConversation = useCallback(async () => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    setVoiceState("connecting");
    setLastTranscript("");
    setLastReply("");
    setErrorMessage("");

    try {
      // Request mic permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Fetch WebRTC token with retries
      let token: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "elevenlabs-conversation-token"
          );

          if (error || !data?.token) {
            console.warn(`Token attempt ${attempt + 1} failed:`, error, data);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
          } else {
            token = data.token;
            break;
          }
        } catch (fetchErr) {
          console.warn(`Token fetch attempt ${attempt + 1} error:`, fetchErr);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }

      if (!token) {
        console.error("No token obtained after retries");
        if (mountedRef.current) {
          setVoiceState("error");
          setErrorMessage("Could not connect. Check your connection and try again.");
          sessionStartedRef.current = false;
        }
        return;
      }

      if (!mountedRef.current) return;

      console.log("Starting ElevenLabs WebRTC session...");

      // Pass overrides HERE in startSession, not in useConversation config
      await conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: `You are ${protagonistName}, the protagonist from "${bookTitle}" by ${bookAuthor}. Stay completely in character at all times. Speak as if you ARE this character — reference your world, your experiences, your relationships. Never break character. Never discuss being an AI. If asked about real-world topics outside your story's scope, deflect naturally as your character would. Keep responses conversational and relatively brief (2-4 sentences) since this is a voice conversation. Be evocative and immersive.`,
            },
            firstMessage: `*a moment of recognition* Ah... a visitor. I don't often get the chance to speak with someone from beyond my world. I'm ${protagonistName}. What brings you to me?`,
            language: "en",
          },
        },
      } as any);

      console.log("WebRTC session started successfully");
    } catch (err) {
      console.error("Failed to start conversation:", err);
      if (mountedRef.current) {
        setVoiceState("error");
        setErrorMessage("Failed to start voice session. Tap to retry.");
        sessionStartedRef.current = false;
      }
    }
  }, [conversation, protagonistName, bookTitle, bookAuthor]);

  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.warn("End session error (non-fatal):", e);
    }
    onClose();
  }, [conversation, onClose]);

  const retryConnection = useCallback(() => {
    sessionStartedRef.current = false;
    startConversation();
  }, [startConversation]);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-start on mount
  useEffect(() => {
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = voiceState === "connected" && !conversation.isSpeaking;
  const isSpeaking = voiceState === "connected" && conversation.isSpeaking;
  const isActive = isListening || isSpeaking;

  const stateLabel = voiceState === "connecting"
    ? "Connecting..."
    : voiceState === "error"
    ? errorMessage || "Connection error"
    : voiceState === "idle"
    ? "Starting session..."
    : isSpeaking
    ? `${protagonistName} is speaking...`
    : "Listening...";

  // Ring colors
  const ringColor = isSpeaking
    ? "rgba(139,92,246,0.5)"
    : isListening
    ? "rgba(34,211,238,0.5)"
    : "rgba(100,116,139,0.15)";

  const ringColorFaint = isSpeaking
    ? "rgba(139,92,246,0.2)"
    : isListening
    ? "rgba(34,211,238,0.2)"
    : "transparent";

  const glowColor = isSpeaking
    ? "rgba(139,92,246,0.25)"
    : isListening
    ? "rgba(34,211,238,0.25)"
    : "none";

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      <style>{`
        @keyframes voice-wave-1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.18); opacity: 0.15; }
        }
        @keyframes voice-wave-2 {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.32); opacity: 0.08; }
        }
        @keyframes voice-wave-3 {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.48); opacity: 0.03; }
        }
        @keyframes voice-wave-speak-1 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          25% { transform: scale(1.22); opacity: 0.25; }
          75% { transform: scale(1.12); opacity: 0.35; }
        }
        @keyframes voice-wave-speak-2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          33% { transform: scale(1.38); opacity: 0.12; }
          66% { transform: scale(1.28); opacity: 0.2; }
        }
        @keyframes voice-wave-speak-3 {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          40% { transform: scale(1.55); opacity: 0.05; }
          80% { transform: scale(1.42); opacity: 0.1; }
        }
      `}</style>

      {/* Return to chat button */}
      <button
        onClick={endSession}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 border border-muted-foreground/20 text-muted-foreground hover:bg-muted/30 transition-colors text-sm"
        title="Return to chat"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Return to chat</span>
      </button>

      <p className="text-muted-foreground text-xs mb-2 tracking-wider uppercase">
        Voice Mode
      </p>
      <h2 className="text-foreground text-lg font-medium mb-1">{protagonistName}</h2>
      <p className="text-muted-foreground text-[11px] mb-8">
        from "{bookTitle}" by {bookAuthor}
      </p>

      {/* Avatar with animated wavelength rings */}
      <div className="relative mb-10" style={{ width: 200, height: 200 }}>
        {isActive && (
          <div
            className="absolute rounded-full border-2 pointer-events-none"
            style={{
              inset: -8,
              borderColor: ringColor,
              animation: isSpeaking
                ? "voice-wave-speak-1 1.4s ease-in-out infinite"
                : "voice-wave-1 2.2s ease-in-out infinite",
            }}
          />
        )}
        {isActive && (
          <div
            className="absolute rounded-full border pointer-events-none"
            style={{
              inset: -18,
              borderColor: ringColorFaint,
              animation: isSpeaking
                ? "voice-wave-speak-2 1.8s ease-in-out infinite 0.2s"
                : "voice-wave-2 2.8s ease-in-out infinite 0.3s",
            }}
          />
        )}
        {isActive && (
          <div
            className="absolute rounded-full border pointer-events-none"
            style={{
              inset: -30,
              borderColor: ringColorFaint,
              animation: isSpeaking
                ? "voice-wave-speak-3 2.2s ease-in-out infinite 0.4s"
                : "voice-wave-3 3.5s ease-in-out infinite 0.6s",
            }}
          />
        )}

        <div
          className="absolute inset-0 rounded-full border-2 transition-all duration-200 pointer-events-none"
          style={{
            transform: `scale(${pulseScale})`,
            borderColor: ringColor,
          }}
        />

        <Avatar
          className="h-[200px] w-[200px] border-2 transition-colors duration-300"
          style={{
            borderColor: isListening
              ? "rgba(34,211,238,0.6)"
              : isSpeaking
              ? "rgba(139,92,246,0.6)"
              : "rgba(100,116,139,0.3)",
            boxShadow: isActive
              ? `0 0 60px ${glowColor}, 0 0 120px ${glowColor}`
              : "none",
          }}
        >
          {portraitUrl ? (
            <AvatarImage src={portraitUrl} alt={protagonistName} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
            {protagonistName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {voiceState === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {voiceState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
        )}
      </div>

      {/* State label */}
      <p className={`text-muted-foreground text-sm mb-2 ${isActive ? "animate-pulse" : ""}`}>
        {stateLabel}
      </p>

      {/* Retry button for error state */}
      {voiceState === "error" && (
        <button
          onClick={retryConnection}
          className="mb-4 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm"
        >
          Tap to retry
        </button>
      )}

      {/* Transcript / Reply display */}
      <div className="max-w-md w-full px-6 space-y-3 text-center min-h-[80px]">
        {lastTranscript && (
          <p className="text-muted-foreground text-xs">
            <span className="text-muted-foreground/60">You:</span> {lastTranscript}
          </p>
        )}
        {lastReply && (
          <p className="text-foreground/80 text-sm italic">"{lastReply}"</p>
        )}
      </div>

      {/* Return to chat at bottom */}
      <div className="absolute bottom-10">
        <button
          onClick={endSession}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted/20 border border-muted-foreground/20 text-muted-foreground hover:bg-muted/30 transition-all hover:scale-105 text-sm"
          title="Return to chat"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Return to chat</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ProtagonistVoiceMode;
