import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import EnhancedBookCover from '@/components/EnhancedBookCover';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { AuthorPopup } from '@/components/AuthorPopup';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxDragStart = useRef(0);
  const lightboxDragY = useRef(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [showPortraitLightbox, setShowPortraitLightbox] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(book.protagonist_portrait_url || null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [portraitBroken, setPortraitBroken] = useState(false);

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

  // Fire-and-forget: generate portrait if missing or broken
  useEffect(() => {
    if ((portraitUrl && !portraitBroken) || isGeneratingPortrait) return;
    setIsGeneratingPortrait(true);
    const generate = async () => {
      try {
        if (portraitBroken && portraitUrl) {
          await supabase
            .from('transmissions')
            .update({ protagonist_portrait_url: null })
            .eq('id', book.id);
          setPortraitUrl(null);
          setPortraitBroken(false);
        }

        const { data, error } = await supabase.functions.invoke('generate-protagonist-portrait', {
          body: {
            bookTitle: book.title,
            bookAuthor: book.author,
            protagonistName: book.protagonist,
            transmissionId: book.id,
          },
        });
        if (!error && data?.portraitUrl) {
          setPortraitUrl(data.portraitUrl);
        }
      } catch (e) {
        console.error('Failed to generate protagonist portrait:', e);
      } finally {
        setIsGeneratingPortrait(false);
      }
    };
    generate();
  }, [book.id, portraitUrl, portraitBroken, isGeneratingPortrait, book.title, book.author, book.protagonist]);

  const handlePortraitError = () => {
    setPortraitBroken(true);
  };

  // Lightbox swipe-to-dismiss
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    lightboxDragStart.current = e.touches[0].clientY;
  };
  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (!lightboxRef.current) return;
    const delta = e.touches[0].clientY - lightboxDragStart.current;
    lightboxDragY.current = delta;
    if (delta > 0) {
      lightboxRef.current.style.transform = `translateY(${delta}px)`;
      lightboxRef.current.style.transition = 'none';
    }
  };
  const handleLightboxTouchEnd = () => {
    if (!lightboxRef.current) return;
    if (lightboxDragY.current > 80) {
      setShowPortraitLightbox(false);
    } else {
      lightboxRef.current.style.transform = 'translateY(0)';
      lightboxRef.current.style.transition = 'transform 0.3s ease';
    }
    lightboxDragY.current = 0;
  };

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
        setSelectedAuthor({ id: 'temp', name: book.author, created_at: '', updated_at: '' } as ScifiAuthor);
      }
      setShowAuthorPopup(true);
    } catch {
      setSelectedAuthor({ id: 'temp', name: book.author, created_at: '', updated_at: '' } as ScifiAuthor);
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
            {/* Title + Author on same line */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
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
                <span className="relative text-slate-200 font-medium text-sm leading-tight">
                  {book.title}
                  <span
                    ref={titleUnderlineRef}
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"
                    style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
                  />
                </span>
              </button>
              <span className="text-slate-600 text-xs">·</span>
              <button
                onClick={handleAuthorClick}
                className="text-left relative"
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
            </div>

            {/* "Have a conversation with..." label */}
            <p className="mt-2 text-slate-500 text-[10px]">Have a conversation with…</p>

            {/* Protagonist — portrait opens lightbox, name text opens chat directly */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {isGeneratingPortrait ? (
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              ) : (
                <button
                  onClick={() =>
                    portraitUrl && !portraitBroken
                      ? setShowPortraitLightbox(true)
                      : onChat(book)
                  }
                  className="flex-shrink-0 focus:outline-none"
                  aria-label={`View ${book.protagonist}`}
                >
                  <Avatar className="h-6 w-6 border border-violet-500/30 shadow-md shadow-violet-500/20 hover:ring-2 hover:ring-violet-400/50 transition-all">
                    {portraitUrl && !portraitBroken ? (
                      <AvatarImage
                        src={portraitUrl}
                        alt={book.protagonist}
                        className="object-cover"
                        onError={handlePortraitError}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-800 text-violet-400">
                      <MessageCircle className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              )}
              <button
                onClick={() => onChat(book)}
                className="text-left relative group"
                onMouseEnter={() => {
                  if (protagonistUnderlineRef.current) gsap.to(protagonistUnderlineRef.current, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
                }}
                onMouseLeave={() => {
                  if (protagonistUnderlineRef.current) gsap.to(protagonistUnderlineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
                }}
              >
                <span className="relative text-violet-300 text-xs font-medium">
                  {book.protagonist}
                  <span
                    ref={protagonistUnderlineRef}
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400"
                    style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
                  />
                </span>
              </button>
            </div>

            {/* World description */}
            <p className="mt-2 text-slate-500 text-[11px] leading-relaxed line-clamp-3 italic">
              {introText}
            </p>
          </div>
        </div>
      </div>

      {/* Portrait Lightbox — tap portrait to begin chat, swipe down to dismiss */}
      {showPortraitLightbox && portraitUrl && !portraitBroken && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998] flex items-center justify-center"
          onClick={() => setShowPortraitLightbox(false)}
        >
          <div
            ref={lightboxRef}
            className="flex flex-col items-center px-6"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            {/* Drag pill */}
            <div className="w-10 h-1 rounded-full bg-slate-600 mb-6" />

            {/* Portrait — tap to start chat */}
            <button
              onClick={() => { setShowPortraitLightbox(false); onChat(book); }}
              className="group relative focus:outline-none"
              aria-label={`Start conversation with ${book.protagonist}`}
            >
              <img
                src={portraitUrl}
                alt={book.protagonist}
                className="w-56 h-56 sm:w-72 sm:h-72 rounded-full object-cover border-2 border-violet-500/40 shadow-2xl shadow-violet-500/30 group-hover:border-violet-400/70 group-active:scale-95 transition-all duration-200"
              />
              {/* Hover hint */}
              <div className="absolute inset-0 rounded-full flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-violet-200 text-xs font-medium bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                  Begin conversation
                </span>
              </div>
            </button>

            <h3 className="mt-5 text-lg font-medium text-slate-100">{book.protagonist}</h3>
            <p className="text-sm text-slate-400 mt-1">{book.title} · {book.author}</p>
            <p className="text-xs text-violet-400/60 mt-3">Tap to speak · Swipe down to close</p>
          </div>
        </div>,
        document.body
      )}

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
