import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Smartphone, Globe, Plus, Share2, FileText, User, BookOpen } from "lucide-react";
import EnhancedBookCover from "@/components/EnhancedBookCover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { AppleBook, searchAppleBooks, generateAppleBooksWebUrl, generateAppleBooksDeepLink, canOpenAppleBooksApp } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { searchFreeEbooks, EbookSearchResult } from "@/services/freeEbookService";
import { gsap } from "gsap";
import { analyticsService } from "@/services/analyticsService";
import { getOptimizedSettings } from "@/utils/performance";
import ShareBookModal from "@/components/ShareBookModal";
import ScreenplayReaderModal from "@/components/ScreenplayReaderModal";
import { supabase } from "@/integrations/supabase/client";
import { ScifiAuthor } from "@/services/scifiAuthorsService";
import { AuthorPopup } from "@/components/AuthorPopup";
import { AwardBadge } from "@/components/AwardBadge";

// Script/comic data interface for original screenplays and comics
interface ScriptData {
  film_title: string;
  film_year: number | null;
  director: string | null;
  book_author: string; // screenwriters or comic artist
  poster_url: string | null;
  book_cover_url: string | null;
  script_url: string | null;
  script_source: string | null;
  notable_differences?: string | null;
  adaptation_type?: string | null; // 'original', 'comic', etc.
}

interface EnhancedBookPreviewModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
  // Optional script mode for original screenplays
  scriptData?: ScriptData | null;
}

const EnhancedBookPreviewModal = ({ book, onClose, onAddBook, scriptData }: EnhancedBookPreviewModalProps) => {
  const [appleBook, setAppleBook] = useState<AppleBook | null>(null);
  const [googleFallback, setGoogleFallback] = useState<any>(null);
  const [freeEbooks, setFreeEbooks] = useState<EbookSearchResult | null>(null);
  const [loading, setLoading] = useState(!scriptData); // Don't load for scripts
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComicReader, setShowComicReader] = useState(false);
  const { toast } = useEnhancedToast();
  const digitalCopyButtonRef = useRef<HTMLButtonElement>(null);
  
  // Script or comic mode
  const isScriptMode = !!scriptData;
  const isComicMode = scriptData?.adaptation_type === 'comic';
  
  // Script writer popup state
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);

  // Parse writers from book_author field (e.g., "Fred Dekker & Shane Black")
  const parseWriters = (authorString: string): string[] => {
    if (!authorString || authorString === 'Unknown Screenwriter') return [];
    return authorString
      .split(/\s*[&,]\s*|\s+and\s+/i)
      .map(name => name.trim())
      .filter(name => name.length > 0 && name !== 'Unknown Screenwriter');
  };

  const writers = scriptData ? parseWriters(scriptData.book_author) : [];

  // Handle writer click - open AuthorPopup
  const handleWriterClick = async (writerName: string) => {
    const { data } = await supabase
      .from('scifi_authors')
      .select('*')
      .ilike('name', `%${writerName}%`)
      .limit(1)
      .single();

    if (data) {
      setSelectedAuthor(data as ScifiAuthor);
    } else {
      setSelectedAuthor({
        id: 'temp',
        name: writerName,
        created_at: '',
        updated_at: '',
      } as ScifiAuthor);
    }
    setShowAuthorPopup(true);
  };

  // Get script URL - prefer direct PDF if available
  const getScriptUrl = (): string | null => {
    if (!scriptData?.script_url) return null;
    
    // If it's already a PDF URL, use it directly
    if (scriptData.script_url.endsWith('.pdf') || scriptData.script_url.includes('/pdf/')) {
      return scriptData.script_url;
    }
    
    // If it's a ScriptSlug page URL, try to construct direct PDF link
    if (scriptData.script_url.includes('scriptslug.com/script/')) {
      const scriptPath = scriptData.script_url.split('/script/')[1];
      if (scriptPath) {
        return `https://assets.scriptslug.com/live/pdf/scripts/${scriptPath}.pdf`;
      }
    }
    
    return scriptData.script_url;
  };

  const scriptUrl = getScriptUrl();
  const scriptSourceLabel = isComicMode ? 'Comic Book' :
                           scriptData?.script_source === 'scriptslug' ? 'ScriptSlug' : 
                           scriptData?.script_source === 'imsdb' ? 'IMSDb' : 
                           scriptData?.script_source === 'Comic Book' ? 'Comic Book' : 'Script';

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
    // Skip API calls for script mode - scripts don't need book lookups
    if (isScriptMode) {
      setLoading(false);
      return;
    }
    
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
        
        // Launch Apple Books and Free Ebooks in parallel to avoid gating
        const appleStartTime = Date.now();
        const freeEbookStartTime = Date.now();
        
        const applePromise = searchAppleBooks(book.title, book.author, book.isbn);
        const freePromise = (async () => {
          const freeEbookPromise = searchFreeEbooks(book.title, book.author, book.isbn, { forceRefresh: true });
          const timeoutDuration = Math.max(settings.maxConcurrentRequests * 1000, 15000); // Min 15s timeout
          const timeoutPromise = new Promise<EbookSearchResult | null>(resolve => 
            setTimeout(() => {
              console.log(`⏰ [BookPreview] Free ebook search timed out after ${timeoutDuration}ms`);
              resolve(null);
            }, timeoutDuration)
          );
          return Promise.race([freeEbookPromise, timeoutPromise]);
        })();
        
        const [appleResult, freeEbookResult] = await Promise.allSettled([applePromise, freePromise]).then((results) => {
          const apple = results[0].status === 'fulfilled' ? (results[0].value as AppleBook | null) : null;
          const free = results[1].status === 'fulfilled' ? (results[1].value as EbookSearchResult | null) : null;
          return [apple, free] as const;
        });
        
        const appleResponseTime = Date.now() - appleStartTime;
        const freeEbookResponseTime = Date.now() - freeEbookStartTime;
        
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
          console.log(`❌ [BookPreview] No Apple Books result after ${appleResponseTime}ms`);
          await analyticsService.logApiResponse('apple_books', appleResponseTime, false);
        }
        
        if (freeEbookResult) {
          console.log(`📚 [BookPreview] Free ebook search completed in ${freeEbookResponseTime}ms:`, {
            hasLinks: !!freeEbookResult?.hasLinks,
            hasGutenberg: !!freeEbookResult?.gutenberg,
            hasArchive: !!freeEbookResult?.archive,
            timedOut: freeEbookResult === null
          });
          setFreeEbooks(freeEbookResult);
          searchResults.freeEbooks = !!freeEbookResult?.hasLinks;
          await analyticsService.logApiResponse('free_ebooks', freeEbookResponseTime, !!freeEbookResult);
        }
        
        // Fallback to Google Books only if nothing else found
        if (!appleResult && !freeEbookResult?.hasLinks) {
          console.log('📖 [BookPreview] No Apple or free ebooks found, trying Google Books fallback...');
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
  }, [book.title, book.author, book.isbn, isScriptMode]);

  const handleDigitalCopyAction = () => {
    // Utility to normalize strings for comparison (duplicated here for access before render)
    const normalizeForMatchAction = (s: string): string => 
      s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const isValidMatchAction = (externalTitle: string | undefined, externalAuthor: string | undefined): boolean => {
      if (!externalTitle) return false;
      
      const normBookTitle = normalizeForMatchAction(book.title);
      const normExternalTitle = normalizeForMatchAction(externalTitle);
      const normBookAuthor = normalizeForMatchAction(book.author);
      const normExternalAuthor = normalizeForMatchAction(externalAuthor || '');
      
      const titleMatches = normExternalTitle === normBookTitle || 
                           normExternalTitle.includes(normBookTitle) || 
                           normBookTitle.includes(normExternalTitle);
      
      const authorMatches = !externalAuthor || 
                            normExternalAuthor.includes(normBookAuthor.split(' ')[0]) ||
                            normBookAuthor.includes(normExternalAuthor.split(' ')[0]);
      
      return titleMatches && authorMatches;
    };

    // Apple Books - only if validated
    const isAppleValid = appleBook && isValidMatchAction(appleBook.title, appleBook.author);
    if (isAppleValid) {
      // Open link FIRST (synchronously) to preserve user gesture for Safari
      try {
        const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
        
        if (isAppleDevice) {
          const deepLink = generateAppleBooksDeepLink(appleBook.id);
          window.location.href = deepLink;
          
          toast({
            title: "Opening Apple Books",
            description: "Launching Apple Books app...",
          });
        } else {
          const webUrl = generateAppleBooksWebUrl(appleBook.id);
          window.open(webUrl, '_blank', 'noopener,noreferrer');
          
          toast({
            title: "Opening Apple Books",
            description: "Opening in web browser...",
          });
        }
        
        // Log analytics AFTER opening (non-blocking)
        analyticsService.logDigitalCopyClick(
          { title: book.title, author: book.author, isbn: book.isbn },
          'apple_books',
          'publisher_resonance'
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to open Apple Books. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    // Internet Archive - already validated by freeEbookService
    if (freeEbooks?.archive?.url) {
      // Open link FIRST to preserve user gesture for Safari mobile
      window.location.href = freeEbooks.archive.url;
      
      toast({
        title: "Opening Digital Library",
        description: "Redirecting to digital library...",
      });
      
      // Log analytics AFTER (non-blocking)
      analyticsService.logDigitalCopyClick(
        { title: book.title, author: book.author, isbn: book.isbn },
        'internet_archive',
        'publisher_resonance'
      );
      return;
    }

    // Project Gutenberg - already validated by freeEbookService
    if (freeEbooks?.gutenberg?.url) {
      // Open link FIRST to preserve user gesture for Safari mobile
      window.location.href = freeEbooks.gutenberg.url;
      
      toast({
        title: "Opening Digital Library",
        description: "Redirecting to digital library...",
      });
      
      // Log analytics AFTER (non-blocking)
      analyticsService.logDigitalCopyClick(
        { title: book.title, author: book.author, isbn: book.isbn },
        'project_gutenberg',
        'publisher_resonance'
      );
      return;
    }
  };

  // Utility to normalize strings for comparison
  const normalizeForMatch = (s: string): string => 
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Extract meaningful words from a title (ignoring common words)
  const extractKeywords = (s: string): string[] => {
    const stopWords = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'to', 'for', 'on', 'at']);
    return normalizeForMatch(s)
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  // Calculate similarity score between two strings (0-100)
  const calculateSimilarity = (s1: string, s2: string): number => {
    const words1 = extractKeywords(s1);
    const words2 = extractKeywords(s2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matchCount = 0;
    for (const word of words1) {
      if (words2.some(w => w.includes(word) || word.includes(w))) {
        matchCount++;
      }
    }
    
    return (matchCount / Math.max(words1.length, words2.length)) * 100;
  };

  // Check if external result actually matches our book (prevents wrong cover images)
  // Uses STRICT matching to prevent mismatches like "The Medusa Touch" → wrong cover
  const isValidMatch = (externalTitle: string | undefined, externalAuthor: string | undefined): boolean => {
    if (!externalTitle) return false;
    
    const normBookTitle = normalizeForMatch(book.title);
    const normExternalTitle = normalizeForMatch(externalTitle);
    const normBookAuthor = normalizeForMatch(book.author);
    const normExternalAuthor = normalizeForMatch(externalAuthor || '');
    
    // STRICT title matching: 
    // 1. Exact match, OR
    // 2. High similarity score (>= 80%), OR  
    // 3. One title is a significant substring of the other (>50% overlap)
    const titleExact = normExternalTitle === normBookTitle;
    const titleSimilarity = calculateSimilarity(book.title, externalTitle);
    const titleSubstringMatch = (
      (normExternalTitle.includes(normBookTitle) && normBookTitle.length >= 5) ||
      (normBookTitle.includes(normExternalTitle) && normExternalTitle.length >= 5)
    );
    
    const titleMatches = titleExact || titleSimilarity >= 80 || titleSubstringMatch;
    
    // STRICT author matching: Last name must match
    const getLastName = (name: string): string => {
      const parts = normalizeForMatch(name).split(' ');
      return parts[parts.length - 1] || '';
    };
    
    const bookLastName = getLastName(book.author);
    const externalLastName = getLastName(externalAuthor || '');
    
    // Author last names must match (or external author not provided)
    const authorMatches = !externalAuthor || 
                          externalLastName === bookLastName ||
                          normExternalAuthor.includes(bookLastName) ||
                          normBookAuthor.includes(externalLastName);
    
    // Both must match for validation to pass
    const isValid = titleMatches && authorMatches;
    
    // Debug logging for development
    if (!isValid && (titleSimilarity > 30 || normExternalAuthor.includes(bookLastName))) {
      console.log('[BookPreview] Near-match rejected:', {
        book: { title: book.title, author: book.author },
        external: { title: externalTitle, author: externalAuthor },
        titleSimilarity,
        titleMatches,
        authorMatches
      });
    }
    
    return isValid;
  };

  // Validate external results before using their cover images
  const validAppleBook = appleBook && isValidMatch(appleBook.title, appleBook.author) ? appleBook : null;
  const validGoogleBook = googleFallback && isValidMatch(googleFallback.title, googleFallback.author) ? googleFallback : null;

  // Log mismatches for debugging
  if (appleBook && !validAppleBook) {
    console.warn('⚠️ [BookPreview] Apple Books result mismatch - discarding:', {
      requested: { title: book.title, author: book.author },
      received: { title: appleBook.title, author: appleBook.author }
    });
  }
  if (googleFallback && !validGoogleBook) {
    console.warn('⚠️ [BookPreview] Google Books result mismatch - discarding:', {
      requested: { title: book.title, author: book.author },
      received: { title: googleFallback.title, author: googleFallback.author }
    });
  }

  // For scripts/comics, use script data; for books, use API results or fallback
  const displayData = isScriptMode 
    ? { 
        title: isComicMode ? book.title : scriptData!.film_title, 
        author: scriptData!.book_author 
      }
    : (validAppleBook || validGoogleBook || book);
  
  // For scripts, show neutral icon; for comics, show the comic cover; for books, use cover hierarchy
  // IMPORTANT: Only use external API cover if the result was validated as matching
  const coverUrl = isScriptMode 
    ? (isComicMode ? (book.cover_url || scriptData?.book_cover_url) : null)
    : (book.cover_url || book.google_cover_url || validAppleBook?.coverUrl || validGoogleBook?.coverUrl);
  
  // Description - use validated API results or editorial note (not for scripts)
  const description = isScriptMode 
    ? scriptData?.notable_differences 
    : (validAppleBook?.description || validGoogleBook?.description || book.editorial_note);

  // Determine which digital copy option to show (use validated Apple result only)
  const getDigitalCopyInfo = () => {
    if (validAppleBook) {
      return {
        service: 'Apple Books',
        hasPrice: true,
        price: validAppleBook.formattedPrice || 
               (validAppleBook.price === 0 ? 'Free' : 
                `${validAppleBook.currency || '£'}${validAppleBook.price || 'N/A'}`),
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
  const hasDigitalCopy = !!(validAppleBook || freeEbooks?.archive?.url || freeEbooks?.gutenberg?.url);

  const modal = (
    <div className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center bg-background/50 backdrop-blur-sm p-4">
      <div className="modal-content bg-slate-800/50 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${isComicMode ? 'bg-amber-400' : isScriptMode ? 'bg-cyan-400' : 'bg-blue-400'} rounded-full`}></div>
              <span className="text-slate-200 text-base font-medium">
                {isComicMode ? 'Biographical Comic' : isScriptMode ? 'Original Screenplay' : 'Signal Preview'}
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
        <div className="flex-1 overflow-y-auto scrollbar-hide pt-4 px-6 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-slate-600/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-slate-400">Loading preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* Cover + Info */}
              <div className="flex space-x-4">
                {/* Cover */}
                <div className="flex-shrink-0 w-24 h-36 bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden relative shadow-lg">
                  {isScriptMode && !isComicMode ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <FileText className="w-8 h-8 text-cyan-400/50" />
                    </div>
                  ) : (
                    <EnhancedBookCover
                      title={displayData.title}
                      author={displayData.author}
                      isbn={book.isbn}
                      coverUrl={coverUrl}
                      className="w-24 h-36"
                    />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-slate-200 font-bold text-xl leading-tight">
                      {displayData.title}
                    </h2>
                    {!isScriptMode && (
                      <AwardBadge 
                        title={displayData.title} 
                        author={displayData.author} 
                        size="md" 
                        showAll 
                        className="mt-2"
                      />
                    )}
                    {isScriptMode ? (
                      <>
                        <Badge variant="outline" className="mt-1 text-cyan-400 border-cyan-400/30 bg-cyan-400/10 text-xs">
                          Original Screenplay
                        </Badge>
                        {scriptData?.film_year && (
                          <p className="text-muted-foreground text-sm mt-1">{scriptData.film_year}</p>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleWriterClick(displayData.author)}
                        className="text-slate-400 text-base font-medium hover:text-emerald-400 transition-colors cursor-pointer text-left"
                      >
                        {displayData.author}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Script Mode: Writers Section */}
              {isScriptMode && writers.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Written by</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {writers.map((writer, index) => (
                      <button
                        key={index}
                        onClick={() => handleWriterClick(writer)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg text-sm text-emerald-300 hover:text-emerald-200 transition-all flex items-center gap-1.5"
                      >
                        <User className="w-3 h-3" />
                        {writer}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Script Mode: Director */}
              {isScriptMode && scriptData?.director && (
                <div className="text-sm text-muted-foreground">
                  <span className="text-amber-400">Director:</span> {scriptData.director}
                </div>
              )}

              {/* Script/Comic Mode: Read Button */}
              {isScriptMode && scriptUrl && (
                isComicMode ? (
                  <button
                    onClick={() => setShowComicReader(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    Read Comic Book
                  </button>
                ) : (
                  <a
                    href={scriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    Read Script on {scriptSourceLabel}
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                )
              )}

              {/* Script Mode: No script available */}
              {isScriptMode && !scriptUrl && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isComicMode ? 'Comic not yet available in our database' : 'Script not yet available in our database'}
                  </p>
                </div>
              )}

              {/* Book Mode: Synopsis */}
              {!isScriptMode && description && (
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
              
              {/* Book Mode: Publisher Hard Copy Section */}
              {!isScriptMode && book.publisher_link && (
                <div className="border border-slate-700 rounded-lg p-2 bg-slate-700/20 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-200 text-sm font-medium">Publisher Store</span>
                        <span className="text-slate-400 text-sm">(Hard Copy)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (book.publisher_link) {
                          window.open(book.publisher_link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-xs rounded-lg transition-all duration-300 ease-in-out text-[#cdd6f4] hover:border-[#89b4fa]"
                      style={{
                        boxShadow: "0 0 0px transparent"
                      }}
                    >
                      Visit Store
                    </button>
                  </div>
                </div>
              )}

              {/* Book Mode: Digital Copy Section */}
              {!isScriptMode && (
                <div className="border border-slate-700 rounded-lg p-2 bg-slate-700/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-slate-400" />
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
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between space-x-3 p-4 border-t border-slate-700 flex-shrink-0">
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
            onClick={() => setShowShareModal(true)}
            className="h-9 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa] flex items-center justify-center"
            style={{
              boxShadow: "0 0 0px transparent"
            }}
          >
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </button>
          <button
            onClick={async () => {
              await analyticsService.logBookAdd(
                { title: book.title, author: book.author, isbn: book.isbn },
                'publisher_resonance'
              );
              onAddBook(book);
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

      {/* Share Modal */}
      {showShareModal && (
        <ShareBookModal
          book={{
            title: book.title,
            author: book.author,
            cover_url: coverUrl,
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Author Popup */}
      {selectedAuthor && (
        <AuthorPopup
          author={selectedAuthor}
          isVisible={showAuthorPopup}
          onClose={() => {
            setShowAuthorPopup(false);
            setSelectedAuthor(null);
          }}
        />
      )}

      {/* Comic Reader Modal - Rendered outside this modal's DOM via portal */}
      {showComicReader && scriptData && scriptData.script_url && (
        <ScreenplayReaderModal
          screenplay={{
            film_title: scriptData.film_title,
            script_url: scriptData.script_url,
            script_source: 'Comic Book',
            poster_url: scriptData.book_cover_url,
          }}
          isOpen={showComicReader}
          onClose={() => setShowComicReader(false)}
        />
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);

};

export default EnhancedBookPreviewModal;