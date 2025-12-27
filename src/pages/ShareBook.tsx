import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, User } from 'lucide-react';
import { getSocialShareImageUrl } from '@/utils/performance';

interface BookData {
  id: number;
  title: string | null;
  author: string | null;
  cover_url: string | null;
  notes: string | null;
  tags: string | null;
}

export default function ShareBook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBook() {
      if (!id) {
        setError('No book ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('transmissions')
          .select('id, title, author, cover_url, notes, tags')
          .eq('id', parseInt(id))
          .single();

        if (fetchError || !data) {
          setError('Book not found');
          setLoading(false);
          return;
        }

        setBook(data);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Book Not Found</h1>
          <p className="text-slate-400 mb-6">
            {error || 'The book you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Leafnode
          </Button>
        </div>
      </div>
    );
  }

  const title = book.title || 'Untitled Book';
  const author = book.author || 'Unknown Author';
  const coverUrl = book.cover_url ? getSocialShareImageUrl(book.cover_url) : '/og-image.jpg';
  const description = book.notes 
    ? `${book.notes.substring(0, 150)}...` 
    : `Discover "${title}" by ${author} on Leafnode - your personal sci-fi reading companion.`;

  return (
    <>
      <SEOHead
        title={`${title} by ${author}`}
        description={description}
        image={coverUrl}
        type="book"
        canonical={`https://www.leafnode.co.uk/share/book/${book.id}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Book Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Cover */}
            {book.cover_url && (
              <div className="aspect-[2/3] max-h-[400px] w-full flex items-center justify-center bg-slate-900/50 p-8">
                <img
                  src={coverUrl}
                  alt={`Cover of ${title}`}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                  loading="eager"
                />
              </div>
            )}
            
            {/* Info */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-slate-100 mb-2">{title}</h1>
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <User className="w-4 h-4" />
                <span>{author}</span>
              </div>
              
              {book.notes && (
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {book.notes}
                </p>
              )}
              
              {book.tags && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {book.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 border border-slate-600"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="default"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explore Leafnode
              </Button>
            </div>
          </div>
          
          {/* Branding */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Shared via <span className="text-slate-400">Leafnode</span> - Your Personal Sci-Fi Library
          </p>
        </div>
      </div>
    </>
  );
}
