import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, Smartphone, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { AppleBook, searchAppleBooks, generateAppleBooksWebUrl, generateAppleBooksDeepLink, canOpenAppleBooksApp } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { useToast } from "@/hooks/use-toast";
import { gsap } from "gsap";

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
  const appleBooksButtonRef = useRef<HTMLButtonElement>(null);

  // GSAP hover animations for Apple Books button
  useEffect(() => {
    const button = appleBooksButtonRef.current;
    if (button) {
      const handleMouseEnter = () => {
        gsap.to(button, {
          borderColor: "#89b4fa",
          boxShadow: "0 0 8px #89b4fa66",
          duration: 0.3,
          ease: "power2.inOut"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(button, {
          borderColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 0 0px transparent",
          duration: 0.3,
          ease: "power2.inOut"
        });
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [appleBook]);

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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-200 text-base font-medium">
                Signal Preview
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-slate-600/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-slate-400">Loading book preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* Book details */}
              <div className="flex space-x-4">
                {/* Book cover */}
                <div className="flex-shrink-0 w-24 h-36 bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden relative shadow-lg">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={displayData.title} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center text-slate-400 ${coverUrl ? 'hidden' : ''}`}>
                    <div className="w-12 h-16 border-2 border-slate-600 rounded flex items-center justify-center">
                      <div className="w-6 h-8 border border-slate-600 rounded" />
                    </div>
                  </div>
                </div>
                
                {/* Book info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-slate-200 font-bold text-xl leading-tight">
                      {displayData.title}
                    </h2>
                    <p className="text-slate-400 text-base font-medium">{displayData.author}</p>
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              {description && (
                <div className="space-y-2">
                  <h3 className="text-slate-200 font-semibold text-base">Synopsis</h3>
                  <div className="text-slate-400 text-sm leading-relaxed max-h-32 overflow-y-auto scrollbar-hide">
                    {description.split('\n').map((paragraph, index) => (
                      <p key={index} className={index > 0 ? 'mt-2' : ''}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Apple Books Section */}
              {hasAppleData && appleBook && (
                <div className="border border-slate-700 rounded-lg p-3 bg-slate-700/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-200 text-sm font-medium">Apple Books</span>
                        <span className="text-slate-400 text-sm">
                          {appleBook.formattedPrice || 
                           (appleBook.price === 0 ? 'Free' : 
                            `${appleBook.currency || '£'}${appleBook.price || 'N/A'}`)}
                        </span>
                      </div>
                    </div>
                    <button
                      ref={appleBooksButtonRef}
                      onClick={handleBuyOnAppleBooks}
                      className="h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa]"
                      style={{
                        boxShadow: "0 0 0px transparent"
                      }}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between space-x-3 p-4 border-t border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 h-9 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-blue-600 text-white hover:bg-blue-700 flex-1 h-9"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Signal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookPreviewModal;