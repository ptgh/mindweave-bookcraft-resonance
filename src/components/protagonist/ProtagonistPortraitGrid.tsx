import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { ProtagonistBook } from '@/pages/Protagonists';

interface ProtagonistPortraitGridProps {
  books: ProtagonistBook[];
  onChat: (book: ProtagonistBook) => void;
}

const ProtagonistPortraitGrid: React.FC<ProtagonistPortraitGridProps> = ({ books, onChat }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6">
      {books.map(book => (
        <button
          key={book.id}
          onClick={() => onChat(book)}
          className="flex flex-col items-center gap-2 group focus:outline-none"
          aria-label={`Speak to ${book.protagonist}`}
        >
          <Avatar className="h-20 w-20 border-2 border-violet-500/30 shadow-lg shadow-violet-500/20 group-hover:border-violet-400/60 group-hover:shadow-violet-500/40 transition-all duration-300 group-hover:scale-105 bg-slate-800">
            {book.protagonist_portrait_url ? (
              <AvatarImage
                src={book.protagonist_portrait_url}
                alt={book.protagonist}
                className="object-cover w-full h-full"
              />
            ) : null}
            <AvatarFallback className="bg-slate-800 text-violet-400">
              <MessageCircle className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="text-center min-w-0 w-full">
            <p className="text-xs font-medium text-violet-300 truncate group-hover:text-violet-200 transition-colors">
              {book.protagonist}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {book.title}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProtagonistPortraitGrid;
