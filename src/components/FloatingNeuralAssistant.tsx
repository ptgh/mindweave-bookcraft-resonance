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
import { gsap } from 'gsap';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useChatPersistence, PersistedMessage } from '@/hooks/useChatPersistence';

// Message type re-exported from persistence hook
type Message = PersistedMessage;

interface FloatingNeuralAssistantProps {
  className?: string;
}

export const FloatingNeuralAssistant: React.FC<FloatingNeuralAssistantProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userTransmissions, setUserTransmissions] = useState<any[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInsights, setUserInsights] = useState<string | null>(null);
  const [hasActiveMemory, setHasActiveMemory] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const pageContext = usePageContext();
  const location = useLocation();

  // Extracted hooks for persistence and voice
  const {
    messages, setMessages,
    conversationId,
    isLoadingConversation,
    showQuickActions, setShowQuickActions,
    saveMessage: saveMessageToDb,
    clearConversation: handleClearConversation,
  } = useChatPersistence({ userId: user?.id, isOpen });

  const sendMessageRef = useRef<((text: string) => void) | null>(null);
  const {
    isRecording, isSpeaking, voiceEnabled,
    startRecording, stopRecording, speakText, toggleVoice,
  } = useVoiceChat({
    onTranscription: (text) => sendMessageRef.current?.(text),
  });

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

  // (Conversation persistence now handled by useChatPersistence hook)
  
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

  // GSAP pulse animation for chat panel border
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Subtle pulse on panel border
      gsap.to(panelRef.current, {
        boxShadow: '0 0 20px rgba(34, 211, 238, 0.15), 0 0 40px rgba(34, 211, 238, 0.05)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      
      // Input glow animation
      const inputEl = panelRef.current.querySelector('.input-glow');
      if (inputEl) {
        gsap.to(inputEl, {
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.3), inset 0 0 4px rgba(34, 211, 238, 0.1)',
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    }
    
    return () => {
      if (panelRef.current) {
        gsap.killTweensOf(panelRef.current);
        const inputEl = panelRef.current.querySelector('.input-glow');
        if (inputEl) gsap.killTweensOf(inputEl);
      }
    };
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

  // (Message saving now handled by useChatPersistence hook)

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
      const aiContent = data.reply || data.response || data.message || 'I apologize, but I encountered an issue processing your request.';
      
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

  // Wire sendMessage ref for voice transcription callback
  sendMessageRef.current = sendMessage;

  // (Voice input/output now handled by useVoiceChat hook)
  // (Conversation clearing now handled by useChatPersistence hook)

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

  return (
    <TooltipProvider>
      <div className={cn("fixed z-50", isOpen ? "inset-0 md:inset-auto md:bottom-6 md:right-6" : "bottom-6 right-6", className)}>
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

        {/* Chat Panel - full-screen on mobile, floating on desktop */}
        {isOpen && (
          <div 
            ref={panelRef}
            className="chat-panel-glow bg-slate-900/85 backdrop-blur-xl border border-cyan-400/30 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 flex flex-col w-full h-full md:w-96 md:h-[520px] md:rounded-2xl"
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
                  onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
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
                  className="input-glow flex-1 bg-slate-900/60 border-cyan-500/40 focus:border-cyan-400/70 text-slate-100 placeholder:text-slate-500 text-sm h-11"
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
