
import { Brain } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AuthorDetails from "@/components/AuthorDetails";
import BookListItem from "@/components/BookListItem";
import EmptyState from "@/components/EmptyState";
import { ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";

interface AuthorBooksSectionProps {
  selectedAuthor: ScifiAuthor | null;
  authorBooks: AuthorBook[];
  booksLoading: boolean;
  onAddToTransmissions: (book: AuthorBook) => void;
}

const AuthorBooksSection = ({ 
  selectedAuthor, 
  authorBooks, 
  booksLoading, 
  onAddToTransmissions 
}: AuthorBooksSectionProps) => {
  if (!selectedAuthor) {
    return (
      <EmptyState
        icon={Brain}
        title="Select an Author"
        description="Choose from the consciousness archive to explore their literary universe"
      />
    );
  }

  return (
    <div>
      {booksLoading ? (
        <LoadingSkeleton type="author-detail" />
      ) : (
        <AuthorDetails author={selectedAuthor} />
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-200 text-lg sm:text-xl font-medium mb-1">Available Books</h3>
            <p className="text-slate-400 text-sm">Transmissions ready for signal logging</p>
          </div>
        </div>
        
        {booksLoading ? (
          <LoadingSkeleton type="book-grid" count={6} />
        ) : authorBooks.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {authorBooks.map(book => (
              <BookListItem
                key={book.id}
                book={book}
                onAddToTransmissions={onAddToTransmissions}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Brain}
            title="No Books Found"
            description="No available transmissions found for this consciousness node"
          />
        )}
      </div>
    </div>
  );
};

export default AuthorBooksSection;
