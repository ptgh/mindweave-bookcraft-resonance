import React, { useState } from 'react';
import { Plus, Share2 } from 'lucide-react';
import { EnrichedPublisherBook } from '@/services/publisherService';
import ShareBookModal from '@/components/ShareBookModal';
import EnhancedBookCover from '@/components/EnhancedBookCover';

interface PublisherBookCardProps {
  book: EnrichedPublisherBook;
  onLogSignal: () => void;
  onPreview: () => void;
}

const PublisherBookCard = ({ book, onLogSignal, onPreview }: PublisherBookCardProps) => {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all duration-300">
        {/* Book cover and details */}
        <div className="flex space-x-3 mb-4">
          <EnhancedBookCover
            title={book.title}
            author={book.author}
            isbn={book.isbn || undefined}
            coverUrl={book.cover_url || undefined}
            className="w-16 h-24"
          />
          
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
            onClick={() => setShowShareModal(true)}
            className="px-2 py-2 bg-transparent border border-slate-600 text-slate-300 text-xs rounded transition-all duration-200 hover:border-pink-400 hover:text-pink-400"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </button>
          <button
            onClick={onPreview}
            className="px-3 py-2 bg-transparent border border-slate-600 text-slate-300 text-xs rounded transition-all duration-200 hover:border-blue-400 hover:text-blue-400"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareBookModal
          book={{
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default PublisherBookCard;