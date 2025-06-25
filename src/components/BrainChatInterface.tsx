
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
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
      console.log('Sending message to brain-chat function:', {
        message: inputText,
        nodeCount: nodes.length,
        linkCount: links.length
      });

      const { data, error } = await supabase.functions.invoke('brain-chat', {
        body: {
          message: inputText,
          brainData: {
            nodes,
            links,
            activeFilters
          }
        }
      });

      console.log('Response from brain-chat function:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data.response) {
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
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        isUser: false,
        timestamp: new Date()
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
        className="fixed bottom-6 right-6 z-30 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 backdrop-blur-sm text-cyan-400 rounded-full p-4 transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-96 h-[600px] flex flex-col">
      <Card className="bg-slate-900/95 border-cyan-400/30 backdrop-blur-sm h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-400/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-cyan-400 font-medium">Neural Assistant</span>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400/50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-cyan-400/70 text-sm mb-4">
                Ask me about your reading network, thematic connections, or book recommendations!
              </p>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left text-xs text-cyan-400/60 hover:text-cyan-400 p-2 rounded border border-cyan-400/20 hover:border-cyan-400/40 transition-colors"
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
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/30'
                    : 'bg-slate-800/50 text-slate-200 border border-slate-600/30'
                }`}
              >
                {message.text}
                {message.highlights && (message.highlights.nodeIds.length > 0 || message.highlights.tags.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-slate-600/30">
                    <div className="text-xs text-cyan-400/70">
                      Highlighted: {message.highlights.nodeIds.length} books, {message.highlights.tags.length} themes
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cyan-400/20">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your reading network..."
              className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              size="icon"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-400 disabled:opacity-50"
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
