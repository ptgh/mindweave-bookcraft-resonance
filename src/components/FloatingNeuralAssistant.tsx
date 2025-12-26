import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface FloatingNeuralAssistantProps {
  className?: string;
}

export const FloatingNeuralAssistant: React.FC<FloatingNeuralAssistantProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const pageContext = usePageContext();
  const location = useLocation();
  
  // Hide on Neural Map page (it has its own BrainChatInterface)
  const isNeuralMapPage = location.pathname === '/test-brain';

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Typewriter effect for AI responses
  const typewriterEffect = useCallback((fullText: string, messageId: string) => {
    let index = 0;
    const charsPerTick = 2;
    const tickInterval = 15;
    
    const tick = () => {
      if (index < fullText.length) {
        const nextIndex = Math.min(index + charsPerTick, fullText.length);
        const partialText = fullText.slice(0, nextIndex);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: partialText, isTyping: nextIndex < fullText.length } : msg
        ));
        
        index = nextIndex;
        setTimeout(tick, tickInterval);
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isTyping: false } : msg
        ));
      }
    };
    
    tick();
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowQuickActions(false);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare context for AI
      const messageHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await supabase.functions.invoke('brain-chat', {
        body: {
          message: text.trim(),
          messages: messageHistory,
          userId: user?.id,
          brainData: { nodes: [], links: [], activeFilters: [] },
          userTransmissions: [],
          pageContext: {
            pageName: pageContext.pageName,
            systemContextAddition: pageContext.systemContextAddition,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      const aiContent = data.response || data.message || 'I apologize, but I encountered an issue processing your request.';

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      typewriterEffect(aiContent, assistantMessage.id);

      // Text-to-speech if enabled
      if (voiceEnabled && aiContent) {
        speakText(aiContent);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Communication Error',
        description: 'Failed to reach the Neural Assistant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, user?.id, pageContext, typewriterEffect, voiceEnabled, toast]);

  // Voice input
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
        
        // Convert to base64 and send to STT
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const response = await supabase.functions.invoke('elevenlabs-stt', {
              body: { audio: base64Audio, format: 'webm' },
            });

            if (response.data?.success && response.data.text) {
              setInputValue(response.data.text);
              // Auto-send after transcription
              sendMessage(response.data.text);
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
  }, [sendMessage, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Text-to-speech
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

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Don't render on Neural Map page (has its own BrainChatInterface)
  if (!user || isNeuralMapPage) return null;

  // Clear conversation handler
  const handleClearConversation = () => {
    setMessages([]);
    setShowQuickActions(true);
    toast({
      title: "Conversation cleared",
      description: "Ready for a fresh start",
    });
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Floating Button (when closed) - smaller, subtle like BrainChatInterface */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-11 h-11 rounded-full bg-slate-900/70 hover:bg-slate-900/90 border border-slate-700/40 hover:border-cyan-400/40 backdrop-blur-md shadow-lg shadow-slate-900/30 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          aria-label="Open Neural Assistant"
        >
          <MessageCircle className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-400 transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400/60 rounded-full" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/30 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 w-96 h-[520px] flex flex-col"
        >
          {/* Header - styled like BrainChatInterface */}
          <div 
            className="flex items-center justify-between px-3 py-3 border-b border-slate-700/30 bg-slate-800/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium text-xs">Neural Assistant</span>
                <span className="text-slate-400 text-[9px]">{pageContext.pageName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={(e) => { e.stopPropagation(); handleClearConversation(); }}
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
                onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }}
                title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area - cyan styling like BrainChatInterface */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-cyan-400/60 bg-cyan-400/10 flex items-center justify-center shadow-lg shadow-cyan-400/20">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-slate-300 text-xs mb-3">
                    Ask about your reading network, thematic connections, or book recommendations!
                  </p>
                  
                  {/* Quick Actions */}
                  {showQuickActions && (
                    <div className="space-y-2">
                      {pageContext.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(action.prompt)}
                          className="block w-full text-left text-xs text-slate-300 hover:text-cyan-300 p-2 rounded border border-slate-700/40 hover:border-cyan-400/60 bg-slate-800/30 hover:bg-slate-800/50 transition-all"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-2.5 rounded-lg text-xs whitespace-pre-line",
                      msg.role === 'user'
                        ? "bg-cyan-600/25 border border-cyan-500/35 text-cyan-100"
                        : "bg-slate-800/60 border border-slate-700/30 text-slate-200"
                    )}
                  >
                    {msg.content}
                    {msg.isTyping && <span className="animate-pulse">▌</span>}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/60 px-4 py-2 rounded-lg border border-slate-700/30">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-700/30 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 flex-shrink-0",
                  isRecording ? "text-red-400 bg-red-400/10" : "text-slate-400 hover:text-slate-100"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about SF books, themes..."
                className="flex-1 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm"
                disabled={isLoading || isRecording}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Powered by Lovable AI + ElevenLabs
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingNeuralAssistant;
