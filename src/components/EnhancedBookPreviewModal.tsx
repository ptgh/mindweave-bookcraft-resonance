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
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-card-foreground text-sm font-medium">
                {hasAppleData ? 'Apple Books Preview' : 'Book Preview'}
              </span>
              {hasAppleData && (
                <Badge variant="secondary" className="text-muted-foreground bg-muted">
                  Apple Data
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-card-foreground transition-colors p-1 rounded hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading book preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Book details */}
              <div className="flex space-x-6">
                {/* Book cover */}
                <div className="flex-shrink-0 w-36 h-54 bg-muted border border-border rounded-lg overflow-hidden relative shadow-lg">
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
                  <div className={`absolute inset-0 flex items-center justify-center text-muted-foreground ${coverUrl ? 'hidden' : ''}`}>
                    <div className="w-16 h-20 border-2 border-border rounded flex items-center justify-center">
                      <div className="w-8 h-10 border border-border rounded" />
                    </div>
                  </div>
                </div>
                
                {/* Book info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-card-foreground font-bold text-2xl leading-tight mb-3">
                      {displayData.title}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-3 font-medium">{displayData.author}</p>
                    
                    {book.isbn && (
                      <p className="text-muted-foreground text-sm font-mono mb-2">ISBN: {book.isbn}</p>
                    )}
                    
                    {/* Apple Books price - subtle */}
                    {hasAppleData && appleBook && (
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-muted-foreground text-xs">Price:</span>
                        <Badge variant="outline" className="text-muted-foreground border-muted text-xs">
                          {appleBook.formattedPrice || 
                           (appleBook.price === 0 ? 'Free' : 
                            `${appleBook.currency || '£'}${appleBook.price || 'N/A'}`)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Description/Synopsis */}
                  {description && (
                    <div className="space-y-3">
                      <h3 className="text-card-foreground font-semibold text-lg">Synopsis</h3>
                      <div className="text-muted-foreground text-sm leading-relaxed p-4 bg-muted/30 border border-border rounded-lg max-h-40 overflow-y-auto scrollbar-hide">
                        {description.split('\n').map((paragraph, index) => (
                          <p key={index} className={index > 0 ? 'mt-3' : ''}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Apple Books Call-to-Action - subtle */}
              {hasAppleData && appleBook && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between p-3 bg-muted/20 border border-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Available on Apple Books</span>
                    </div>
                    <Button
                      onClick={handleBuyOnAppleBooks}
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground border-muted hover:bg-muted/50 text-xs"
                    >
                      {canOpenAppleBooksApp() ? (
                        <>
                          <Smartphone className="w-3 h-3 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          View
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
        <div className="flex justify-end space-x-3 p-4 border-t border-border bg-muted/10">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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