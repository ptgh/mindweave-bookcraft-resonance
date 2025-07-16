import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, Smartphone, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { AppleBook, searchAppleBooks, generateAppleBooksWebUrl, generateAppleBooksDeepLink, canOpenAppleBooksApp } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { useToast } from "@/hooks/use-toast";
import { searchFreeEbooks, EbookSearchResult } from "@/services/freeEbookService";
import { gsap } from "gsap";
import { analyticsService } from "@/services/analyticsService";
import { getOptimizedSettings } from "@/utils/performance";

interface EnhancedBookPreviewModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const EnhancedBookPreviewModal = ({ book, onClose, onAddBook }: EnhancedBookPreviewModalProps) => {
  const [appleBook, setAppleBook] = useState<AppleBook | null>(null);
  const [googleFallback, setGoogleFallback] = useState<any>(null);
  const [freeEbooks, setFreeEbooks] = useState<EbookSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const digitalCopyButtonRef = useRef<HTMLButtonElement>(null);

  // GSAP hover animations for digital copy button
  useEffect(() => {
    const button = digitalCopyButtonRef.current;
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
  }, [appleBook, freeEbooks]);

  useEffect(() => {
    const fetchBookData = async () => {
      const startTime = Date.now();
      setLoading(true);
      setError(null);

      console.log('🔍 [BookPreview] Starting fetch for:', {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        timestamp: new Date().toISOString()
      });

      // Log preview interaction
      await analyticsService.logBookPreview(
        { title: book.title, author: book.author, isbn: book.isbn },
        'publisher_resonance'
      );

      try {
        const settings = getOptimizedSettings();
        const searchResults = { apple: false, freeEbooks: false, google: false };
        
        // Try Apple Books first with detailed timing
        console.log('📱 [BookPreview] Attempting Apple Books search...');
        const appleStartTime = Date.now();
        const appleResult = await searchAppleBooks(book.title, book.author, book.isbn);
        const appleResponseTime = Date.now() - appleStartTime;
        
        if (appleResult) {
          console.log(`✅ [BookPreview] Apple Books result found in ${appleResponseTime}ms:`, {
            title: appleResult.title,
            price: appleResult.formattedPrice,
            hasDescription: !!appleResult.description,
            coverUrl: !!appleResult.coverUrl
          });
          setAppleBook(appleResult);
          searchResults.apple = true;
          
          await analyticsService.logApiResponse('apple_books', appleResponseTime, true);
        } else {
          console.log(`❌ [BookPreview] No Apple Books result after ${appleResponseTime}ms, searching free ebooks...`);
          await analyticsService.logApiResponse('apple_books', appleResponseTime, false);
          
          // Search for free ebooks with enhanced timeout handling
          const freeEbookStartTime = Date.now();
          const freeEbookPromise = searchFreeEbooks(book.title, book.author, book.isbn);
          const timeoutDuration = Math.max(settings.maxConcurrentRequests * 1000, 15000); // Min 15s timeout
          const timeoutPromise = new Promise<EbookSearchResult | null>(resolve => 
            setTimeout(() => {
              console.log(`⏰ [BookPreview] Free ebook search timed out after ${timeoutDuration}ms`);
              resolve(null);
            }, timeoutDuration)
          );
          
          const freeEbookResult = await Promise.race([freeEbookPromise, timeoutPromise]);
          const freeEbookResponseTime = Date.now() - freeEbookStartTime;
          
          console.log(`📚 [BookPreview] Free ebook search completed in ${freeEbookResponseTime}ms:`, {
            hasLinks: !!freeEbookResult?.hasLinks,
            hasGutenberg: !!freeEbookResult?.gutenberg,
            hasArchive: !!freeEbookResult?.archive,
            timedOut: freeEbookResult === null
          });
          
          setFreeEbooks(freeEbookResult);
          searchResults.freeEbooks = !!freeEbookResult?.hasLinks;
          
          await analyticsService.logApiResponse('free_ebooks', freeEbookResponseTime, !!freeEbookResult);
          
          // Fallback to Google Books for additional data (with enhanced caching)
          if (!freeEbookResult?.hasLinks) {
            console.log('📖 [BookPreview] No free ebooks found, trying Google Books fallback...');
            const googleStartTime = Date.now();
            const googleBooks = await searchGoogleBooks(`${book.title} ${book.author}`, 1);
            const googleResponseTime = Date.now() - googleStartTime;
            
            if (googleBooks.length > 0) {
              console.log(`✅ [BookPreview] Google Books fallback result found in ${googleResponseTime}ms:`, {
                title: googleBooks[0].title,
                hasDescription: !!googleBooks[0].description,
                coverUrl: !!googleBooks[0].coverUrl
              });
              setGoogleFallback(googleBooks[0]);
              searchResults.google = true;
            } else {
              console.log(`❌ [BookPreview] No Google Books result after ${googleResponseTime}ms`);
            }
            
            await analyticsService.logApiResponse('google_books', googleResponseTime, googleBooks.length > 0);
          }
        }
        
        const totalResponseTime = Date.now() - startTime;
        console.log(`🎯 [BookPreview] Search summary for "${book.title}" (${totalResponseTime}ms):`, searchResults);
        
        // Log search patterns for analytics
        await analyticsService.logSearchPattern(
          { title: book.title, author: book.author, isbn: book.isbn },
          {
            isNonEnglish: !/^[a-zA-Z0-9\s.,!?'-]+$/.test(book.title),
            hasSpecialChars: /[^\w\s.,!?'-]/.test(book.title),
            titleLength: book.title.length,
            priority: searchResults.apple ? 'high' : searchResults.freeEbooks ? 'normal' : 'low'
          },
          'publisher_resonance'
        );
        
        // Log digital library success/failure
        await analyticsService.logDigitalLibrarySuccess(
          { title: book.title, author: book.author, isbn: book.isbn },
          {
            apple: searchResults.apple,
            gutenberg: !!freeEbooks?.gutenberg,
            archive: !!freeEbooks?.archive,
            google: searchResults.google
          },
          'publisher_resonance'
        );
        
        // Log "No Signal Detected" cases for pattern analysis
        if (!searchResults.apple && !searchResults.freeEbooks && !searchResults.google) {
          await analyticsService.logNoSignalDetected(
            { title: book.title, author: book.author, isbn: book.isbn },
            { apple: true, freeEbooks: true, google: true }, // All attempts made
            'publisher_resonance'
          );
        }
      } catch (err) {
        console.error('💥 Error fetching book data:', err);
        setError('Failed to load book preview data');
        
        const responseTime = Date.now() - startTime;
        await analyticsService.logApiResponse('book_preview', responseTime, false);
        
        // Log error interaction
        await analyticsService.logBookInteraction({
          book_title: book.title,
          book_author: book.author,
          book_isbn: book.isbn,
          interaction_type: 'preview',
          source_context: 'publisher_resonance',
          success: false,
          error_details: err instanceof Error ? err.message : 'Unknown error',
          response_time_ms: responseTime
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [book.title, book.author, book.isbn]);

  const handleDigitalCopyAction = async () => {
    // Apple Books
    if (appleBook) {
      await analyticsService.logDigitalCopyClick(
        { title: book.title, author: book.author, isbn: book.isbn },
        'apple_books',
        'publisher_resonance'
      );

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
      return;
    }

    // Internet Archive
    if (freeEbooks?.archive?.url) {
      await analyticsService.logDigitalCopyClick(
        { title: book.title, author: book.author, isbn: book.isbn },
        'internet_archive',
        'publisher_resonance'
      );

      window.open(freeEbooks.archive.url, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening Digital Library",
        description: "Redirecting to digital library...",
      });
      return;
    }

    // Project Gutenberg
    if (freeEbooks?.gutenberg?.url) {
      await analyticsService.logDigitalCopyClick(
        { title: book.title, author: book.author, isbn: book.isbn },
        'project_gutenberg',
        'publisher_resonance'
      );

      window.open(freeEbooks.gutenberg.url, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening Digital Library",
        description: "Redirecting to digital library...",
      });
      return;
    }
  };

  const displayData = appleBook || googleFallback || book;
  const coverUrl = appleBook?.coverUrl || googleFallback?.coverUrl || book.cover_url;
  const description = appleBook?.description || googleFallback?.description || book.editorial_note;

  // Determine which digital copy option to show
  const getDigitalCopyInfo = () => {
    if (appleBook) {
      return {
        service: 'Apple Books',
        hasPrice: true,
        price: appleBook.formattedPrice || 
               (appleBook.price === 0 ? 'Free' : 
                `${appleBook.currency || '£'}${appleBook.price || 'N/A'}`),
        buttonText: 'Buy',
        disabled: false
      };
    }
    
    if (freeEbooks?.archive?.url) {
      return {
        service: 'Internet Archive',
        hasPrice: false,
        buttonText: 'Read',
        disabled: false
      };
    }
    
    if (freeEbooks?.gutenberg?.url) {
      return {
        service: 'Project Gutenberg',
        hasPrice: false,
        buttonText: 'Read',
        disabled: false
      };
    }
    
    return {
      service: 'Digital Libraries',
      hasPrice: false,
      buttonText: 'No Signal Detected',
      disabled: true
    };
  };

  const digitalCopyInfo = getDigitalCopyInfo();
  const hasDigitalCopy = !!(appleBook || freeEbooks?.archive?.url || freeEbooks?.gutenberg?.url);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="p-3 border-b border-slate-700">
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
        <div className="pt-4 px-6 pb-6">
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
              
              {/* Digital Copy Section */}
              <div className="border border-slate-700 rounded-lg p-2 bg-slate-700/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-200 text-sm font-medium">{digitalCopyInfo.service}</span>
                      {digitalCopyInfo.hasPrice && (
                        <span className="text-slate-400 text-sm">{digitalCopyInfo.price}</span>
                      )}
                    </div>
                  </div>
                  <button
                    ref={digitalCopyButtonRef}
                    onClick={digitalCopyInfo.disabled ? undefined : handleDigitalCopyAction}
                    disabled={digitalCopyInfo.disabled}
                    className={`h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-xs rounded-lg transition-all duration-300 ease-in-out ${
                      digitalCopyInfo.disabled 
                        ? 'text-slate-500 cursor-not-allowed' 
                        : 'text-[#cdd6f4] hover:border-[#89b4fa]'
                    }`}
                    style={{
                      boxShadow: "0 0 0px transparent"
                    }}
                  >
                    {digitalCopyInfo.buttonText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between space-x-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa]"
            style={{
              boxShadow: "0 0 0px transparent"
            }}
          >
            Close
          </button>
          <button
            onClick={async () => {
              await analyticsService.logBookAdd(
                { title: book.title, author: book.author, isbn: book.isbn },
                'publisher_resonance'
              );
              onAddBook(book);
              toast({
                title: "Signal Logged",
                description: `"${book.title}" added to your collection`,
              });
              onClose();
            }}
            className="flex-1 h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa] flex items-center justify-center"
            style={{
              boxShadow: "0 0 0px transparent"
            }}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Signal
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookPreviewModal;