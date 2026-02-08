import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrainNode } from '@/pages/TestBrain';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface BottomSheetAskTabProps {
  node: BrainNode;
  allNodes: BrainNode[];
}

const SUGGESTIONS = [
  "What connects this to other books?",
  "What themes does this explore?",
  "What should I read next after this?"
];

const BottomSheetAskTab = ({ node, allNodes }: BottomSheetAskTabProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build scoped context
      const context = `The user is asking about "${node.title}" by ${node.author}. ` +
        `Tags: ${node.tags.join(', ')}. ` +
        (node.description ? `Notes: ${node.description}. ` : '') +
        `This book is part of a neural map with ${allNodes.length} books total.`;

      const { data, error } = await supabase.functions.invoke('brain-chat', {
        body: {
          message: text,
          scopedContext: context,
          brainData: {
            nodes: allNodes.slice(0, 20).map(n => ({
              id: n.id, title: n.title, author: n.author, tags: n.tags
            })),
            links: [],
            activeFilters: []
          }
        }
      });

      const responseText = data?.response || data?.error || 'No response received.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: responseText, isUser: false }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Failed to get a response. Please try again.',
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[300px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400/70 text-center mb-3">
              Ask about <span className="text-cyan-400/80">{node.title}</span>
            </p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs p-2 rounded-lg bg-cyan-400/5 border border-cyan-400/10 text-slate-300/80 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-colors"
              >
                <Sparkles className="w-3 h-3 inline mr-1.5 text-cyan-400/60" />
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`text-xs p-2 rounded-lg max-w-[90%] ${
            msg.isUser
              ? 'ml-auto bg-cyan-600/30 text-slate-200 border border-cyan-400/20'
              : 'bg-slate-800/40 text-slate-300/90 border border-slate-700/30'
          }`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="text-xs text-slate-500/60 flex items-center gap-1.5 p-2">
            <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cyan-400/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder={`Ask about ${node.title}...`}
            className="flex-1 text-xs bg-slate-800/30 border border-cyan-400/15 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500/50 focus:outline-none focus:border-cyan-400/30"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-lg bg-cyan-600/40 text-cyan-300 hover:bg-cyan-600/60 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomSheetAskTab;
