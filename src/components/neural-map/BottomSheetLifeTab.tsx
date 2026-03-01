import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Globe, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrainNode } from '@/pages/TestBrain';

interface BottomSheetLifeTabProps {
  node: BrainNode;
  mode: 'author' | 'protagonist';
  onOpenProtagonistChat?: () => void;
  onViewBook?: (bookTitle: string) => void;
  onViewAuthorLife?: () => void;
}

interface AuthorData {
  name: string;
  bio: string | null;
  nationality: string | null;
  birth_year: number | null;
  death_year: number | null;
  portrait_url: string | null;
  notable_works: string[] | null;
}

const BottomSheetLifeTab = ({ node, mode, onOpenProtagonistChat, onViewBook, onViewAuthorLife }: BottomSheetLifeTabProps) => {
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'author') {
      const fetchAuthor = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('scifi_authors')
          .select('name, bio, nationality, birth_year, death_year, portrait_url, notable_works')
          .eq('name', node.author)
          .maybeSingle();
        setAuthor(data);
        setLoading(false);
      };
      fetchAuthor();
    } else {
      setLoading(false);
    }
  }, [node, mode]);

  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-[200px]">
        <div className="w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
      </div>
    );
  }

  // Protagonist "Story" mode
  if (mode === 'protagonist') {
    return (
      <div ref={containerRef} className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-purple-400/40 overflow-hidden bg-slate-800 flex-shrink-0">
            {node.coverUrl ? (
              <img src={node.coverUrl} alt={node.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400">
                <User className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-slate-100 font-medium text-sm">{node.title}</h4>
            <p className="text-purple-400/70 text-xs">Protagonist</p>
          </div>
        </div>
        {node.bookTitle && (
          <div className="flex items-center gap-2 text-xs text-slate-400/80">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400/60" />
            <span>Appears in{' '}
              <button
                onClick={() => onViewBook?.(node.bookTitle!)}
                className="story-link inline-block"
              >
                <span className="text-cyan-300/80 font-medium hover:text-cyan-200 transition-colors cursor-pointer">"{node.bookTitle}"</span>
              </button>
            </span>
          </div>
        )}
        <p className="text-xs text-slate-400/80">by{' '}
          <button
            onClick={() => onViewAuthorLife?.()}
            className="story-link inline-block"
          >
            <span className="text-amber-300/80 font-medium hover:text-amber-200 transition-colors cursor-pointer">{node.author}</span>
          </button>
        </p>
        {node.description && (
          <div className="space-y-1.5">
            <h5 className="text-[10px] text-slate-400/60 uppercase tracking-wider">Who is {node.title}?</h5>
            <p className="text-xs text-slate-300/70 leading-relaxed border-l-2 border-purple-400/20 pl-3 italic">
              {node.description}
            </p>
          </div>
        )}
        {onOpenProtagonistChat && (
          <button
            onClick={onOpenProtagonistChat}
            className="w-full mt-2 text-xs py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/20 transition-colors"
          >
            Chat with {node.title}
          </button>
        )}
      </div>
    );
  }

  // Author "Life" mode
  return (
    <div ref={containerRef} className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-amber-400/40 overflow-hidden bg-slate-800 flex-shrink-0">
          {author?.portrait_url ? (
            <img src={author.portrait_url} alt={author.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-400">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>
        <div>
          <h4 className="text-slate-100 font-medium text-sm">{author?.name || node.author}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {author?.nationality && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400/70">
                <Globe className="w-3 h-3" /> {author.nationality}
              </span>
            )}
            {author?.birth_year && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400/70">
                <Calendar className="w-3 h-3" />
                {author.birth_year}{author.death_year ? `–${author.death_year}` : '–present'}
              </span>
            )}
          </div>
        </div>
      </div>

      {author?.bio && (
        <p className="text-xs text-slate-300/80 leading-relaxed">
          {author.bio.length > 300 ? author.bio.slice(0, 300) + '…' : author.bio}
        </p>
      )}

      {author?.notable_works && author.notable_works.length > 0 && (
        <div>
          <h5 className="text-[10px] text-slate-400/60 uppercase tracking-wider mb-1.5">Notable Works</h5>
          <div className="flex flex-wrap gap-1">
            {author.notable_works.slice(0, 6).map((work, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] bg-amber-400/10 text-amber-300/80 rounded-full border border-amber-400/15">
                {work}
              </span>
            ))}
          </div>
        </div>
      )}

      {!author && (
        <p className="text-xs text-slate-500/60 italic">No biographical data available for this author yet.</p>
      )}
    </div>
  );
};

export default BottomSheetLifeTab;
