
import { useState, useEffect, useRef } from "react";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const embedCheckTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      console.log('GoogleBooksPopup opening with URL:', previewUrl);
      setIsLoading(true);
      setHasError(false);
      
      // Clean and prepare the URL
      const cleanUrl = preparePreviewUrl(previewUrl);
      console.log('Prepared URL:', cleanUrl);
      setCurrentUrl(cleanUrl);
      
      // Clear any existing timeouts
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (embedCheckTimeoutRef.current) clearTimeout(embedCheckTimeoutRef.current);
      
      // Set initial load timeout
      loadTimeoutRef.current = setTimeout(() => {
        console.log('Initial load timeout - checking iframe status');
        checkIframeContent();
      }, 3000);

      return () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        if (embedCheckTimeoutRef.current) clearTimeout(embedCheckTimeoutRef.current);
      };
    }
  }, [isOpen, previewUrl]);

  const preparePreviewUrl = (url: string) => {
    try {
      console.log('Original URL:', url);
      
      // If it's already an embed URL, use it
      if (url.includes('output=embed')) {
        return url;
      }
      
      // If it's a Google Books URL, try different embed approaches
      if (url.includes('books.google.com')) {
        // Extract book ID if present
        const idMatch = url.match(/[?&]id=([^&]+)/);
        if (idMatch) {
          const bookId = idMatch[1];
          // Try the reader embed first as it's more likely to work
          return `https://books.google.com/books?id=${bookId}&lpg=PP1&output=embed&pg=PP1`;
        }
        
        // For search URLs or other formats, try to make embeddable
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}output=embed&lpg=PP1&pg=PP1`;
      }
      
      return url;
    } catch (error) {
      console.error('Error preparing URL:', error);
      return url;
    }
  };

  const checkIframeContent = () => {
    if (!iframeRef.current) return;
    
    try {
      // Try to access iframe content to detect blocking
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      
      if (!iframeDoc) {
        console.log('Cannot access iframe content - likely blocked by CORS');
        // Content loaded but is blocked - this is actually success for our purposes
        setIsLoading(false);
        setHasError(false);
        return;
      }
      
      // If we can access the document, check if it has meaningful content
      const bodyText = iframeDoc.body?.innerText || '';
      if (bodyText.length > 100) {
        console.log('Iframe has substantial content');
        setIsLoading(false);
        setHasError(false);
      } else {
        console.log('Iframe content seems empty or minimal');
        // Set another timeout to check again
        embedCheckTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setHasError(true);
        }, 2000);
      }
    } catch (error) {
      // Cross-origin blocking is expected and means content loaded
      console.log('Cross-origin access blocked - content likely loaded successfully');
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleIframeLoad = () => {
    console.log('Iframe onLoad event fired');
    
    // Clear the initial timeout since load event fired
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Give a moment for content to render, then check
    setTimeout(() => {
      checkIframeContent();
    }, 1000);
  };

  const handleIframeError = () => {
    console.log('Iframe onError event fired');
    setIsLoading(false);
    setHasError(true);
  };

  const handleOpenInNewTab = () => {
    // Use the original URL without embed parameters for better experience
    let urlToOpen = previewUrl;
    
    // If it's a books.google.com URL, optimize it for direct viewing
    if (previewUrl.includes('books.google.com')) {
      urlToOpen = previewUrl
        .replace('output=embed', 'output=reader')
        .replace('&lpg=PP1&pg=PP1', '');
    }
    
    console.log('Opening in new tab:', urlToOpen);
    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700/50 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
          <div>
            <h3 className="text-slate-200 font-medium text-lg">{bookTitle}</h3>
            <p className="text-slate-400 text-sm">{bookAuthor}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Open in Google Books"
            >
              Open in Google Books
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
          {isLoading && (
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
              ref={iframeRef}
              key={currentUrl}
              src={currentUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`Google Books - ${bookTitle}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ background: 'white' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
