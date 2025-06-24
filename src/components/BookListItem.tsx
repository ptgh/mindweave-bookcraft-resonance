
import { memo } from "react";
import { Button } from "@/components/ui/button";
import EnhancedBookCover from "./EnhancedBookCover";
import { AuthorBook } from "@/services/scifiAuthorsService";

interface BookListItemProps {
  book: AuthorBook;
  onAddToTransmissions: (book: AuthorBook) => void;
}

const BookListItem = memo(({ book, onAddToTransmissions }: BookListItemProps) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-slate-800/70 transition-colors">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <EnhancedBookCover
          title={book.title}
          coverUrl={book.cover_url}
          className="w-8 h-12 sm:w-10 sm:h-14 flex-shrink-0"
          lazy={true}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200 text-sm mb-1 leading-tight">{book.title}</h4>
          {book.subtitle && (
            <p className="text-xs text-slate-400 mb-2">{book.subtitle}</p>
          )}
          {book.description && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">
              {book.description}
            </p>
          )}
          <Button
            size="sm"
            onClick={() => onAddToTransmissions(book)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 touch-manipulation active:scale-95"
          >
            Log Signal
          </Button>
        </div>
      </div>
    </div>
  );
});

BookListItem.displayName = 'BookListItem';

export default BookListItem;
