
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import { EnrichedPublisherBook, PublisherSeries } from "@/services/publisherService";
import EnhancedBookPreviewModal from "./EnhancedBookPreviewModal";

interface PublisherBooksGridProps {
  books: EnrichedPublisherBook[];
  series?: PublisherSeries;
  onAddBook: (book: EnrichedPublisherBook) => void;
  loading?: boolean;
}

const PublisherBooksGrid = ({ books, series, onAddBook, loading }: PublisherBooksGridProps) => {
  if (!series) return null;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading collection...</p>
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

      {/* Exact transmission grid layout - 3 columns max */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div 
            key={book.id} 
            className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300"
          >
            {/* Small book cover exactly like transmissions - 24x32 */}
            <div className="w-24 h-32 bg-slate-800/50 rounded-lg mb-4 overflow-hidden mx-auto">
              <img 
                src={book.cover_url} 
                alt={book.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('Image failed to load:', book.cover_url);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            
            {/* Book info exactly like transmissions */}
            <div className="text-center space-y-2">
              <h3 className="text-slate-200 font-medium text-base leading-tight">
                {book.title}
              </h3>
              <p className="text-slate-400 text-sm">{book.author}</p>
              <p className="text-slate-500 text-xs">Fiction</p>
              
              {/* Action buttons exactly like transmissions */}
              <div className="flex gap-2 justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-600/40 text-slate-400 hover:border-blue-500/40 hover:text-blue-400"
                  onClick={() => onAddBook(book)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm" 
                  className="text-xs border-slate-600/40 text-slate-400 hover:border-green-500/40 hover:text-green-400"
                >
                  Keep
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-600/40 text-slate-400 hover:border-red-500/40 hover:text-red-400"
                >
                  Discard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-600/40 text-slate-400 hover:border-blue-500/40 hover:text-blue-400"
                  onClick={() => window.open(book.penguin_url || `https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589`, '_blank')}
                >
                  Archive
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
