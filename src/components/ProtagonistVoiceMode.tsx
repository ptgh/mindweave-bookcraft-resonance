import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PhoneOff, Loader2 } from "lucide-react";
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

type VoiceState = "idle" | "connecting" | "connected";

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
  const [pulseScale, setPulseScale] = useState(1);
  const animFrameRef = useRef<number>(0);

  const handleMessage = useCallback((message: any) => {
    if (message?.type === "user_transcript") {
      const transcript = message?.user_transcription_event?.user_transcript;
      if (transcript) setLastTranscript(transcript);
    } else if (message?.type === "agent_response") {
      const response = message?.agent_response_event?.agent_response;
      if (response) setLastReply(response);
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setVoiceState("connected");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setVoiceState("idle");
    },
    onMessage: handleMessage as any,
    onError: (error: any) => {
      console.error("Conversation error:", error);
      setVoiceState("idle");
    },
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

  // Audio visualisation based on agent speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      let phase = 0;
      const tick = () => {
        phase += 0.08;
        setPulseScale(1 + Math.sin(phase) * 0.15 + Math.random() * 0.05);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      cancelAnimationFrame(animFrameRef.current);
      setPulseScale(1);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [conversation.isSpeaking]);

  const startConversation = useCallback(async () => {
    setVoiceState("connecting");
    setLastTranscript("");
    setLastReply("");

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error || !data?.signed_url) {
        console.error("Token error:", error, data);
        setVoiceState("idle");
        return;
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setVoiceState("idle");
    }
  }, [conversation]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
    onClose();
  }, [conversation, onClose]);

  // Auto-start on mount
  useEffect(() => {
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = voiceState === "connected" && !conversation.isSpeaking;
  const isSpeaking = voiceState === "connected" && conversation.isSpeaking;

  const stateLabel = voiceState === "connecting"
    ? "Connecting..."
    : voiceState === "idle"
    ? `Tap to speak with ${protagonistName}`
    : isSpeaking
    ? `${protagonistName} is speaking...`
    : "Listening...";

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      {/* End call button */}
      <button
        onClick={endSession}
        className="absolute top-6 right-6 p-3 rounded-full bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30 transition-colors"
        title="End voice session"
      >
        <PhoneOff className="w-5 h-5" />
      </button>

      <p className="text-muted-foreground text-xs mb-2 tracking-wider uppercase">
        Voice Mode
      </p>
      <h2 className="text-foreground text-lg font-medium mb-1">{protagonistName}</h2>
      <p className="text-muted-foreground text-[11px] mb-8">
        from "{bookTitle}" by {bookAuthor}
      </p>

      {/* Avatar with pulse ring */}
      <div className="relative mb-10">
        <div
          className="absolute inset-0 rounded-full border-2 transition-all duration-200"
          style={{
            transform: `scale(${pulseScale * 1.15})`,
            borderColor: isListening
              ? "rgba(34,211,238,0.4)"
              : isSpeaking
              ? "rgba(139,92,246,0.4)"
              : "rgba(100,116,139,0.15)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full border transition-all duration-300"
          style={{
            transform: `scale(${pulseScale * 1.3})`,
            borderColor: isListening
              ? "rgba(34,211,238,0.15)"
              : isSpeaking
              ? "rgba(139,92,246,0.15)"
              : "transparent",
          }}
        />

        <Avatar
          className="h-40 w-40 border-2 transition-colors duration-300"
          style={{
            borderColor: isListening
              ? "rgba(34,211,238,0.6)"
              : isSpeaking
              ? "rgba(139,92,246,0.6)"
              : "rgba(100,116,139,0.3)",
            boxShadow: isListening
              ? "0 0 40px rgba(34,211,238,0.2)"
              : isSpeaking
              ? "0 0 40px rgba(139,92,246,0.2)"
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
      </div>

      <p className={`text-muted-foreground text-sm mb-6 ${voiceState === "connected" ? "animate-pulse" : ""}`}>
        {stateLabel}
      </p>

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

      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={endSession}
          className="p-5 rounded-full bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30 transition-all hover:scale-105"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ProtagonistVoiceMode;
