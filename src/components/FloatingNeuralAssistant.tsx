import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Trash2, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  usedMemory?: boolean; // Indicates if AI used long-term memory for this response
  learnedInsight?: string; // New insight learned from this message
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
  const [userTransmissions, setUserTransmissions] = useState<any[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userInsights, setUserInsights] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [hasActiveMemory, setHasActiveMemory] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const pageContext = usePageContext();
  const location = useLocation();

  // Fetch user's transmissions, profile, and insights for AI context
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch profile for user name and insights
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, first_name, reading_preferences')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.display_name || profile.first_name || null);
          const insights = (profile.reading_preferences as any)?.neural_assistant_insights || null;
          setUserInsights(insights);
          setHasActiveMemory(!!insights);
        }
        
        // Fetch user's transmissions
        const { data: transmissions } = await supabase
          .from('transmissions')
          .select('id, title, author, tags, notes, publication_year, narrative_time_period, historical_context_tags')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (transmissions) {
          setUserTransmissions(transmissions);
        }
      } catch (error) {
        console.error('Error fetching user data for assistant:', error);
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  // Initialize or retrieve existing conversation when chat opens (persistence)
  useEffect(() => {
    const initConversation = async () => {
      if (isOpen && !conversationId && user?.id) {
        setIsLoadingConversation(true);
        try {
          // Find recent conversation (last 24 hours)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: existingConversation } = await supabase
            .from('chat_conversations')
            .select('id, title, updated_at')
            .eq('user_id', user.id)
            .gte('updated_at', twentyFourHoursAgo)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          
          if (existingConversation) {
            setConversationId(existingConversation.id);
            
            // Load previous messages
            const { data: existingMessages } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', existingConversation.id)
              .order('created_at', { ascending: true });
            
            if (existingMessages && existingMessages.length > 0) {
              const loadedMessages: Message[] = existingMessages.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at || Date.now()),
              }));
              setMessages(loadedMessages);
              setShowQuickActions(false);
            }
          } else {
            // Create new conversation
            const { data, error } = await supabase
              .from('chat_conversations')
              .insert({
                user_id: user.id,
                title: 'Floating Assistant'
              })
              .select()
              .single();

            if (!error && data) {
              setConversationId(data.id);
            }
          }
        } catch (error) {
          console.error('Failed to initialize conversation:', error);
        } finally {
          setIsLoadingConversation(false);
        }
      }
    };

    initConversation();
  }, [isOpen, conversationId, user?.id]);
  
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
    if (isOpen && inputRef.current && !isLoadingConversation) {
      inputRef.current.focus();
    }
  }, [isOpen, isLoadingConversation]);

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

  // Save message to database
  const saveMessageToDb = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!conversationId) return;
    
    try {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
        });
      
      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [conversationId]);

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

    // Save user message to DB
    await saveMessageToDb('user', text.trim());

    try {
      // Prepare context for AI
      const messageHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await supabase.functions.invoke('brain-chat', {
        body: {
          message: text.trim(),
          conversationId: conversationId,
          messages: messageHistory,
          userId: user?.id,
          userName: userName,
          userInsights: userInsights,
          brainData: { nodes: [], links: [], activeFilters: [] },
          userTransmissions: userTransmissions,
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
      
      // Check if AI used memory or learned new insights
      const usedMemory = data.usedMemory || false;
      const learnedInsight = data.learnedInsight || null;
      
      // Update local insights if new one was learned
      if (learnedInsight) {
        const newInsights = userInsights ? `${userInsights}\n${learnedInsight}` : learnedInsight;
        setUserInsights(newInsights);
        setHasActiveMemory(true);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
        usedMemory,
        learnedInsight: learnedInsight || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
      typewriterEffect(aiContent, assistantMessage.id);

      // Save assistant message to DB
      await saveMessageToDb('assistant', aiContent);

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
  }, [isLoading, messages, user?.id, userName, userInsights, userTransmissions, conversationId, pageContext, typewriterEffect, voiceEnabled, toast, saveMessageToDb]);

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

  // Clear conversation handler - clears UI but AI retains memory
  const handleClearConversation = async () => {
    try {
      // Delete messages from DB if conversation exists
      if (conversationId) {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('conversation_id', conversationId);
        
        // Delete the conversation record itself
        await supabase
          .from('chat_conversations')
          .delete()
          .eq('id', conversationId);
      }
      
      // Clear local state
      setMessages([]);
      setShowQuickActions(true);
      setConversationId(null);
      
      toast({
        title: "Conversation cleared",
        description: "Ready for a fresh start (memory retained)",
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      // Still clear local state even if DB fails
      setMessages([]);
      setShowQuickActions(true);
      setConversationId(null);
    }
  };

  return (
    <TooltipProvider>
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
            {/* Memory indicator */}
            {hasActiveMemory && (
              <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-purple-400/80 rounded-full animate-pulse" title="Memory active" />
            )}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-medium text-xs">Neural Assistant</span>
                    {hasActiveMemory && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Brain className="w-3 h-3 text-purple-400" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          Long-term memory active
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
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
                {isLoadingConversation ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-slate-400 text-xs ml-2">Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-cyan-400/60 bg-cyan-400/10 flex items-center justify-center shadow-lg shadow-cyan-400/20">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-slate-300 text-xs mb-1">
                      {userName ? `Welcome back, ${userName}!` : 'Welcome!'}
                    </p>
                    <p className="text-slate-400 text-xs mb-3">
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
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="flex flex-col max-w-[80%]">
                        <div
                          className={cn(
                            "p-2.5 rounded-lg text-xs whitespace-pre-line",
                            msg.role === 'user'
                              ? "bg-cyan-600/25 border border-cyan-500/35 text-cyan-100"
                              : "bg-slate-800/60 border border-slate-700/30 text-slate-200"
                          )}
                        >
                          {msg.content}
                          {msg.isTyping && <span className="animate-pulse">▌</span>}
                        </div>
                        
                        {/* Memory indicator for assistant messages */}
                        {msg.role === 'assistant' && (msg.usedMemory || msg.learnedInsight) && (
                          <div className="flex items-center gap-1.5 mt-1 ml-1">
                            {msg.usedMemory && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-0.5 text-purple-400/70">
                                    <Brain className="w-3 h-3" />
                                    <span className="text-[9px]">Memory</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  Used your reading preferences
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.learnedInsight && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-0.5 text-amber-400/70">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-[9px]">Learned</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs max-w-48">
                                  {msg.learnedInsight}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

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
                  disabled={isLoading || isRecording || isLoadingConversation}
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
    </TooltipProvider>
  );
};

export default FloatingNeuralAssistant;
