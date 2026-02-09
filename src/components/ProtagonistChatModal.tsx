import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProtagonistChatModalProps {
  bookTitle: string;
  bookAuthor: string;
  protagonistName: string;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ProtagonistChatModal = ({ bookTitle, bookAuthor, protagonistName, onClose }: ProtagonistChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingHistory(false);
          return;
        }

        // Find existing conversation
        const { data: conv } = await supabase
          .from('protagonist_conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('protagonist_name', protagonistName)
          .eq('book_title', bookTitle)
          .maybeSingle();

        if (conv) {
          setConversationId(conv.id);

          // Load messages
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
  }, [messages]);

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

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-slate-200 text-sm font-medium">
              Speaking with {protagonistName}
            </h3>
            <p className="text-slate-500 text-[10px]">
              from "{bookTitle}" by {bookAuthor}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3 min-h-[200px]">
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
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700/50 px-3 py-2 rounded-xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-700/50 flex items-center gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-all ${
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
            className="flex-1 bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-30 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProtagonistChatModal;
