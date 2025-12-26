import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

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

  if (!user) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Floating Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          aria-label="Open Neural Assistant"
        >
          <Brain className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping opacity-75" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className={cn(
            "bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300",
            isMinimized ? "w-80 h-14" : "w-96 h-[520px] flex flex-col"
          )}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 cursor-pointer"
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-100">Neural Assistant</h3>
                {!isMinimized && (
                  <p className="text-xs text-slate-400">{pageContext.pageName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
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
                    className="h-8 w-8 text-slate-400 hover:text-slate-100"
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </>
              )}
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

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles className="w-10 h-10 mx-auto text-blue-400/50 mb-3" />
                      <p className="text-slate-400 text-sm mb-4">
                        Your SF knowledge companion. Ask about books, themes, or explore your reading network.
                      </p>
                      
                      {/* Quick Actions */}
                      {showQuickActions && (
                        <div className="space-y-2">
                          {pageContext.quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(action.prompt)}
                              className="w-full px-3 py-2 text-left text-sm bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 text-slate-300 hover:text-slate-100 transition-colors"
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
                        "flex gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] px-3 py-2 rounded-xl text-sm",
                          msg.role === 'user'
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800/80 text-slate-200 border border-slate-700/50"
                        )}
                      >
                        {msg.content}
                        {msg.isTyping && (
                          <span className="inline-block w-1.5 h-4 bg-blue-400 ml-1 animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t border-slate-700/50 bg-slate-800/50">
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
                    className="h-9 w-9 flex-shrink-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingNeuralAssistant;
