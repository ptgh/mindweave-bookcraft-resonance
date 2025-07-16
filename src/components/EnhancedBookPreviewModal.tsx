import { useState, useEffect } from "react";
import { X, ExternalLink, Smartphone, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { AppleBook, searchAppleBooks, generateAppleBooksWebUrl, generateAppleBooksDeepLink, canOpenAppleBooksApp } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { useToast } from "@/hooks/use-toast";

interface EnhancedBookPreviewModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const EnhancedBookPreviewModal = ({ book, onClose, onAddBook }: EnhancedBookPreviewModalProps) => {
  const [appleBook, setAppleBook] = useState<AppleBook | null>(null);
  const [googleFallback, setGoogleFallback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting book preview fetch for:', {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      });

      try {
        // Try Apple Books first
        console.log('📱 Attempting Apple Books search...');
        const appleResult = await searchAppleBooks(book.title, book.author, book.isbn);
        
        if (appleResult) {
          console.log('✅ Apple Books result found:', appleResult);
          setAppleBook(appleResult);
        } else {
          console.log('❌ No Apple Books result, falling back to Google Books');
          // Fallback to Google Books for additional data
          const googleBooks = await searchGoogleBooks(`${book.title} ${book.author}`, 1);
          if (googleBooks.length > 0) {
            console.log('📚 Google Books fallback result:', googleBooks[0]);
            setGoogleFallback(googleBooks[0]);
          }
        }
      } catch (err) {
        console.error('💥 Error fetching book data:', err);
        setError('Failed to load book preview data');
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [book.title, book.author, book.isbn]);

  const handleBuyOnAppleBooks = async () => {
    if (!appleBook) return;

    const confirmed = window.confirm(
      "You are about to leave the app to purchase this book on Apple Books. Continue?"
    );

    if (!confirmed) return;

    try {
      // Try deep link first if on iOS
      if (canOpenAppleBooksApp()) {
        const deepLink = generateAppleBooksDeepLink(appleBook.id);
        window.location.href = deepLink;
        
        // Fallback to web if deep link fails (after a short delay)
        setTimeout(() => {
          const webUrl = generateAppleBooksWebUrl(appleBook.id);
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        }, 1000);
      } else {
        // Open web store directly
        const webUrl = generateAppleBooksWebUrl(appleBook.id);
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }

      toast({
        title: "Opening Apple Books",
        description: "Redirecting to Apple Books store...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open Apple Books. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayData = appleBook || googleFallback || book;
  const hasAppleData = !!appleBook;
  const coverUrl = appleBook?.coverUrl || googleFallback?.coverUrl || book.cover_url;
  const description = appleBook?.description || googleFallback?.description || book.editorial_note;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-cyan-400/30 rounded-lg w-full max-w-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-4 border-b border-cyan-400/20">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 text-sm font-medium tracking-wider">
                {hasAppleData ? 'APPLE BOOKS PREVIEW' : 'BOOK PREVIEW'}
              </span>
              {hasAppleData && (
                <Badge variant="outline" className="border-green-400/50 text-green-400 bg-green-400/10">
                  Apple Data
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-cyan-400/50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-spin border-t-transparent" />
              </div>
              <p className="text-slate-400">Loading book preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Book details */}
              <div className="flex space-x-6">
                {/* Book cover */}
                <div className="flex-shrink-0 w-32 h-48 bg-slate-800/50 border border-cyan-400/30 rounded overflow-hidden relative">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={displayData.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center text-cyan-400 text-2xl ${coverUrl ? 'hidden' : ''}`}>
                    <div className="w-16 h-20 border-2 border-cyan-400/50 rounded animate-pulse flex items-center justify-center">
                      <div className="w-8 h-10 border border-cyan-400/30 rounded" />
                    </div>
                  </div>
                  
                  {/* Cover glow effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {/* Book info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-cyan-200 font-semibold text-xl leading-tight mb-2">
                      {displayData.title}
                    </h2>
                    <p className="text-slate-400 text-lg mb-2">{displayData.author}</p>
                    
                    {book.isbn && (
                      <p className="text-slate-500 text-sm font-mono mb-2">ISBN: {book.isbn}</p>
                    )}
                    
                    {/* Apple Books price */}
                    {hasAppleData && appleBook && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-slate-400 text-sm">Apple Books Price:</span>
                        <Badge variant="outline" className="border-green-400/50 text-green-400">
                          {appleBook.formattedPrice || 
                           (appleBook.price === 0 ? 'Free' : 
                            `${appleBook.currency || '£'}${appleBook.price || 'N/A'}`)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Description/Synopsis */}
                  {description && (
                    <div className="space-y-2">
                      <h3 className="text-slate-300 font-medium">Synopsis</h3>
                      <div className="text-slate-400 text-sm leading-relaxed p-4 bg-slate-800/30 border-l-2 border-cyan-400/30 rounded max-h-40 overflow-y-auto">
                        {description.split('\n').map((paragraph, index) => (
                          <p key={index} className={index > 0 ? 'mt-2' : ''}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Apple Books Call-to-Action */}
              {hasAppleData && appleBook && (
                <div className="border-t border-cyan-400/20 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-cyan-900/20 border border-cyan-400/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium">Available on Apple Books</p>
                        <p className="text-slate-400 text-sm">Get this book from Apple's digital bookstore</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleBuyOnAppleBooks}
                      className="bg-cyan-600/70 hover:bg-cyan-600/90 text-white border-0 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-200"
                    >
                      {canOpenAppleBooksApp() ? (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Buy on Apple Books
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Buy on Apple Books
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 p-4 border-t border-cyan-400/20 bg-slate-900/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:border-cyan-400/50"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-cyan-600/70 hover:bg-cyan-600/90 text-white border-0 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add to Transmissions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookPreviewModal;