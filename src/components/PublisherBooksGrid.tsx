
import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import { EnrichedPublisherBook, PublisherSeries } from "@/services/publisherService";

interface PublisherBooksGridProps {
  books: EnrichedPublisherBook[];
  series: PublisherSeries;
  onAddBook: (book: EnrichedPublisherBook) => void;
  loading?: boolean;
}

const PublisherBooksGrid = ({ books, series, onAddBook, loading }: PublisherBooksGridProps) => {
  const getSeriesPlaceholder = (seriesName: string) => {
    if (seriesName.toLowerCase().includes('penguin')) return '🐧';
    if (seriesName.toLowerCase().includes('gollancz')) return '🏛️';
    if (seriesName.toLowerCase().includes('tor')) return '🗲';
    if (seriesName.toLowerCase().includes('oxford')) return '📜';
    return '📚';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading curated collection...</p>
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
          This series collection is being curated. Check back soon for new additions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <PublisherResonanceBadge series={series} size="md" />
        <p className="text-slate-300 text-sm mt-2 leading-relaxed">{series.description}</p>
        <p className="text-slate-500 text-xs mt-1">Covers powered by Google Books API</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <div key={book.id} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-4 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50">
            {/* Book Cover */}
            <div className="w-full h-48 bg-slate-700/30 rounded mb-4 overflow-hidden flex items-center justify-center border border-slate-600/20 relative">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex items-center justify-center text-slate-400 text-3xl absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                {getSeriesPlaceholder(series.name)}
              </div>
            </div>
            
            {/* Book Info */}
            <div className="mb-4">
              <h3 className="text-slate-200 font-medium text-sm leading-tight mb-2 line-clamp-2">{book.title}</h3>
              <p className="text-slate-400 text-xs mb-3 font-light">{book.author}</p>
              {book.editorial_note && (
                <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-3 font-light mb-3">{book.editorial_note}</p>
              )}
              {book.isbn && (
                <p className="text-slate-500 text-xs font-mono">ISBN: {book.isbn}</p>
              )}
            </div>
            
            {/* Add Button */}
            <Button
              size="sm"
              onClick={() => onAddBook(book)}
              className="w-full bg-purple-600/70 hover:bg-purple-600/90 text-white text-xs h-8 font-light border-0"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Transmissions
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublisherBooksGrid;
