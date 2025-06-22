
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import BookSearchInput from "../BookSearchInput";
import { BookSuggestion } from "@/services/googleBooksApi";

interface BookSearchSectionProps {
  titleSearch: string;
  authorSearch: string;
  coverUrl: string;
  title: string;
  onTitleSearchChange: (value: string) => void;
  onAuthorSearchChange: (value: string) => void;
  onBookSelect: (book: BookSuggestion) => void;
}

const BookSearchSection = ({
  titleSearch,
  authorSearch,
  coverUrl,
  title,
  onTitleSearchChange,
  onAuthorSearchChange,
  onBookSelect
}: BookSearchSectionProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title" className="text-slate-300 text-sm">Title</Label>
          <BookSearchInput
            placeholder="Search for a book title..."
            value={titleSearch}
            onValueChange={onTitleSearchChange}
            onBookSelect={onBookSelect}
          />
        </div>
        <div>
          <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
          <Input
            value={authorSearch}
            onChange={(e) => onAuthorSearchChange(e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-200"
            placeholder="Author name"
            required
          />
        </div>
      </div>

      {coverUrl && (
        <div className="flex justify-center">
          <img 
            src={coverUrl} 
            alt={title}
            className="w-20 h-28 object-cover rounded shadow-lg"
          />
        </div>
      )}
    </>
  );
};

export default BookSearchSection;
