import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Search, BookOpen, Users } from 'lucide-react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import ProtagonistChatModal from '@/components/ProtagonistChatModal';
import ProtagonistCard from '@/components/protagonist/ProtagonistCard';
import ProtagonistPortraitGrid from '@/components/protagonist/ProtagonistPortraitGrid';

export interface ProtagonistBook {
  id: number;
  title: string;
  author: string;
  protagonist: string;
  cover_url: string | null;
  isbn: string | null;
  protagonist_intro: string | null;
  protagonist_portrait_url: string | null;
}

const Protagonists: React.FC = () => {
  const [books, setBooks] = useState<ProtagonistBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatTarget, setChatTarget] = useState<ProtagonistBook | null>(null);
  const [viewMode, setViewMode] = useState<'books' | 'portraits'>('books');

  const updateBookIntro = useCallback((id: number, intro: string) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, protagonist_intro: intro } : b));
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, protagonist, cover_url, isbn, protagonist_intro, protagonist_portrait_url')
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
              Speak to <span className="text-violet-400">Protagonists</span> from Science Fiction
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Step into the worlds of science fiction and have real conversations with iconic characters. They'll stay in character, drawing from the pages of the books that brought them to life.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, author, or character..."
                className="pl-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-violet-400"
              />
            </div>
            <button
              onClick={() => setViewMode(v => v === 'books' ? 'portraits' : 'books')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-all whitespace-nowrap ${
                viewMode === 'portraits'
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
              aria-label="Toggle view"
            >
              {viewMode === 'books' ? <Users className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {viewMode === 'books' ? 'Portraits' : 'Books'}
            </button>
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
                <ProtagonistCard
                  key={book.id}
                  book={book}
                  onChat={setChatTarget}
                  onIntroGenerated={updateBookIntro}
                />
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
          portraitUrl={chatTarget.protagonist_portrait_url}
          onClose={() => setChatTarget(null)}
        />
      )}
    </>
  );
};

export default Protagonists;
