
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import { EnrichedPublisherBook, PublisherSeries } from "@/services/publisherService";

interface PublisherBooksGridProps {
  books: EnrichedPublisherBook[];
  series?: PublisherSeries;
  onAddBook: (book: EnrichedPublisherBook) => void;
  loading?: boolean;
}

const BookCardSkeleton = () => (
  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
    <Skeleton className="w-24 h-32 mx-auto mb-4 rounded-lg bg-slate-800/70" />
    <div className="text-center space-y-2">
      <Skeleton className="h-5 w-3/4 mx-auto bg-slate-700/50" />
      <Skeleton className="h-4 w-1/2 mx-auto bg-slate-700/40" />
      <Skeleton className="h-3 w-1/3 mx-auto bg-slate-700/30" />
      <div className="flex gap-2 justify-center pt-4">
        <Skeleton className="h-8 w-14 rounded-md bg-slate-700/40" />
        <Skeleton className="h-8 w-14 rounded-md bg-slate-700/40" />
        <Skeleton className="h-8 w-14 rounded-md bg-slate-700/40" />
        <Skeleton className="h-8 w-16 rounded-md bg-slate-700/40" />
      </div>
    </div>
  </div>
);

const PublisherBooksGrid = ({ books, series, onAddBook, loading }: PublisherBooksGridProps) => {
  const [visibleBooks, setVisibleBooks] = useState<string[]>([]);

  // Stagger book card animations
  useEffect(() => {
    if (!loading && books.length > 0) {
      setVisibleBooks([]);
      const timeouts: NodeJS.Timeout[] = [];
      
      books.forEach((book, index) => {
        const timeout = setTimeout(() => {
          setVisibleBooks(prev => [...prev, book.id]);
        }, index * 80); // 80ms stagger
        timeouts.push(timeout);
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [books, loading]);

  if (!series) return null;

  if (loading) {
    return (
      <div>
        <div className="mb-8 animate-pulse">
          <Skeleton className="h-8 w-48 mb-3 bg-slate-700/50" />
          <Skeleton className="h-4 w-full max-w-md bg-slate-700/30" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <span className="text-2xl">{series.badge_emoji}</span>
        </div>
        <h3 className="text-slate-300 text-lg font-medium mb-2">No books found</h3>
        <p className="text-slate-400 text-sm">
          This collection is being curated. Check back soon for new additions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <PublisherResonanceBadge series={series} size="md" />
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">{series.description}</p>
      </div>

      {/* Animated transmission grid layout - 3 columns max */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const isVisible = visibleBooks.includes(book.id);
          
          return (
            <div 
              key={book.id} 
              className={`
                bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 
                hover:border-blue-500/30 hover:bg-slate-900/70
                transition-all duration-300 ease-out
                ${isVisible 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
                }
              `}
              style={{ 
                transitionProperty: 'opacity, transform, border-color, background-color',
              }}
            >
              {/* Small book cover with hover effect */}
              <div className="w-24 h-32 bg-slate-800/50 rounded-lg mb-4 overflow-hidden mx-auto group">
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Book info */}
              <div className="text-center space-y-2">
                <h3 className="text-slate-200 font-medium text-base leading-tight line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-slate-400 text-sm">{book.author}</p>
                <p className="text-slate-500 text-xs">Fiction</p>
                
                {/* Action buttons with hover animations */}
                <div className="flex gap-2 justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600/40 text-slate-400 hover:border-blue-500/40 hover:text-blue-400 transition-colors duration-200"
                    onClick={() => onAddBook(book)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm" 
                    className="text-xs border-slate-600/40 text-slate-400 hover:border-green-500/40 hover:text-green-400 transition-colors duration-200"
                  >
                    Keep
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600/40 text-slate-400 hover:border-red-500/40 hover:text-red-400 transition-colors duration-200"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600/40 text-slate-400 hover:border-blue-500/40 hover:text-blue-400 transition-colors duration-200"
                    onClick={() => window.open(book.penguin_url || `https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589`, '_blank')}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublisherBooksGrid;
