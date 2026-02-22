import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ProtagonistChatModal from '@/components/ProtagonistChatModal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProtagonistEntry {
  id: number;
  title: string;
  author: string;
  protagonist: string;
  cover_url: string | null;
  protagonist_portrait_url: string | null;
}

const ProtagonistShowcase: React.FC = () => {
  const [entries, setEntries] = useState<ProtagonistEntry[]>([]);
  const [displayed, setDisplayed] = useState<ProtagonistEntry[]>([]);
  const [visibleStates, setVisibleStates] = useState<boolean[]>([true, true, true, true]);
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 1, 2, 3]);
  const [chatTarget, setChatTarget] = useState<ProtagonistEntry | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('transmissions')
        .select('id, title, author, protagonist, cover_url, protagonist_portrait_url')
        .not('protagonist', 'is', null)
        .neq('protagonist', '');

      if (data && data.length >= 4) {
        // Shuffle
        const shuffled = (data as ProtagonistEntry[]).sort(() => Math.random() - 0.5);
        setEntries(shuffled);
        setDisplayed(shuffled.slice(0, 4));
        setCurrentIndices([0, 1, 2, 3]);
      }
    };
    fetch();
  }, []);

  // Rotate cards
  useEffect(() => {
    if (entries.length <= 4) return;

    const rotateCard = (slot: number) => {
      setVisibleStates(prev => { const n = [...prev]; n[slot] = false; return n; });

      setTimeout(() => {
        setCurrentIndices(prev => {
          const next = [...prev];
          let newIdx = (Math.max(...prev) + 1) % entries.length;
          while (prev.includes(newIdx)) newIdx = (newIdx + 1) % entries.length;
          next[slot] = newIdx;
          return next;
        });
        setTimeout(() => {
          setVisibleStates(prev => { const n = [...prev]; n[slot] = true; return n; });
        }, 100);
      }, 500);
    };

    const intervals = [
      setInterval(() => rotateCard(0), 8000 + Math.random() * 4000),
      setInterval(() => rotateCard(1), 10000 + Math.random() * 3000),
      setInterval(() => rotateCard(2), 9000 + Math.random() * 5000),
      setInterval(() => rotateCard(3), 11000 + Math.random() * 3000),
    ];
    return () => intervals.forEach(clearInterval);
  }, [entries.length]);

  useEffect(() => {
    if (entries.length >= 4) {
      setDisplayed(currentIndices.map(i => entries[i]));
    }
  }, [currentIndices, entries]);

  const handleChat = useCallback((entry: ProtagonistEntry) => {
    setChatTarget(entry);
  }, []);

  if (displayed.length < 4) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-medium text-slate-200">Speak to a Protagonist</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayed.map((entry, idx) => (
          <Card
            key={`${entry.id}-${idx}`}
            onClick={() => handleChat(entry)}
            className={`
              relative overflow-hidden cursor-pointer
              bg-slate-800/50 border-slate-700/50 hover:border-violet-500/40
              transition-all duration-500 ease-in-out p-4
              ${visibleStates[idx] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              group
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8 border border-violet-500/30 bg-slate-800 flex-shrink-0">
                {entry.protagonist_portrait_url ? (
                  <AvatarImage src={entry.protagonist_portrait_url} alt={entry.protagonist} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-slate-800 text-violet-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-violet-300 line-clamp-1">
                {entry.protagonist}
              </span>
            </div>
            <h4 className="text-xs text-slate-300 line-clamp-2 mb-1 group-hover:text-violet-200 transition-colors">
              {entry.title}
            </h4>
            <p className="text-[10px] text-slate-500">by {entry.author}</p>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-violet-400/70 group-hover:text-violet-400 transition-colors">
              <MessageCircle className="w-3 h-3" />
              <span>Speak to them</span>
            </div>
          </Card>
        ))}
      </div>

      {chatTarget && (
        <ProtagonistChatModal
          bookTitle={chatTarget.title}
          bookAuthor={chatTarget.author}
          protagonistName={chatTarget.protagonist}
          onClose={() => setChatTarget(null)}
        />
      )}
    </section>
  );
};

export default ProtagonistShowcase;
