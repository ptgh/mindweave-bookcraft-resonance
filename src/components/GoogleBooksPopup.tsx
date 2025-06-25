
import { useState, useEffect } from "react";

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
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setDebugInfo(`Attempting to load: ${previewUrl}`);
      console.log('GoogleBooksPopup - Loading URL:', previewUrl);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    console.log('GoogleBooksPopup - Iframe loaded successfully');
    setIsLoading(false);
    setHasError(false);
    setDebugInfo('Successfully loaded');
  };

  const handleIframeError = (e: any) => {
    console.error('GoogleBooksPopup - Iframe failed to load:', e);
    setIsLoading(false);
    setHasError(true);
    setDebugInfo(`Failed to load: ${e.message || 'Unknown error'}`);
  };

  // Enhanced URL processing to handle different Google Books URLs
  const processGoogleBooksUrl = (url: string) => {
    try {
      console.log('Processing original URL:', url);
      
      // Extract book ID if present
      let bookId = '';
      const idMatch = url.match(/[?&]id=([^&]+)/);
      if (idMatch) {
        bookId = idMatch[1];
        console.log('Found book ID:', bookId);
      }

      // If we have a book ID, try the embedded reader format first
      if (bookId) {
        const embeddedUrl = `https://books.google.com/books/reader?id=${bookId}&hl=en&printsec=frontcover&output=reader&pg=GBS.PP1`;
        console.log('Using embedded reader URL:', embeddedUrl);
        return embeddedUrl;
      }

      // For preview links, try to make them embeddable
      if (url.includes('books.google.com/books') && url.includes('preview')) {
        const embeddableUrl = url.includes('&output=embed') ? url : url + '&output=embed&hl=en';
        console.log('Using embeddable preview URL:', embeddableUrl);
        return embeddableUrl;
      }

      // For search URLs, convert to embedded format
      if (url.includes('books.google.com/books?q=')) {
        const embeddedSearchUrl = url + '&output=embed&hl=en';
        console.log('Using embedded search URL:', embeddedSearchUrl);
        return embeddedSearchUrl;
      }

      console.log('Using original URL (no modifications needed):', url);
      return url;
    } catch (error) {
      console.error('Error processing Google Books URL:', error);
      return url;
    }
  };

  const processedUrl = processGoogleBooksUrl(previewUrl);

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
            ×
          </button>
        </div>
        
        <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-300 text-base mb-2">Loading book preview...</p>
                <p className="text-slate-500 text-sm">Connecting to Google Books...</p>
                <p className="text-slate-600 text-xs mt-2 max-w-md">{debugInfo}</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl text-slate-400">📚</span>
                </div>
                <p className="text-slate-300 text-lg mb-2">Preview not available</p>
                <p className="text-slate-400 mb-4 text-sm">
                  This book's preview may be restricted or not available for embedding.
                </p>
                <p className="text-slate-600 text-xs mb-4">{debugInfo}</p>
                <button
                  onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm"
                >
                  Open in Google Books
                </button>
              </div>
            </div>
          )}
          
          <iframe
            src={processedUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Books - ${bookTitle}`}
            allow="fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ 
              background: 'white',
              minHeight: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
