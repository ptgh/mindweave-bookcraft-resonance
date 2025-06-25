
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
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      console.log('GoogleBooksPopup opening with URL:', previewUrl);
      setIsLoading(true);
      setHasError(false);
      
      // Clean and prepare the URL
      const cleanUrl = preparePreviewUrl(previewUrl);
      console.log('Cleaned URL:', cleanUrl);
      setCurrentUrl(cleanUrl);
      
      // Set a timeout to detect if iframe fails to load
      const timeoutId = setTimeout(() => {
        console.log('Iframe load timeout - showing error');
        setIsLoading(false);
        setHasError(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen) return null;

  const preparePreviewUrl = (url: string) => {
    try {
      console.log('Preparing URL:', url);
      
      // If it's already an embed URL, use it
      if (url.includes('output=embed') || url.includes('/embed/')) {
        return url;
      }
      
      // If it's a Google Books URL, try to make it embeddable
      if (url.includes('books.google.com')) {
        // Extract book ID if present
        const idMatch = url.match(/[?&]id=([^&]+)/);
        if (idMatch) {
          const bookId = idMatch[1];
          return `https://books.google.com/books?id=${bookId}&output=embed&source=public_api`;
        }
        
        // Add embed parameter to existing URL
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}output=embed&source=public_api`;
      }
      
      return url;
    } catch (error) {
      console.error('Error preparing URL:', error);
      return url;
    }
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    console.log('Iframe failed to load');
    setIsLoading(false);
    setHasError(true);
  };

  const handleOpenInNewTab = () => {
    const urlToOpen = previewUrl.includes('output=embed') 
      ? previewUrl.replace('output=embed', 'output=reader')
      : previewUrl;
    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    onClose();
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
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-300 text-base mb-2">Loading book preview...</p>
                <p className="text-slate-500 text-sm">Connecting to Google Books...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 text-lg mb-2">Preview not available</p>
                <p className="text-slate-400 mb-6 max-w-md">
                  This book's preview may be restricted or not available for embedding.
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Open in Google Books
                </button>
              </div>
            </div>
          )}
          
          {currentUrl && (
            <iframe
              key={currentUrl}
              src={currentUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`Google Books - ${bookTitle}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
