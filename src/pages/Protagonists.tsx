import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import ProtagonistChatModal from '@/components/ProtagonistChatModal';
import EnhancedBookCover from '@/components/EnhancedBookCover';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { AuthorPopup } from '@/components/AuthorPopup';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { gsap } from 'gsap';

interface ProtagonistBook {
  id: number;
  title: string;
  author: string;
  protagonist: string;
  cover_url: string | null;
  isbn: string | null;
}

const ProtagonistCard: React.FC<{
  book: ProtagonistBook;
  onChat: (book: ProtagonistBook) => void;
}> = ({ book, onChat }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const authorUnderlineRef = useRef<HTMLSpanElement>(null);
  const titleUnderlineRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            if (authorUnderlineRef.current) {
              gsap.fromTo(authorUnderlineRef.current,
                { scaleX: 0, transformOrigin: 'left' },
                { scaleX: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 }
              );
              gsap.to(authorUnderlineRef.current, {
                scaleX: 0, duration: 0.3, ease: 'power2.in', delay: 1.4
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

  return (
    <>
      <div
        ref={rootRef}
        className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/30 rounded-lg p-4 shadow-2xl shadow-slate-900/20 transition-all h-full flex flex-col"
      >
        {/* Top row: cover + info (matches BookCard) */}
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
            {/* Title — actionable */}
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

            {/* Author — actionable with GSAP underline */}
            <button
              onClick={handleAuthorClick}
              className="text-left relative mt-0.5"
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

            {/* Protagonist — hero element */}
            <div className="mt-1.5 px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20 inline-flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span className="text-violet-300 text-xs font-medium line-clamp-1">
                {book.protagonist}
              </span>
            </div>
          </div>
        </div>

        {/* Chat button */}
        <button
          onClick={() => onChat(book)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/25 hover:border-violet-400/50 transition-all duration-300 touch-manipulation active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Speak to {book.protagonist.split(' ')[0]}
        </button>
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

const Protagonists: React.FC = () => {
  const [books, setBooks] = useState<ProtagonistBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatTarget, setChatTarget] = useState<ProtagonistBook | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, protagonist, cover_url, isbn')
        .not('protagonist', 'is', null)
        .neq('protagonist', '')
        .order('title');

      if (!error && data) {
        setBooks(data as ProtagonistBook[]);
      }
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const dedupedBooks = books.filter((b, i, arr) =>
    arr.findIndex(x => x.title.toLowerCase() === b.title.toLowerCase()) === i
  );

  const filtered = dedupedBooks.filter(b => {
    const q = search.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.protagonist.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  return (
    <>
      <SEOHead
        title="Speak to Protagonist - Leafnode"
        description="Chat with characters from science fiction literature. Select a book and speak directly to its protagonist."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />

        <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <MessageCircle className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-400">Speak to Protagonist</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-light text-slate-200 mb-3">
              Chat with <span className="text-violet-400">Characters</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Select a book and have a conversation with its protagonist. They'll stay in character, within their story's world.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, or character..."
              className="pl-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-violet-400"
            />
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-slate-300 mb-2">No protagonists found</h3>
              <p className="text-slate-500 text-sm">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(book => (
                <ProtagonistCard key={book.id} book={book} onChat={setChatTarget} />
              ))}
            </div>
          )}

          <p className="text-center text-slate-500 text-xs mt-8">
            {filtered.length} protagonist{filtered.length !== 1 ? 's' : ''} available
          </p>
        </main>
      </div>

      {chatTarget && (
        <ProtagonistChatModal
          bookTitle={chatTarget.title}
          bookAuthor={chatTarget.author}
          protagonistName={chatTarget.protagonist}
          onClose={() => setChatTarget(null)}
        />
      )}
    </>
  );
};

export default Protagonists;
