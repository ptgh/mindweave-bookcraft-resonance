
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
      <div className="bg-slate-800 border border-slate-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <PublisherResonanceBadge series={series} size="md" />
            <div>
              <h2 className="text-slate-200 text-xl font-medium">{series.name}</h2>
              <p className="text-slate-400 text-sm">{series.publisher}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <div key={book.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded" />
                      ) : (
                        <span className="text-slate-400 text-xs">📚</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-200 font-medium text-sm leading-tight">{book.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{book.author}</p>
                      {book.editorial_note && (
                        <p className="text-slate-400 text-xs mt-2 italic">{book.editorial_note}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => onAddBook(book)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Signal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublisherResonanceModal;
