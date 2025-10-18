
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrainNode, BookLink } from '@/pages/TestBrain';
import { BrainContextService } from '@/services/brainContextService';
import { useIsMobile } from '@/hooks/use-mobile';
import { Transmission } from '@/services/transmissionsService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  highlights?: {
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  };
  isError?: boolean;
  errorCode?: string;
}

interface BrainChatInterfaceProps {
  nodes: BrainNode[];
  links: BookLink[];
  activeFilters: string[];
  onHighlight?: (highlights: { nodeIds: string[]; linkIds: string[]; tags: string[] }) => void;
}

const BrainChatInterface: React.FC<BrainChatInterfaceProps> = ({
  nodes,
  links,
  activeFilters,
  onHighlight
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userTransmissions, setUserTransmissions] = useState<Transmission[]>([]);
  const [isFetchingTransmissions, setIsFetchingTransmissions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Fetch user's transmissions when chat opens
  useEffect(() => {
    const fetchTransmissions = async () => {
      if (isOpen && userTransmissions.length === 0 && !isFetchingTransmissions) {
        setIsFetchingTransmissions(true);
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const { data, error } = await supabase
              .from('transmissions')
              .select('*')
              .eq('user_id', userData.user.id)
              .order('created_at', { ascending: false });

            if (!error && data) {
              // Map database records to Transmission format
              const mappedData = data.map((record: any) => ({
                id: record.id,
                title: record.title || '',
                author: record.author || '',
                status: 'read' as const,
                tags: typeof record.tags === 'string' ? JSON.parse(record.tags || '[]') : (record.tags || []),
                notes: record.notes || '',
                cover_url: record.cover_url || '',
                rating: typeof record.resonance_labels === 'string' ? JSON.parse(record.resonance_labels || '{}') : (record.resonance_labels || {}),
                user_id: record.user_id,
                created_at: record.created_at,
                publisher_series_id: record.publisher_series_id,
                isbn: record.isbn,
                apple_link: record.apple_link,
                open_count: record.open_count,
                publication_year: record.publication_year,
                narrative_time_period: record.narrative_time_period,
                historical_context_tags: record.historical_context_tags || [],
                is_favorite: record.is_favorite
              }));
              setUserTransmissions(mappedData);
              console.log('Fetched user transmissions:', mappedData.length);
            }
          }
        } catch (error) {
          console.error('Failed to fetch transmissions:', error);
        } finally {
          setIsFetchingTransmissions(false);
        }
      }
    };

    fetchTransmissions();
  }, [isOpen]);

  // Initialize or retrieve conversation when chat opens
  useEffect(() => {
    const initConversation = async () => {
      if (isOpen && !conversationId) {
        try {
          // Create a new conversation
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const { data, error } = await supabase
              .from('chat_conversations')
              .insert({
                user_id: userData.user.id,
                title: 'Neural Map Chat'
              })
              .select()
              .single();

            if (!error && data) {
              setConversationId(data.id);
              console.log('Created new conversation:', data.id);
            }
          }
        } catch (error) {
          console.error('Failed to create conversation:', error);
          // Continue without conversation storage if it fails
        }
      }
    };

    initConversation();
  }, [isOpen, conversationId]);
  // Generate suggestions when brain data changes
  useEffect(() => {
    if (nodes.length > 0) {
      const analysis = BrainContextService.analyzeBrainData(nodes, links);
      setSuggestions(BrainContextService.generateQuerySuggestions(analysis));
    }
  }, [nodes, links]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened (only on desktop, not mobile)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Check if it's a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        // Small delay to ensure animation completes
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    }
  }, [isOpen]);

  // Clean data to avoid circular references with deep cleaning
  const cleanBrainData = (nodes: BrainNode[], links: BookLink[]) => {
    console.log('Original nodes length:', nodes.length);
    console.log('Original links length:', links.length);
    
    try {
      // Create completely clean node objects with only serializable data
      const cleanNodes = nodes.map(node => {
        const cleanNode = {
          id: String(node.id || ''),
          title: String(node.title || ''),
          author: String(node.author || ''),
          tags: Array.isArray(node.tags) ? node.tags.filter(tag => typeof tag === 'string') : [],
          contextTags: Array.isArray(node.contextTags) ? node.contextTags.filter(tag => typeof tag === 'string') : [],
          transmissionId: node.transmissionId ? Number(node.transmissionId) : undefined,
          x: typeof node.x === 'number' ? node.x : undefined,
          y: typeof node.y === 'number' ? node.y : undefined,
          coverUrl: typeof node.coverUrl === 'string' ? node.coverUrl : undefined,
          description: typeof node.description === 'string' ? node.description : undefined
        };
        
        // Remove undefined values
        Object.keys(cleanNode).forEach(key => {
          if (cleanNode[key] === undefined) {
            delete cleanNode[key];
          }
        });
        
        return cleanNode;
      });

      // Create completely clean link objects
      const cleanLinks = links.map(link => {
        const cleanLink = {
          fromId: String(link.fromId || ''),
          toId: String(link.toId || ''),
          type: String(link.type || ''),
          strength: typeof link.strength === 'number' ? link.strength : 1,
          sharedTags: Array.isArray(link.sharedTags) ? link.sharedTags.filter(tag => typeof tag === 'string') : [],
          connectionReason: typeof link.connectionReason === 'string' ? link.connectionReason : undefined
        };
        
        // Remove undefined values
        Object.keys(cleanLink).forEach(key => {
          if (cleanLink[key] === undefined) {
            delete cleanLink[key];
          }
        });
        
        return cleanLink;
      });

      console.log('Cleaned nodes length:', cleanNodes.length);
      console.log('Cleaned links length:', cleanLinks.length);
      
      // Test serialization before returning
      try {
        JSON.stringify({ nodes: cleanNodes, links: cleanLinks });
        console.log('Serialization test passed');
      } catch (serError) {
        console.error('Serialization test failed:', serError);
        throw new Error('Data still contains circular references after cleaning');
      }

      return { nodes: cleanNodes, links: cleanLinks };
    } catch (error) {
      console.error('Error cleaning brain data:', error);
      // Return minimal safe data structure
      return { 
        nodes: [], 
        links: []
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      console.log('Preparing to send message to brain-chat function');
      console.log('Input message:', inputText);
      console.log('Original data counts - nodes:', nodes.length, 'links:', links.length);

      // Clean the brain data to avoid circular references
      const cleanData = cleanBrainData(nodes, links);
      console.log('Cleaned data counts - nodes:', cleanData.nodes.length, 'links:', cleanData.links.length);

      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Create the payload and test it
      const payload = {
        message: inputText,
        conversationId: conversationId || undefined,
        messages: conversationHistory,
        brainData: {
          ...cleanData,
          activeFilters: Array.isArray(activeFilters) ? activeFilters : []
        },
        userTransmissions: userTransmissions.map(t => ({
          id: t.id,
          title: t.title,
          author: t.author,
          tags: Array.isArray(t.tags) ? t.tags.join(', ') : '',
          notes: t.notes,
          publication_year: t.publication_year,
          narrative_time_period: t.narrative_time_period,
          historical_context_tags: t.historical_context_tags
        }))
      };

      console.log('Calling supabase function with conversation history:', conversationHistory.length, 'messages');

      const { data, error } = await supabase.functions.invoke('brain-chat', {
        body: payload
      });

      console.log('Response received:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        
        // Handle specific error codes
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.error,
          isUser: false,
          timestamp: new Date(),
          isError: true,
          errorCode: data.errorCode
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      if (!data?.response) {
        console.error('No response in data:', data);
        throw new Error('No response received from AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        highlights: data.highlights
      };

      setMessages(prev => [...prev, aiMessage]);

      // Trigger highlights if callback provided
      if (data.highlights && onHighlight) {
        onHighlight(data.highlights);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        isUser: false,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputText(suggestion);
    
    // Auto-send the suggestion
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const cleanData = cleanBrainData(nodes, links);
      
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      const payload = {
        message: suggestion,
        conversationId: conversationId || undefined,
        messages: conversationHistory,
        brainData: {
          ...cleanData,
          activeFilters: Array.isArray(activeFilters) ? activeFilters : []
        },
        userTransmissions: userTransmissions.map(t => ({
          id: t.id,
          title: t.title,
          author: t.author,
          tags: Array.isArray(t.tags) ? t.tags.join(', ') : '',
          notes: t.notes,
          publication_year: t.publication_year,
          narrative_time_period: t.narrative_time_period,
          historical_context_tags: t.historical_context_tags
        }))
      };

      const { data, error } = await supabase.functions.invoke('brain-chat', {
        body: payload
      });

      if (error) throw new Error(`Function call failed: ${error.message}`);
      
      if (data?.error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.error,
          isUser: false,
          timestamp: new Date(),
          isError: true,
          errorCode: data.errorCode
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }
      
      if (!data?.response) throw new Error('No response received from AI');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        highlights: data.highlights
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.highlights && onHighlight) {
        onHighlight(data.highlights);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        isUser: false,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-12 z-30 bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/30 backdrop-blur-lg text-cyan-400 shadow-lg shadow-slate-900/20 rounded-full p-4 transition-all duration-300 hover:scale-110 hover:border-cyan-400/50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className="fixed top-20 md:top-auto md:bottom-20 right-4 md:right-12 z-30 w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-11rem)] md:h-[600px] flex flex-col animate-slide-up"
      style={isMobile ? {
        top: 'calc(env(safe-area-inset-top) + 64px)',
        height: 'calc(100dvh - (env(safe-area-inset-top) + env(safe-area-inset-bottom) + 88px))'
      } : undefined}
    >
      
      <Card className="bg-slate-900/95 md:bg-slate-900/60 border-slate-700/30 backdrop-blur-lg h-full flex flex-col shadow-2xl shadow-slate-900/20 safe-area-inset">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/30 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
            <div className="flex flex-col">
              <span className="text-slate-200 font-medium text-xs">Neural Assistant</span>
              <span className="text-slate-400 text-[9px]">Powered by Gemini 2.5 • FREE until Oct 6</span>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-cyan-400/60 bg-cyan-400/10 flex items-center justify-center shadow-lg shadow-cyan-400/20">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-slate-300 text-xs mb-3">
                Ask me about your reading network, thematic connections, or book recommendations!
              </p>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left text-xs text-slate-300 hover:text-cyan-300 p-2 rounded border border-slate-700/40 hover:border-cyan-400/60 bg-slate-800/30 hover:bg-slate-800/50 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2.5 rounded-lg text-xs whitespace-pre-line ${
                  message.isUser
                    ? 'bg-cyan-500/20 border border-cyan-400/30 text-slate-200'
                    : message.isError
                    ? 'bg-red-500/10 border border-red-400/30 text-slate-300'
                    : 'bg-slate-800/60 border border-slate-700/30 text-slate-200'
                }`}
              >
                {message.isError && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 text-[10px] font-medium">
                      {message.errorCode === 'RATE_LIMIT' && 'Rate Limit Exceeded'}
                      {message.errorCode === 'NO_CREDITS' && 'AI Credits Depleted'}
                      {!message.errorCode && 'Error'}
                    </span>
                  </div>
                )}
                {message.text}
                {message.highlights && (message.highlights.nodeIds.length > 0 || message.highlights.tags.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-cyan-400/20">
                    <div className="text-[10px] text-cyan-300">
                      Highlighted: {message.highlights.nodeIds.length} books, {message.highlights.tags.length} themes
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/60 border border-slate-700/30 rounded-lg p-2.5">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-sm shadow-cyan-400/50" />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-sm shadow-cyan-400/50" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-sm shadow-cyan-400/50" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 pb-safe border-t border-slate-700/30 bg-slate-800/40">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your reading network..."
              className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg px-3 py-2 text-xs md:text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 touch-manipulation"
              disabled={isLoading}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              size="icon"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BrainChatInterface;
