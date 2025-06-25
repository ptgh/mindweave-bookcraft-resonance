
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

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
      // If it's already a Google Books URL, enhance it for embedding
      if (url.includes('books.google.com')) {
        // Convert to embedded view if possible
        if (url.includes('/books?id=')) {
          return url.replace('/books?id=', '/books/reader?id=').replace('&printsec=frontcover', '&printsec=frontcover&output=embed');
        }
        // For search URLs, try to make them embed-friendly
        if (url.includes('/books?q=')) {
          return url + '&output=embed';
        }
        return url;
      }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
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
                <Button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open in Google Books
                </Button>
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
        
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => window.open(previewUrl, '_blank')}
            className="text-slate-300 border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/50"
          >
            Open in New Tab
          </Button>
          <Button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
