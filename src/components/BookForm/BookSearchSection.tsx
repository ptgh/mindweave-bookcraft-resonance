
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import BookSearchInput from "../BookSearchInput";
import AuthorSearchInput from "../AuthorSearchInput";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { ScifiAuthor, AuthorBook, getAuthorBooks } from "@/services/scifiAuthorsService";

interface BookSearchSectionProps {
  titleSearch: string;
  authorSearch: string;
  coverUrl: string;
  title: string;
  onTitleSearchChange: (value: string) => void;
  onAuthorSearchChange: (value: string) => void;
  onBookSelect: (book: EnhancedBookSuggestion) => void;
  onAuthorSelect?: (author: ScifiAuthor) => void;
  selectedAuthorName?: string;
  isEditMode?: boolean;
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
  selectedAuthorName,
  isEditMode = false
}: BookSearchSectionProps) => {
  const [authorBooks, setAuthorBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  // Fetch author's book catalog when author is selected
  useEffect(() => {
    if (!selectedAuthorId || isEditMode) {
      setAuthorBooks([]);
      return;
    }
    const fetchAuthorBooks = async () => {
      try {
        const books = await getAuthorBooks(selectedAuthorId);
        const mapped: EnhancedBookSuggestion[] = books.map(b => ({
          id: b.id,
          title: b.title,
          author: selectedAuthorName || '',
          coverUrl: b.cover_url || '',
          thumbnailUrl: b.cover_url || '',
          smallThumbnailUrl: b.cover_url || '',
          description: b.description || '',
          categories: b.categories || [],
        }));
        setAuthorBooks(mapped);
      } catch (e) {
        console.error('Error fetching author books:', e);
      }
    };
    fetchAuthorBooks();
  }, [selectedAuthorId, selectedAuthorName, isEditMode]);

  const handleBookSelection = (book: EnhancedBookSuggestion) => {
    console.log('Book selected in BookSearchSection:', book);
    onBookSelect(book);
  };

  const handleAuthorSelect = (author: ScifiAuthor) => {
    console.log('Author selected in BookSearchSection:', author);
    onAuthorSearchChange(author.name);
    setSelectedAuthorId(author.id);
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
            isEditMode={isEditMode}
            authorBooks={authorBooks}
          />
        </div>
        <div>
          <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
          <AuthorSearchInput
            placeholder="Search for an author..."
            value={authorSearch}
            onValueChange={onAuthorSearchChange}
            onAuthorSelect={handleAuthorSelect}
            isEditMode={isEditMode}
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
