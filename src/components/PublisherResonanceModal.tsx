
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublisherBooks, PublisherSeries, PublisherBook } from "@/services/publisherService";
import PublisherResonanceBadge from "./PublisherResonanceBadge";

interface PublisherResonanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: PublisherSeries;
  onAddBook: (book: PublisherBook) => void;
}

const PublisherResonanceModal = ({ isOpen, onClose, series, onAddBook }: PublisherResonanceModalProps) => {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && series) {
      loadSeriesBooks();
    }
  }, [isOpen, series]);

  const loadSeriesBooks = async () => {
    try {
      setLoading(true);
      const seriesBooks = await getPublisherBooks(series.id);
      setBooks(seriesBooks);
    } catch (error) {
      console.error('Failed to load series books:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg w-full max-w-6xl h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600/40">
              <span className="text-lg">{series.badge_emoji}</span>
            </div>
            <div>
              <PublisherResonanceBadge series={series} size="md" />
              <p className="text-slate-400 text-sm mt-1">{series.publisher}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <p className="text-slate-300 leading-relaxed">{series.description}</p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading curated signals...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <div key={book.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      {/* Book Cover */}
                      <div className="w-full h-48 bg-slate-700 rounded flex items-center justify-center overflow-hidden">
                        {book.cover_url ? (
                          <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling!.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex items-center justify-center text-slate-400 text-4xl ${book.cover_url ? 'hidden' : ''}`}>
                          📚
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="flex-1">
                        <h3 className="text-slate-200 font-medium text-sm leading-tight mb-1">{book.title}</h3>
                        <p className="text-slate-400 text-xs mb-2">{book.author}</p>
                        {book.editorial_note && (
                          <p className="text-slate-400 text-xs italic leading-relaxed">{book.editorial_note}</p>
                        )}
                      </div>
                      
                      {/* Add Button */}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={() => onAddBook(book)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Signal
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {books.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-slate-300 text-lg font-medium mb-2">No books in this collection yet</h3>
                <p className="text-slate-400 text-sm">
                  This publisher thread is being curated. Check back soon for new signals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherResonanceModal;
