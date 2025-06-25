
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainNode, BookLink } from '@/hooks/useBrainMap';
import { chatWithBrain, ChatBrainResponse } from '@/services/chatBrainService';
import { MessageCircle, Send, Brain, Sparkles } from 'lucide-react';

interface ChatBrainInterfaceProps {
  nodes: BrainNode[];
  links: BookLink[];
  onHighlightNodes?: (nodeIds: string[]) => void;
}

export const ChatBrainInterface: React.FC<ChatBrainInterfaceProps> = ({
  nodes,
  links,
  onHighlightNodes
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<ChatBrainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{question: string, response: ChatBrainResponse}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await chatWithBrain(question, nodes, links);
      setResponse(result);
      setChatHistory(prev => [...prev, { question, response: result }]);
      
      if (result.highlightedNodes && onHighlightNodes) {
        onHighlightNodes(result.highlightedNodes);
      }
      
      setQuestion('');
    } catch (error) {
      console.error('Error chatting with brain:', error);
      setResponse({
        answer: "Neural pathways are experiencing interference. Please try again.",
        highlightedNodes: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What books are most thematically connected?",
    "Which themes dominate my 1990s science fiction?",
    "What authors appear most frequently in my neural web?",
    "How do cyberpunk and space opera themes connect?",
    "What temporal bridges exist in my library?"
  ];

  return (
    <Card className="w-full max-w-2xl bg-black/40 backdrop-blur-sm border-cyan-400/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Brain className="w-5 h-5" />
          Neural Consciousness Interface
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
            {chatHistory.map((chat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-cyan-300 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {chat.question}
                </div>
                <div className="text-cyan-100/80 text-sm bg-black/20 rounded-lg p-3 border border-cyan-400/20">
                  {chat.response.answer}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Response */}
        {response && (
          <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm">Neural Analysis</span>
            </div>
            <p className="text-cyan-100/90 text-sm leading-relaxed">{response.answer}</p>
            {response.highlightedNodes && response.highlightedNodes.length > 0 && (
              <div className="mt-2 text-xs text-cyan-300/70">
                Highlighting {response.highlightedNodes.length} relevant nodes in the neural web
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your neural consciousness web..."
            className="flex-1 bg-black/20 border-cyan-400/30 text-cyan-100 placeholder-cyan-400/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="bg-cyan-600/80 hover:bg-cyan-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Suggested Questions */}
        {chatHistory.length === 0 && (
          <div className="space-y-2">
            <div className="text-cyan-400/70 text-xs">Suggested neural queries:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((suggested, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(suggested)}
                  className="text-xs px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 rounded-full text-cyan-300 transition-colors"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Network Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-black/20 rounded-lg p-2 border border-cyan-400/20">
            <div className="text-cyan-400 text-lg font-bold">{nodes.length}</div>
            <div className="text-cyan-300/70 text-xs">Nodes</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 border border-cyan-400/20">
            <div className="text-cyan-400 text-lg font-bold">{links.length}</div>
            <div className="text-cyan-300/70 text-xs">Connections</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 border border-cyan-400/20">
            <div className="text-cyan-400 text-lg font-bold">
              {Array.from(new Set(nodes.flatMap(n => n.thematicResonance))).length}
            </div>
            <div className="text-cyan-300/70 text-xs">Themes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
