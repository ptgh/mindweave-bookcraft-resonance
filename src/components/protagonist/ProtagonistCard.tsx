import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedBookCover from '@/components/EnhancedBookCover';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { AuthorPopup } from '@/components/AuthorPopup';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { gsap } from 'gsap';
import type { ProtagonistBook } from '@/pages/Protagonists';

interface ProtagonistCardProps {
  book: ProtagonistBook;
  onChat: (book: ProtagonistBook) => void;
  onIntroGenerated: (id: number, intro: string) => void;
}

const ProtagonistCard: React.FC<ProtagonistCardProps> = ({ book, onChat, onIntroGenerated }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const authorUnderlineRef = useRef<HTMLSpanElement>(null);
  const titleUnderlineRef = useRef<HTMLSpanElement>(null);
  const protagonistUnderlineRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);

  // Scroll-in GSAP animation for protagonist underline
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            if (protagonistUnderlineRef.current) {
              gsap.fromTo(protagonistUnderlineRef.current,
                { scaleX: 0, transformOrigin: 'left' },
                { scaleX: 1, duration: 0.6, ease: 'power2.out', delay: 0.3 }
              );
              gsap.to(protagonistUnderlineRef.current, {
                scaleX: 0, duration: 0.3, ease: 'power2.in', delay: 1.5
              });
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  // Fire-and-forget: generate intro if missing
  useEffect(() => {
    if (book.protagonist_intro) return;
    const generate = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-protagonist-intro', {
          body: {
            bookTitle: book.title,
            bookAuthor: book.author,
            protagonistName: book.protagonist,
            transmissionId: book.id,
          },
        });
        if (!error && data?.intro) {
          onIntroGenerated(book.id, data.intro);
        }
      } catch (e) {
        console.error('Failed to generate protagonist intro:', e);
      }
    };
    generate();
  }, [book.id, book.protagonist_intro, book.title, book.author, book.protagonist, onIntroGenerated]);

  const handleAuthorClick = async () => {
    try {
      const { data } = await supabase
        .from('scifi_authors')
        .select('*')
        .ilike('name', book.author)
        .maybeSingle();
      if (data) {
        setSelectedAuthor(data as ScifiAuthor);
      } else {
        setSelectedAuthor({
          id: 'temp', name: book.author, created_at: '', updated_at: ''
        } as ScifiAuthor);
      }
      setShowAuthorPopup(true);
    } catch {
      setSelectedAuthor({
        id: 'temp', name: book.author, created_at: '', updated_at: ''
      } as ScifiAuthor);
      setShowAuthorPopup(true);
    }
  };

  const introText = book.protagonist_intro
    || `Step into the world of ${book.title} and speak to ${book.protagonist}.`;

  return (
    <>
      <div
        ref={rootRef}
        className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/30 rounded-lg p-4 shadow-2xl shadow-slate-900/20 transition-all h-full flex flex-col"
      >
        <div className="flex items-start space-x-4 flex-1 mb-3">
          <EnhancedBookCover
            title={book.title}
            author={book.author}
            isbn={book.isbn || undefined}
            coverUrl={book.cover_url || undefined}
            className="w-12 h-16 flex-shrink-0"
            lazy
          />

          <div className="flex-1 min-w-0">
            {/* Title */}
            <button
              onClick={() => setShowPreview(true)}
              className="text-left group relative"
              onMouseEnter={() => {
                if (titleUnderlineRef.current) gsap.to(titleUnderlineRef.current, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
              }}
              onMouseLeave={() => {
                if (titleUnderlineRef.current) gsap.to(titleUnderlineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
              }}
            >
              <span className="relative text-slate-200 font-medium text-sm leading-tight line-clamp-2">
                {book.title}
                <span
                  ref={titleUnderlineRef}
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"
                  style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
                />
              </span>
            </button>

            {/* Author — tight below title */}
            <button
              onClick={handleAuthorClick}
              className="text-left relative mt-0.5 block"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#60a5fa';
                if (authorUnderlineRef.current) gsap.to(authorUnderlineRef.current, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgb(148, 163, 184)';
                if (authorUnderlineRef.current) gsap.to(authorUnderlineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
              }}
              style={{ color: 'rgb(148, 163, 184)', transition: 'color 0.3s ease' }}
            >
              <span className="relative text-xs">
                {book.author}
                <span
                  ref={authorUnderlineRef}
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"
                  style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
                />
              </span>
            </button>

            {/* "Have a conversation with..." label */}
            <p className="mt-2 text-slate-500 text-[10px]">Have a conversation with…</p>

            {/* Protagonist — plain text, violet, GSAP underline, no badge */}
            <button
              onClick={() => onChat(book)}
              className="text-left relative mt-0.5 block group inline-flex items-center gap-1.5"
              onMouseEnter={() => {
                if (protagonistUnderlineRef.current) gsap.to(protagonistUnderlineRef.current, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
              }}
              onMouseLeave={() => {
                if (protagonistUnderlineRef.current) gsap.to(protagonistUnderlineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
              }}
            >
              <MessageCircle className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span className="relative text-violet-300 text-xs font-medium">
                {book.protagonist}
                <span
                  ref={protagonistUnderlineRef}
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400"
                  style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
                />
              </span>
            </button>

            {/* World description */}
            <p className="mt-2 text-slate-500 text-[11px] leading-relaxed line-clamp-3 italic">
              {introText}
            </p>
          </div>
        </div>
      </div>

      {showPreview && (
        <EnhancedBookPreviewModal
          book={{
            id: String(book.id),
            title: book.title,
            author: book.author,
            cover_url: book.cover_url || '',
            isbn: book.isbn || '',
            editorial_note: null,
            penguin_url: null,
            series_id: '',
            created_at: '',
          }}
          onClose={() => setShowPreview(false)}
          onAddBook={() => {}}
        />
      )}

      {showAuthorPopup && (
        <AuthorPopup
          author={selectedAuthor}
          isVisible={showAuthorPopup}
          onClose={() => setShowAuthorPopup(false)}
        />
      )}
    </>
  );
};

export default ProtagonistCard;
