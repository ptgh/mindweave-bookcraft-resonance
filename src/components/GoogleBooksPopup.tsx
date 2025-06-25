
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

  const handleIframeError = () => {
    console.log('Iframe failed to load');
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h3 className="text-slate-200 font-medium">{bookTitle}</h3>
            <p className="text-slate-400 text-sm">{bookAuthor}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 relative">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Loading book preview...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400 mb-4">Unable to load book preview</p>
                <Button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Open in Google Books
                </Button>
              </div>
            </div>
          )}
          
          <iframe
            src={previewUrl}
            className="w-full h-full rounded-b-lg"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Books - ${bookTitle}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
        
        <div className="p-4 border-t border-slate-700 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => window.open(previewUrl, '_blank')}
            className="text-slate-300 border-slate-600"
          >
            Open in New Tab
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksPopup;
