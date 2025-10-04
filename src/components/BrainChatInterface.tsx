
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrainNode, BookLink } from '@/pages/TestBrain';
import { BrainContextService } from '@/services/brainContextService';

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
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
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

      // Create the payload and test it
      const payload = {
        message: inputText,
        brainData: {
          ...cleanData,
          activeFilters: Array.isArray(activeFilters) ? activeFilters : []
        }
      };

      // Final serialization test
      try {
        JSON.stringify(payload);
        console.log('Final payload serialization test passed');
      } catch (finalSerError) {
        console.error('Final payload serialization failed:', finalSerError);
        throw new Error('Payload contains non-serializable data');
      }

      console.log('Calling supabase function with payload size:', JSON.stringify(payload).length, 'characters');

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
        throw new Error(data.error);
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

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-12 z-30 bg-background/95 hover:bg-accent/80 border border-primary/30 backdrop-blur-md text-primary shadow-lg shadow-primary/20 rounded-full p-4 transition-all duration-300 hover:scale-110 hover:shadow-primary/40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-12 z-30 w-96 h-[600px] flex flex-col">
      
      <Card className="bg-background/98 border-primary/30 backdrop-blur-xl h-full flex flex-col shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-accent/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
            <span className="text-foreground font-medium">Neural Assistant</span>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-primary/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary/60 bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-foreground/80 text-sm mb-4">
                Ask me about your reading network, thematic connections, or book recommendations!
              </p>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left text-xs text-foreground/70 hover:text-foreground p-2 rounded border border-primary/30 hover:border-primary/50 bg-accent/20 hover:bg-accent/40 transition-all"
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
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-primary/20 text-foreground border border-primary/40 shadow-md shadow-primary/10'
                    : message.isError
                    ? 'bg-destructive/20 text-destructive-foreground border border-destructive/50'
                    : 'bg-accent/40 text-foreground border border-primary/30'
                }`}
              >
                {message.isError && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive text-xs font-medium">Error</span>
                  </div>
                )}
                {message.text}
                {message.highlights && (message.highlights.nodeIds.length > 0 || message.highlights.tags.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-border/20">
                    <div className="text-xs text-muted-foreground">
                      Highlighted: {message.highlights.nodeIds.length} books, {message.highlights.tags.length} themes
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-accent/40 border border-primary/30 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/50" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/50" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/50" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-primary/20 bg-accent/20">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your reading network..."
              className="flex-1 bg-background/60 border border-primary/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              size="icon"
              className="bg-primary/20 hover:bg-primary/30 border border-primary/50 text-foreground hover:shadow-md hover:shadow-primary/20 disabled:opacity-50 transition-all"
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
