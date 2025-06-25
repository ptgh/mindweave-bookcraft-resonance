
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
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

  // Enhanced URL handling with better fallback logic
  const getEnhancedPreviewUrl = (url: string, attempt: number = 0) => {
    try {
      console.log('Original URL:', url, 'Attempt:', attempt);
      
      // Attempt 0: Try the original URL with embed parameter
      if (attempt === 0) {
        if (url.includes('books.google.com')) {
          const enhancedUrl = url.includes('&output=embed') ? url : url + '&output=embed';
          console.log('Enhanced original URL:', enhancedUrl);
          return enhancedUrl;
        }
      }
      
      // Attempt 1: Try reader view if it's a book ID URL
      if (attempt === 1 && url.includes('books.google.com/books?id=')) {
        const bookId = url.match(/id=([^&]+)/)?.[1];
        if (bookId) {
          const readerUrl = `https://books.google.com/books/reader?id=${bookId}&output=embed`;
          console.log('Reader URL:', readerUrl);
          return readerUrl;
        }
      }
      
      // Attempt 2: Try preview URL format
      if (attempt === 2 && url.includes('books.google.com/books?id=')) {
        const bookId = url.match(/id=([^&]+)/)?.[1];
        if (bookId) {
          const previewUrl = `https://books.google.com/books/publisher/content/images/frontcover/${bookId}?fife=w400-h600&source=gbs_api`;
          console.log('Preview URL:', previewUrl);
          return previewUrl;
        }
      }
      
      console.log('Using fallback URL:', url);
      return url;
    } catch (error) {
      console.error('Error enhancing preview URL:', error);
      return url;
    }
  };

  const enhancedUrl = getEnhancedPreviewUrl(previewUrl, retryCount);

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      // Final fallback: open in new tab
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

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
                <p className="text-slate-500 text-sm">
                  {retryCount === 0 && 'Connecting to Google Books...'}
                  {retryCount === 1 && 'Trying alternative view...'}
                  {retryCount === 2 && 'Loading preview image...'}
                </p>
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
                  {retryCount < 2 
                    ? 'This view failed to load. Trying another approach...' 
                    : 'This book\'s preview may be restricted or not available for embedding.'
                  }
                </p>
                <div className="space-x-4">
                  {retryCount < 2 ? (
                    <button
                      onClick={handleRetry}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Try Alternative View
                    </button>
                  ) : (
                    <button
                      onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Open in Google Books
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <iframe
            key={`${previewUrl}-${retryCount}`}
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
