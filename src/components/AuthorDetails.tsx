
import { memo, useState, useEffect } from "react";
import { ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { Transmission, getTransmissions } from "@/services/transmissionsService";
import EnhancedBookPreviewModal from "./EnhancedBookPreviewModal";

interface AuthorDetailsProps {
  author: ScifiAuthor;
  onNotableWorkClick?: (bookTitle: string) => void;
}

const AuthorDetails = memo(({ author, onNotableWorkClick }: AuthorDetailsProps) => {
  const [userTransmissions, setUserTransmissions] = useState<Transmission[]>([]);
  const [selectedBookForPreview, setSelectedBookForPreview] = useState<any>(null);

  useEffect(() => {
    const loadTransmissions = async () => {
      try {
        const transmissions = await getTransmissions();
        setUserTransmissions(transmissions);
      } catch (error) {
        console.error('Error loading transmissions:', error);
      }
    };
    loadTransmissions();
  }, []);

  const isBookInTransmissions = (bookTitle: string): boolean => {
    return userTransmissions.some(
      t => t.title.toLowerCase().trim() === bookTitle.toLowerCase().trim()
    );
  };

  const handleNotableWorkClick = (bookTitle: string) => {
    // Create a preview book object
    const previewBook = {
      id: `notable-${bookTitle}`,
      title: bookTitle,
      author: author.name,
      cover_url: null,
      editorial_note: `A notable work by ${author.name}`,
      isbn: null,
      series_id: '',
      created_at: ''
    };
    setSelectedBookForPreview(previewBook);
    
    if (onNotableWorkClick) {
      onNotableWorkClick(bookTitle);
    }
  };

  const closePreview = () => {
    setSelectedBookForPreview(null);
  };

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <h2 className="text-sm font-medium mb-1">
          <span className="relative inline-block group text-slate-300">
            {author.name}
            <span 
              className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 ease-out"
              style={{ transformOrigin: 'left' }}
            />
          </span>
        </h2>
        <p className="text-slate-400 text-sm mb-2">{author.nationality}</p>
        {author.bio && (
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2 line-clamp-3">{author.bio}</p>
        )}
        {author.notable_works && author.notable_works.length > 0 && (
          <div>
            <h3 className="text-slate-300 font-medium text-sm mb-1">Notable Works:</h3>
            <ul className="text-slate-400 text-xs space-y-0.5">
              {author.notable_works.map((work, index) => {
                const inTransmissions = isBookInTransmissions(work);
                return (
                  <li key={index}>
                    <button
                      onClick={() => handleNotableWorkClick(work)}
                      className={`group inline-flex items-start text-left hover:text-slate-300 transition-colors ${
                        inTransmissions ? 'text-blue-400' : ''
                      }`}
                    >
                      <span className="mr-1">•</span>
                      <span className="relative">
                        {work}
                        <span 
                          className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 ease-out ${
                            inTransmissions ? 'w-full' : ''
                          }`}
                          style={{ transformOrigin: 'left' }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {selectedBookForPreview && (
        <EnhancedBookPreviewModal
          book={selectedBookForPreview}
          onClose={closePreview}
          onAddBook={(book) => {
            console.log('Adding book from notable works:', book);
            closePreview();
          }}
        />
      )}
    </>
  );
});

AuthorDetails.displayName = 'AuthorDetails';

export default AuthorDetails;
