
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrichedPublisherBook } from "@/services/publisherService";

interface BookNodeModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const BookNodeModal = ({ book, onClose, onAddBook }: BookNodeModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-cyan-400/30 rounded-lg w-full max-w-md shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-sm font-medium">Signal Node</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Book details */}
        <div className="p-4">
          <div className="flex space-x-4">
            {/* Book cover */}
            <div className="flex-shrink-0 w-20 h-28 bg-slate-800/50 rounded border border-slate-600/30 overflow-hidden">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center text-slate-400 text-lg ${book.cover_url ? 'hidden' : ''}`}>
                📚
              </div>
            </div>
            
            {/* Book info */}
            <div className="flex-1">
              <h3 className="text-slate-200 font-medium text-sm leading-tight mb-1">{book.title}</h3>
              <p className="text-slate-400 text-xs mb-2">{book.author}</p>
              {book.isbn && (
                <p className="text-slate-500 text-xs mb-2">ISBN: {book.isbn}</p>
              )}
              {book.editorial_note && (
                <p className="text-slate-400 text-xs italic leading-relaxed">{book.editorial_note}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2 p-4 border-t border-slate-700/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-cyan-600/70 hover:bg-cyan-600/90 text-white border-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to Transmissions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookNodeModal;
