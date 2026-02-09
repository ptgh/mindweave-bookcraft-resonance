import React, { useState, useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import ProtagonistChatModal from '@/components/ProtagonistChatModal';

interface ProtagonistBook {
  id: number;
  title: string;
  author: string;
  protagonist: string;
  cover_url: string | null;
}

const Protagonists: React.FC = () => {
  const [books, setBooks] = useState<ProtagonistBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatTarget, setChatTarget] = useState<ProtagonistBook | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, protagonist, cover_url')
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

  const filtered = books.filter(b => {
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
          {/* Hero */}
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

          {/* Search */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, or character..."
              className="pl-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-violet-400"
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-64 bg-slate-800/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-slate-300 mb-2">No protagonists found</h3>
              <p className="text-slate-500 text-sm">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(book => (
                <div
                  key={book.id}
                  className="group bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 flex flex-col"
                >
                  {/* Cover */}
                  <div className="aspect-[2/3] bg-slate-700/30 relative overflow-hidden">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-500 text-xs text-center px-2">{book.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-xs text-slate-400 mb-1">{book.author}</p>
                    <p className="text-xs text-violet-400 mb-3">
                      ✦ {book.protagonist}
                    </p>
                    <button
                      onClick={() => setChatTarget(book)}
                      className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/30 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </button>
                  </div>
                </div>
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
