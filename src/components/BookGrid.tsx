
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedBookCover from "@/components/EnhancedBookCover";
import { EnhancedBookSuggestion } from "@/services/enhanced-google-books-api";

interface BookGridProps {
  books: EnhancedBookSuggestion[];
  visibleBooks: Set<number>;
  onAddToTransmissions: (book: EnhancedBookSuggestion) => void;
}

const BookGrid = ({ books, visibleBooks, onAddToTransmissions }: BookGridProps) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-8 gap-4">
      {books.map((book, index) => (
        <Card
          key={`${book.id}-${index}`}
          className={`group relative overflow-hidden bg-slate-800/50 border-slate-700 hover:border-blue-400/50 transition-all duration-300 ${
            visibleBooks.has(index) 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
            <EnhancedBookCover
              title={book.title}
              coverUrl={book.coverUrl}
              thumbnailUrl={book.thumbnailUrl}
              smallThumbnailUrl={book.smallThumbnailUrl}
              className="w-full h-full"
              lazy={true}
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                size="sm"
                onClick={() => onAddToTransmissions(book)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
              >
                Add to Library
              </Button>
            </div>
          </div>
          
          <div className="p-2">
            <h3 className="font-medium text-slate-200 text-xs line-clamp-2 mb-1">
              {book.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1">
              {book.author}
            </p>
            {book.rating && (
              <div className="flex items-center mt-1">
                <span className="text-xs text-yellow-400">★</span>
                <span className="text-xs text-slate-400 ml-1">{book.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BookGrid;
