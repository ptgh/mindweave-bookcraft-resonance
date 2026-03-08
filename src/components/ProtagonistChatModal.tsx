import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Send, Mic, MicOff, Volume2, Loader2, MessageCircle, AudioLines, Swords, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ProtagonistVoiceMode from "./ProtagonistVoiceMode";
import MissionChoiceButtons from "./protagonist/MissionChoiceButtons";

interface ProtagonistChatModalProps {
  bookTitle: string;
  bookAuthor: string;
  protagonistName: string;
  portraitUrl?: string | null;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  choices?: string[];
  missionPhase?: string;
}

type Mode = 'chat' | 'mission';

const ProtagonistChatModal = ({ bookTitle, bookAuthor, protagonistName, portraitUrl, onClose }: ProtagonistChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showPortraitLightbox, setShowPortraitLightbox] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const [missionTurn, setMissionTurn] = useState(0);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionPhase, setMissionPhase] = useState<string>('opening');
  const [missionMessages, setMissionMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Swipe-to-dismiss state
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingHistory(false);
          return;
        }

        const { data: conv } = await supabase
          .from('protagonist_conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('protagonist_name', protagonistName)
          .eq('book_title', bookTitle)
          .maybeSingle();

        if (conv) {
          setConversationId(conv.id);

          const { data: msgs } = await supabase
            .from('protagonist_messages')
            .select('role, content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          if (msgs && msgs.length > 0) {
            setMessages(msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [protagonistName, bookTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, missionMessages]);

  // Swipe-to-dismiss handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !dragRef.current) return;
    dragCurrentY.current = e.touches[0].clientY - dragStartY.current;
    if (dragCurrentY.current > 0) {
      dragRef.current.style.transform = `translateY(${dragCurrentY.current}px)`;
      dragRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (!dragRef.current) return;
    if (dragCurrentY.current > 100) {
      onClose();
    } else {
      dragRef.current.style.transform = 'translateY(0)';
      dragRef.current.style.transition = 'transform 0.3s ease';
    }
    dragCurrentY.current = 0;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('protagonist-chat', {
        body: {
          message: text.trim(),
          bookTitle,
          bookAuthor,
          protagonistName,
          conversationId,
        }
      });

      if (error) throw error;

      if (data?.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data?.reply || "..." 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Protagonist chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I seem to have lost my train of thought. Could you say that again?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMissionAction = async (action: string) => {
    if (isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: action };
    setMissionMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('protagonist-mission', {
        body: {
          message: action,
          bookTitle,
          bookAuthor,
          protagonistName,
          conversationId,
          missionId,
          turn: missionTurn,
        }
      });

      if (error) throw error;

      if (data?.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      if (data?.missionId) setMissionId(data.missionId);
      if (data?.turn !== undefined) setMissionTurn(data.turn);
      if (data?.missionPhase) setMissionPhase(data.missionPhase);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.narrative || 'The world shifts around you...',
        choices: data?.choices || [],
        missionPhase: data?.missionPhase,
      };
      setMissionMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Mission error:', err);
      setMissionMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something disrupts the narrative... Try again.",
        choices: ['Try again'],
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startMission = () => {
    setMissionMessages([]);
    setMissionTurn(0);
    setMissionId(null);
    setMissionPhase('opening');
    sendMissionAction(`I'm ready to go on a mission with you, ${protagonistName}. Lead the way.`);
  };

  const endMission = () => {
    setMissionMessages([]);
    setMissionTurn(0);
    setMissionId(null);
    setMissionPhase('opening');
    setMode('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const { data, error } = await supabase.functions.invoke('elevenlabs-stt', {
              body: { audio: base64, format: 'webm' }
            });
            if (data?.text) {
              setInput(data.text);
              sendMessage(data.text);
            }
          } catch (err) {
            console.error('STT error:', err);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakMessage = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceName: 'roger' }),
        }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('TTS HTTP error:', response.status, errText);
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  const hasHistory = messages.length > 0 && !isLoadingHistory;
  const isMissionActive = mode === 'mission' && missionMessages.length > 0;
  const currentMessages = mode === 'chat' ? messages : missionMessages;

  const phaseLabel = (phase: string) => {
    switch (phase) {
      case 'opening': return 'The mission begins';
      case 'rising_action': return 'The plot thickens';
      case 'climax': return 'The critical moment';
      case 'resolution': return 'The aftermath';
      case 'complete': return 'Mission complete';
      default: return '';
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dragRef}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col mb-4 sm:mb-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag indicator (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => portraitUrl && setShowPortraitLightbox(true)} className="focus:outline-none">
              <Avatar className="h-8 w-8 border-2 border-violet-500/30 shadow-lg shadow-violet-500/20 hover:border-violet-400/60 transition-colors cursor-pointer">
                {portraitUrl ? (
                  <AvatarImage src={portraitUrl} alt={protagonistName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-slate-800 text-violet-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            </button>
            <div>
              <h3 className="text-slate-200 text-sm font-medium">
                {mode === 'mission' ? `Mission with ${protagonistName}` : `Speaking with ${protagonistName}`}
              </h3>
              <p className="text-slate-500 text-[10px]">
                from "{bookTitle}" by {bookAuthor}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowVoiceMode(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            title="Voice mode"
          >
            <AudioLines className="w-4 h-4" />
            <span className="text-[10px] font-medium">Try voice</span>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'chat'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => {
              setMode('mission');
              if (missionMessages.length === 0) startMission();
            }}
            className={`flex-1 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'mission'
                ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Mission
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3 min-h-[200px]">
          {mode === 'chat' ? (
            <>
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className="w-5 h-5 text-cyan-400/60 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-cyan-400/60 text-sm italic">
                    "{protagonistName} is here. Ask me anything about my story..."
                  </p>
                  <p className="text-slate-500 text-[10px] mt-2">
                    Conversations stay within the world of "{bookTitle}"
                  </p>
                </div>
              ) : (
                <>
                  {hasHistory && messages.length > 0 && (
                    <p className="text-center text-slate-600 text-[10px] mb-2">
                      {protagonistName} remembers you
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-cyan-500/20 border border-cyan-500/30 text-slate-200' 
                          : 'bg-slate-800 border border-slate-700/50 text-slate-300'
                      }`}>
                        {msg.content}
                        {msg.role === 'assistant' && (
                          <button 
                            onClick={() => speakMessage(msg.content)}
                            className="ml-2 inline-flex text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Listen"
                            disabled={isSpeaking}
                          >
                            <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse text-cyan-400' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            /* Mission mode */
            <>
              {missionMessages.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Swords className="w-8 h-8 text-violet-400/40 mx-auto mb-3" />
                  <p className="text-violet-400/60 text-sm italic">
                    Preparing your mission...
                  </p>
                </div>
              )}
              {isMissionActive && missionPhase && (
                <div className="text-center mb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-medium">
                    {phaseLabel(missionPhase)} · Turn {missionTurn}
                  </span>
                </div>
              )}
              {missionMessages.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm bg-violet-500/20 border border-violet-500/30 text-slate-200">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                const isLastAssistant = i === missionMessages.length - 1 || 
                  !missionMessages.slice(i + 1).some(m => m.role === 'assistant');

                return (
                  <div key={i} className="space-y-1">
                    {/* Narrative block */}
                    <div className="bg-slate-800/80 border border-violet-500/10 rounded-xl px-4 py-3 text-sm text-slate-300 leading-relaxed italic">
                      {msg.content}
                    </div>

                    {/* Choice buttons — only on the last assistant message */}
                    {isLastAssistant && msg.choices && msg.choices.length > 0 && !isLoading && (
                      <MissionChoiceButtons
                        choices={msg.choices}
                        onChoose={sendMissionAction}
                        disabled={isLoading}
                      />
                    )}

                    {/* Mission complete */}
                    {isLastAssistant && msg.missionPhase === 'complete' && !isLoading && (
                      <div className="text-center mt-4 space-y-2">
                        <p className="text-violet-400 text-xs font-medium">Mission Complete</p>
                        <button
                          onClick={endMission}
                          className="px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/30 transition-all"
                        >
                          Return to Chat
                        </button>
                        <button
                          onClick={startMission}
                          className="ml-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-xs hover:bg-slate-700 transition-all"
                        >
                          New Mission
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`border px-3 py-2 rounded-xl ${mode === 'mission' ? 'bg-slate-800/80 border-violet-500/10' : 'bg-slate-800 border-slate-700/50'}`}>
                <div className="flex gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${mode === 'mission' ? 'bg-violet-400/60' : 'bg-cyan-400/60'}`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${mode === 'mission' ? 'bg-violet-400/60' : 'bg-cyan-400/60'}`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${mode === 'mission' ? 'bg-violet-400/60' : 'bg-cyan-400/60'}`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — chat mode only */}
        {mode === 'chat' && (
          <div className="p-3 border-t border-slate-700/50 flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
                isRecording 
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400' 
                  : 'bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-cyan-400'
              }`}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${protagonistName} something...`}
              className="flex-1 h-10 bg-slate-800 border border-slate-700/50 rounded-lg px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-30 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mission mode footer */}
        {mode === 'mission' && isMissionActive && missionPhase !== 'complete' && (
          <div className="p-3 border-t border-slate-700/50 flex items-center justify-between">
            <button
              onClick={endMission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              End Mission
            </button>
            <span className="text-slate-600 text-[10px]">
              Turn {missionTurn} · {phaseLabel(missionPhase)}
            </span>
          </div>
        )}
      </div>

      {/* Portrait Lightbox */}
      {showPortraitLightbox && portraitUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center"
          onClick={() => setShowPortraitLightbox(false)}
        >
          <img
            src={portraitUrl}
            alt={protagonistName}
            className="max-w-[80vw] max-h-[80vh] rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/20 object-contain"
          />
        </div>
      )}

      {/* Voice Mode */}
      {showVoiceMode && (
        <ProtagonistVoiceMode
          bookTitle={bookTitle}
          bookAuthor={bookAuthor}
          protagonistName={protagonistName}
          portraitUrl={portraitUrl}
          conversationId={conversationId}
          onConversationId={setConversationId}
          onClose={() => setShowVoiceMode(false)}
        />
      )}
    </div>,
    document.body
  );
};

export default ProtagonistChatModal;
