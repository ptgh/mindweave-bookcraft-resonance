
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrichedPublisherBook } from "@/services/publisherService";

interface BookPortalModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const BookPortalModal = ({ book, onClose, onAddBook }: BookPortalModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-cyan-400/30 rounded-lg w-full max-w-md shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Tron-style header */}
        <div className="relative p-4 border-b border-cyan-400/20">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 text-sm font-medium tracking-wider">LITERARY PORTAL</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Book details */}
        <div className="p-6">
          <div className="flex space-x-4">
            {/* Book cover portal */}
            <div className="flex-shrink-0 w-24 h-32 bg-slate-800/50 border border-cyan-400/30 rounded overflow-hidden relative">
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
              <div className={`absolute inset-0 flex items-center justify-center text-cyan-400 text-lg ${book.cover_url ? 'hidden' : ''}`}>
                <div className="w-12 h-16 border-2 border-cyan-400/50 rounded animate-pulse flex items-center justify-center">
                  <div className="w-6 h-8 border border-cyan-400/30 rounded" />
                </div>
              </div>
              
              {/* Portal glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            {/* Book info */}
            <div className="flex-1">
              <h3 className="text-cyan-200 font-medium text-sm leading-tight mb-2">{book.title}</h3>
              <p className="text-slate-400 text-xs mb-3">{book.author}</p>
              {book.isbn && (
                <p className="text-slate-500 text-xs mb-3 font-mono">ISBN: {book.isbn}</p>
              )}
              {book.editorial_note && (
                <p className="text-slate-400 text-xs italic leading-relaxed mb-4 p-2 bg-slate-800/30 border-l-2 border-cyan-400/30 rounded">
                  {book.editorial_note}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 p-4 border-t border-cyan-400/20 bg-slate-900/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:border-cyan-400/50"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-cyan-600/70 hover:bg-cyan-600/90 text-white border-0 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-200"
          >
            <div className="w-3 h-3 border border-white rounded-full mr-2 animate-pulse" />
            Add to Transmissions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookPortalModal;
