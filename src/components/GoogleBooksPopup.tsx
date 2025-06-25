
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface GoogleBooksPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  bookAuthor: string;
  previewUrl: string;
}

const GoogleBooksPopup = ({ isOpen, onClose, bookTitle, bookAuthor, previewUrl }: GoogleBooksPopupProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen) return null;

  console.log('GoogleBooksPopup rendering with URL:', previewUrl);

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = (e: any) => {
    console.log('Iframe failed to load:', e);
    setIsLoading(false);
    setHasError(true);
  };

  // Enhanced URL handling for better Google Books integration
  const getEnhancedPreviewUrl = (url: string) => {
    try {
      console.log('Original URL:', url);
      
      // If it's a search URL, try to convert to embedded view
      if (url.includes('books.google.com/books?q=')) {
        // For search URLs, we can't embed directly, so we'll show the search page
        const enhancedUrl = url.includes('&output=embed') ? url : url + '&output=embed';
        console.log('Enhanced search URL:', enhancedUrl);
        return enhancedUrl;
      }
      
      // If it's a book-specific URL, enhance for embedding
      if (url.includes('books.google.com/books?id=')) {
        const enhancedUrl = url.replace('/books?id=', '/books/reader?id=') + '&output=embed';
        console.log('Enhanced book URL:', enhancedUrl);
        return enhancedUrl;
      }
      
      // For preview links, make them embed-friendly
      if (url.includes('books.google.com/books/') && url.includes('preview')) {
        const enhancedUrl = url.includes('&output=embed') ? url : url + '&output=embed';
        console.log('Enhanced preview URL:', enhancedUrl);
        return enhancedUrl;
      }
      
      console.log('Using original URL:', url);
      return url;
    } catch (error) {
      console.error('Error enhancing preview URL:', error);
      return url;
    }
  };

  const enhancedUrl = getEnhancedPreviewUrl(previewUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700/50 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
          <div>
            <h3 className="text-slate-200 font-medium text-lg">{bookTitle}</h3>
            <p className="text-slate-400 text-sm">{bookAuthor}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-300 text-base mb-2">Loading book preview...</p>
                <p className="text-slate-500 text-sm">Connecting to Google Books...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 text-lg mb-2">Preview not available</p>
                <p className="text-slate-400 mb-6 max-w-md">
                  This book's preview may be restricted or not available for embedding.
                </p>
                <button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Open in Google Books
                </button>
              </div>
            </div>
          )}
          
          <iframe
            src={enhancedUrl}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Books - ${bookTitle}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ 
              border: 'none',
              background: 'white'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
