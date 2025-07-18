
import { useState } from "react";
import { X, ExternalLink, Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrichedPublisherBook } from "@/services/publisherService";

interface PublisherBookModalProps {
  book: EnrichedPublisherBook;
  isOpen: boolean;
  onClose: () => void;
  onAddToTransmissions: (book: EnrichedPublisherBook) => void;
}

const PublisherBookModal = ({ book, isOpen, onClose, onAddToTransmissions }: PublisherBookModalProps) => {
  if (!isOpen) return null;

  const isPenguinBook = book.series_id.includes('penguin') || book.title.toLowerCase().includes('penguin');
  
  const generatePenguinStoreUrl = (title: string, author: string) => {
    const searchQuery = `${title} ${author}`.replace(/\s+/g, '+');
    return `https://www.penguin.co.uk/search?q=${searchQuery}`;
  };

  const generateAppleBooksUrl = (title: string, author: string) => {
    const searchQuery = `${title} ${author}`.replace(/\s+/g, '+');
    return `https://books.apple.com/search?term=${searchQuery}`;
  };

  const generateArchiveUrl = (title: string, author: string) => {
    const searchQuery = `${title} ${author}`.replace(/\s+/g, '+');
    return `https://archive.org/search.php?query=${searchQuery}&and[]=mediatype%3A%22texts%22`;
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 border border-slate-600/30 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
          <div className="flex items-center space-x-3">
            {isPenguinBook && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-lg flex items-center justify-center border border-orange-500/30">
                <span className="text-lg">🐧</span>
              </div>
            )}
            <div>
              <h2 className="text-xl text-slate-200 font-medium">{book.title}</h2>
              <p className="text-slate-400 text-sm">{book.author}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="w-32 h-44 bg-slate-700/30 rounded-lg overflow-hidden flex items-center justify-center">
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
                <div className={`flex items-center justify-center text-slate-400 text-3xl ${book.cover_url ? 'hidden' : ''}`}>
                  {isPenguinBook ? '🐧' : '📚'}
                </div>
              </div>
            </div>
            
            {/* Book Details */}
            <div className="flex-1">
              {book.editorial_note && (
                <div className="mb-6">
                  <h3 className="text-slate-300 font-medium mb-2">Editorial Note</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{book.editorial_note}</p>
                </div>
              )}
              
              {book.isbn && (
                <div className="mb-6">
                  <h3 className="text-slate-300 font-medium mb-2">ISBN</h3>
                  <p className="text-slate-400 text-sm font-mono">{book.isbn}</p>
                </div>
              )}
              
              {/* Purchase Options */}
              <div className="space-y-3">
                <h3 className="text-slate-300 font-medium mb-3">Get This Book</h3>
                
                {/* Penguin Store Link (for Penguin books) */}
                {isPenguinBook && (
                  <a
                    href={generatePenguinStoreUrl(book.title, book.author)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/20 border border-orange-500/30 rounded-lg hover:from-orange-500/20 hover:to-orange-600/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🐧</span>
                      <div>
                        <div className="text-orange-300 font-medium text-sm">Penguin Store</div>
                        <div className="text-orange-400/70 text-xs">Official paperback & digital</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
                  </a>
                )}
                
                {/* Apple Books */}
                <a
                  href={generateAppleBooksUrl(book.title, book.author)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📱</span>
                    <div>
                      <div className="text-slate-300 font-medium text-sm">Apple Books</div>
                      <div className="text-slate-400 text-xs">Digital edition</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                </a>
                
                {/* Archive.org */}
                <a
                  href={generateArchiveUrl(book.title, book.author)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-slate-300 font-medium text-sm">Internet Archive</div>
                      <div className="text-slate-400 text-xs">Free digital copies</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-700/30 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            Close
          </Button>
          <Button
            onClick={() => onAddToTransmissions(book)}
            className={`${isPenguinBook 
              ? 'bg-orange-600/80 hover:bg-orange-600/90 text-white' 
              : 'bg-blue-600/80 hover:bg-blue-600/90 text-white'
            } transition-all duration-200`}
          >
            <span className="mr-2">{isPenguinBook ? '🐧' : '📚'}</span>
            Add to Transmissions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublisherBookModal;
