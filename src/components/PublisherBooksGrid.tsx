
import { useState } from "react";
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
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div key={book.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
            <div className="flex items-start space-x-4">
              {/* Book Cover - matching transmissions page size */}
              <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title} 
                    className="w-full h-full object-cover rounded"
                    style={{ imageRendering: 'crisp-edges' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex items-center justify-center text-slate-400 text-lg absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                  {getSeriesPlaceholder(series.name)}
                </div>
              </div>
              
              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-slate-200 font-medium text-sm leading-tight">{book.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">{book.author}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full border-2 border-purple-400 bg-purple-400/10 flex-shrink-0"></div>
                </div>
                
                {book.editorial_note && (
                  <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-2 mb-2">{book.editorial_note}</p>
                )}
                
                {book.isbn && (
                  <p className="text-slate-500 text-xs font-mono mb-3">ISBN: {book.isbn}</p>
                )}
                
                {/* Add Button - properly aligned */}
                <Button
                  size="sm"
                  onClick={() => onAddBook(book)}
                  className="w-full bg-purple-600/70 hover:bg-purple-600/90 text-white text-xs h-8 font-light border-0 flex items-center justify-center"
                >
                  <div className="w-3 h-3 rounded-full border border-white mr-2 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  Add to Transmissions
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublisherBooksGrid;
