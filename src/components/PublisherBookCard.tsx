import React from 'react';
import { Plus, Eye } from 'lucide-react';
import { EnrichedPublisherBook } from '@/services/publisherService';

interface PublisherBookCardProps {
  book: EnrichedPublisherBook;
  onLogSignal: () => void;
  onPreview: () => void;
}

const PublisherBookCard = ({ book, onLogSignal, onPreview }: PublisherBookCardProps) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all duration-300">
      {/* Book cover and details */}
      <div className="flex space-x-3 mb-4">
        <div className="flex-shrink-0 w-16 h-24 bg-slate-700/50 border border-slate-600 rounded overflow-hidden">
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
          <div className={`w-full h-full flex items-center justify-center text-slate-400 ${book.cover_url ? 'hidden' : ''}`}>
            <div className="w-8 h-12 border border-slate-600 rounded" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-200 font-medium text-sm leading-tight mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-slate-400 text-xs mb-2 line-clamp-1">
            {book.author}
          </p>
          <div className="text-slate-500 text-xs">
            Fiction
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2">
        <button
          onClick={onLogSignal}
          className="flex items-center justify-center flex-1 px-3 py-2 bg-transparent border border-slate-600 text-slate-300 text-xs rounded transition-all duration-200 hover:border-blue-400 hover:text-blue-400"
        >
          <Plus className="w-3 h-3 mr-1" />
          Log Signal
        </button>
        <button
          onClick={onPreview}
          className="px-3 py-2 bg-transparent border border-slate-600 text-slate-300 text-xs rounded transition-all duration-200 hover:border-blue-400 hover:text-blue-400"
        >
          Preview
        </button>
      </div>
    </div>
  );
};

export default PublisherBookCard;