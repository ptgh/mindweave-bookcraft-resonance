
import { Label } from "@/components/ui/label";
import BookSearchInput from "../BookSearchInput";
import AuthorSearchInput from "../AuthorSearchInput";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { ScifiAuthor } from "@/services/scifiAuthorsService";

interface BookSearchSectionProps {
  titleSearch: string;
  authorSearch: string;
  coverUrl: string;
  title: string;
  onTitleSearchChange: (value: string) => void;
  onAuthorSearchChange: (value: string) => void;
  onBookSelect: (book: EnhancedBookSuggestion) => void;
  onAuthorSelect?: (author: ScifiAuthor) => void;
  selectedAuthorName?: string; // Track selected author for filtering
}

const BookSearchSection = ({
  titleSearch,
  authorSearch,
  coverUrl,
  title,
  onTitleSearchChange,
  onAuthorSearchChange,
  onBookSelect,
  onAuthorSelect,
  selectedAuthorName
}: BookSearchSectionProps) => {
  const handleBookSelection = (book: EnhancedBookSuggestion) => {
    console.log('Book selected in BookSearchSection:', book);
    onBookSelect(book);
  };

  const handleAuthorSelect = (author: ScifiAuthor) => {
    console.log('Author selected in BookSearchSection:', author);
    onAuthorSearchChange(author.name);
    if (onAuthorSelect) {
      onAuthorSelect(author);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title" className="text-slate-300 text-sm">Title</Label>
          <BookSearchInput
            placeholder="Search for a book title..."
            value={titleSearch}
            onValueChange={onTitleSearchChange}
            onBookSelect={handleBookSelection}
            authorFilter={selectedAuthorName}
          />
        </div>
        <div>
          <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
          <AuthorSearchInput
            placeholder="Search for an author..."
            value={authorSearch}
            onValueChange={onAuthorSearchChange}
            onAuthorSelect={handleAuthorSelect}
          />
        </div>
      </div>

      {coverUrl && (
        <div className="flex justify-center">
          <img 
            src={coverUrl} 
            alt={title}
            className="w-20 h-28 object-cover rounded shadow-lg"
            onError={(e) => {
              console.log('Cover image failed to load:', coverUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </>
  );
};

export default BookSearchSection;
