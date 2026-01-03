import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import BookBrowserHeader from "@/components/BookBrowserHeader";
import BookGrid from "@/components/BookGrid";
import BookBrowserEmpty from "@/components/BookBrowserEmpty";
import BookBrowserStatus from "@/components/BookBrowserStatus";
import { AuthorPopup } from "@/components/AuthorPopup";
import { useBookBrowser } from "@/hooks/useBookBrowser";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { getAuthorByName, findOrCreateAuthor, ScifiAuthor } from "@/services/scifiAuthorsService";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { getTransmissions, saveTransmission } from "@/services/transmissionsService";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import type { SpotlightBook } from "./Discovery";

const BookBrowser = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const spotlightKey = searchParams.get('spotlight');
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useEnhancedToast();
  
  // Read spotlight from sessionStorage IMMEDIATELY on mount (before any async operations)
  // This is the critical fix - useState initializer runs synchronously before render
  const [spotlightBook, setSpotlightBook] = useState<EnhancedBookSuggestion | null>(() => {
    if (spotlightKey) {
      const stored = sessionStorage.getItem(spotlightKey);
      if (stored) {
        try {
          const book = JSON.parse(stored);
          sessionStorage.removeItem(spotlightKey); // Clean up immediately
          console.log('BookBrowser: Loaded spotlight from sessionStorage:', book.title);
          
          // Transform SpotlightBook to EnhancedBookSuggestion
          return {
            id: `spotlight-${book.id}`,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl || book.metadata?.cover_url || '',
            thumbnailUrl: book.coverUrl || book.metadata?.cover_url || '',
            smallThumbnailUrl: book.coverUrl || book.metadata?.cover_url || '',
            description: book.description || '',
            categories: book.metadata?.categories || [],
          } as EnhancedBookSuggestion;
        } catch (e) {
          console.error('Failed to parse spotlight from sessionStorage:', e);
        }
      }
    }
    return null;
  });
  
  const {
    books,
    loading,
    visibleBooks,
    previouslyShownBooks,
    loadRandomBooks,
    addToTransmissions,
    aiRecommendations,
    hasLoadedOnce
  } = useBookBrowser();

  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [authorPopupVisible, setAuthorPopupVisible] = useState(false);
  const [userBooksCount, setUserBooksCount] = useState(0);
  
  // Search results from header search bar
  const [searchResultBooks, setSearchResultBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [searchedAuthor, setSearchedAuthor] = useState<ScifiAuthor | null>(null);
  
  // Related books from transmissions when navigating from Neural Map
  const [relatedBooks, setRelatedBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [fetchedTransmission, setFetchedTransmission] = useState<EnhancedBookSuggestion | null>(null);
  const [highlightAnimating, setHighlightAnimating] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  
  // Handle search results from header
  const handleSearchResults = useCallback((books: EnhancedBookSuggestion[], author?: ScifiAuthor) => {
    setSearchResultBooks(books);
    setSearchedAuthor(author || null);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchResultBooks([]);
    setSearchedAuthor(null);
  }, []);
  
  // Load user book count for AI toggle visibility
  useEffect(() => {
    const loadUserBooksCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from('transmissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          setUserBooksCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading user books count:', error);
      }
    };
    loadUserBooksCount();
  }, []);

  // Handle spotlight book highlighting and URL cleanup
  useEffect(() => {
    if (spotlightBook) {
      console.log('BookBrowser: Setting up spotlight highlight for:', spotlightBook.title);
      setHighlightedBookId(spotlightBook.id);
      setHighlightAnimating(true);
      setTimeout(() => setHighlightAnimating(false), 600);
      
      // Clear highlight styling after 5 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedBookId(null);
        // Clean up URL parameter
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('spotlight');
        setSearchParams(newParams, { replace: true });
      }, 5000);
    }
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [spotlightBook, searchParams, setSearchParams]);

  // Fetch highlighted transmission when navigating from search results (existing transmissions)
  useEffect(() => {
    const fetchHighlightedAndRelatedBooks = async () => {
      // Only require highlightId - searchQuery is optional
      if (!highlightId) return;
      
      console.log('BookBrowser: Attempting to fetch highlighted transmission ID:', highlightId);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('BookBrowser: No user logged in');
          return;
        }
        
        console.log('BookBrowser: Fetching transmission', highlightId, 'for user', user.id);
        
        // Fetch the transmission by ID
        const { data: transmission, error } = await supabase
          .from('transmissions')
          .select('*')
          .eq('id', parseInt(highlightId))
          .eq('user_id', user.id)
          .single();
        
        if (error || !transmission) {
          console.error('BookBrowser: Error fetching highlighted transmission:', error);
          console.log('BookBrowser: Transmission not found - it may belong to another user');
          return;
        }
        
        console.log('BookBrowser: Successfully fetched transmission:', transmission.title);
        
        // Safely parse tags - could be string or array
        let parsedTags: string[] = [];
        if (transmission.tags) {
          try {
            parsedTags = typeof transmission.tags === 'string' 
              ? JSON.parse(transmission.tags) 
              : transmission.tags;
          } catch {
            parsedTags = [];
          }
        }
        
        // Transform transmission to EnhancedBookSuggestion format
        const bookSuggestion: EnhancedBookSuggestion = {
          id: `transmission-${transmission.id}`,
          title: transmission.title || '',
          author: transmission.author || 'Unknown Author',
          coverUrl: transmission.cover_url || '',
          thumbnailUrl: transmission.cover_url || '',
          smallThumbnailUrl: transmission.cover_url || '',
          description: transmission.notes || '',
          categories: parsedTags,
        };
        
        setFetchedTransmission(bookSuggestion);
        setHighlightedBookId(bookSuggestion.id);
        console.log('Fetched highlighted transmission:', bookSuggestion.title);
        
        // Load related books based on shared tags
        if (parsedTags.length > 0) {
          // Get all user transmissions to find related ones
          const allTransmissions = await getTransmissions();
          
          // Find transmissions with matching tags (excluding the highlighted one)
          const related = allTransmissions
            .filter(t => t.id !== transmission.id)
            .map(t => {
              const tTags = t.tags || [];
              const matchingTags = tTags.filter((tag: string) => 
                parsedTags.some((hTag: string) => 
                  tag.toLowerCase() === hTag.toLowerCase()
                )
              );
              return { transmission: t, matchCount: matchingTags.length };
            })
            .filter(item => item.matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 12) // Get top 12 related books
            .map(item => ({
              id: `transmission-${item.transmission.id}`,
              title: item.transmission.title,
              author: item.transmission.author,
              coverUrl: item.transmission.cover_url || '',
              thumbnailUrl: item.transmission.cover_url || '',
              smallThumbnailUrl: item.transmission.cover_url || '',
              description: item.transmission.notes || '',
              categories: item.transmission.tags || [],
            }));
          
          console.log(`Found ${related.length} related books with matching tags`);
          setRelatedBooks(related);
        }
        
        setHighlightAnimating(true);
        setTimeout(() => setHighlightAnimating(false), 600);
        
        // Clear highlight styling after 5 seconds but KEEP the book visible
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedBookId(null);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('highlight');
          newParams.delete('search');
          setSearchParams(newParams, { replace: true });
        }, 5000);
        
      } catch (error) {
        console.error('Error fetching highlighted transmission:', error);
      }
    };
    
    fetchHighlightedAndRelatedBooks();
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightId, searchParams, setSearchParams]);

  // Handler to add spotlight book to user's library
  const handleAddSpotlightToLibrary = async () => {
    if (!spotlightBook) return;
    
    setIsAddingToLibrary(true);
    try {
      await saveTransmission({
        title: spotlightBook.title,
        author: spotlightBook.author,
        cover_url: spotlightBook.coverUrl || '',
        notes: spotlightBook.description || '',
        tags: spotlightBook.categories || [],
        status: 'want-to-read',
        rating: {},
      });
      
      toast({
        title: "Added to Library",
        description: `"${spotlightBook.title}" has been added to your transmissions.`,
      });
      
      // Clear spotlight after adding
      setSpotlightBook(null);
      setHighlightedBookId(null);
      
      // Refresh user book count
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('transmissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setUserBooksCount(count || 0);
      }
    } catch (error: any) {
      console.error('Error adding book to library:', error);
      
      // Check if it's a duplicate error
      if (error?.message?.startsWith('DUPLICATE:')) {
        const parts = error.message.split(':');
        const title = parts[1] || spotlightBook.title;
        const dateAdded = parts[2] || 'unknown date';
        
        toast({
          title: "Already in Your Library",
          description: `"${title}" was added on ${dateAdded}.`,
        });
        
        // Clear spotlight since it's already in library
        setSpotlightBook(null);
        setHighlightedBookId(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to add book to library. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  // Combine books: search results first, then spotlight/highlighted, then related, then regular books
  const displayBooks = useCallback((): EnhancedBookSuggestion[] => {
    // If we have search results, show only those
    if (searchResultBooks.length > 0) {
      return searchResultBooks;
    }
    
    const result: EnhancedBookSuggestion[] = [];
    const seenIds = new Set<string>();
    
    // Add spotlight book first (new book from search)
    if (spotlightBook) {
      result.push(spotlightBook);
      seenIds.add(spotlightBook.id);
    }
    
    // Add highlighted transmission (existing book from user's library)
    if (fetchedTransmission && !seenIds.has(fetchedTransmission.id)) {
      result.push(fetchedTransmission);
      seenIds.add(fetchedTransmission.id);
    }
    
    // Add related books from transmissions
    for (const book of relatedBooks) {
      if (!seenIds.has(book.id)) {
        result.push(book);
        seenIds.add(book.id);
      }
    }
    
    // Add regular Signal Collection books
    for (const book of books) {
      if (!seenIds.has(book.id)) {
        result.push(book);
        seenIds.add(book.id);
      }
    }
    
    return result;
  }, [spotlightBook, fetchedTransmission, relatedBooks, books, searchResultBooks]);

  const handleAuthorClick = async (authorName: string) => {
    console.log('Author clicked:', authorName);
    let author = await getAuthorByName(authorName);
    
    if (!author) {
      const authorId = await findOrCreateAuthor(authorName);
      if (authorId) {
        author = await getAuthorByName(authorName);
      }
    }
    
    if (author) {
      setSelectedAuthor(author);
      setAuthorPopupVisible(true);
    }
  };

  const closeAuthorPopup = () => {
    setAuthorPopupVisible(false);
  };

  const combinedBooks = displayBooks();
  const hasBooks = combinedBooks.length > 0 || books.length > 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div ref={addFeatureBlockRef} className="feature-block">
            <BookBrowserHeader 
              loading={loading}
              onDiscover={loadRandomBooks}
              userBooksCount={userBooksCount}
              onSearchResults={handleSearchResults}
              onClearSearch={handleClearSearch}
            />
          </div>

          {loading ? (
            <div ref={addFeatureBlockRef} className="feature-block text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
              </div>
              <p className="text-slate-400">Scanning the consciousness archive...</p>
            </div>
          ) : hasBooks ? (
            <div ref={addFeatureBlockRef} className="feature-block min-h-[60vh]">
          {/* Show section header when displaying spotlight or related books */}
              {(spotlightBook || fetchedTransmission || relatedBooks.length > 0) && (
                <div className="mb-6 text-center space-y-3">
                  {spotlightBook && (
                    <>
                      <p className="text-slate-400 text-sm">
                        Discovered: "{spotlightBook.title}" by {spotlightBook.author}
                      </p>
                      <button
                        onClick={handleAddSpotlightToLibrary}
                        disabled={isAddingToLibrary}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm rounded-lg transition-colors"
                      >
                        {isAddingToLibrary ? 'Adding...' : '+ Add to My Library'}
                      </button>
                    </>
                  )}
                  {!spotlightBook && fetchedTransmission && (
                    <p className="text-slate-400 text-sm">
                      {relatedBooks.length > 0 
                        ? `Showing "${fetchedTransmission?.title}" and ${relatedBooks.length} related signals`
                        : `Showing "${fetchedTransmission?.title}"`
                      }
                    </p>
                  )}
                </div>
              )}
              <BookGrid
                books={combinedBooks}
                visibleBooks={visibleBooks}
                onAddToTransmissions={addToTransmissions}
                onAuthorClick={handleAuthorClick}
                aiRecommendations={aiRecommendations}
                highlightedBookId={highlightedBookId}
                highlightAnimating={highlightAnimating}
              />
            </div>
          ) : hasLoadedOnce ? (
            <div ref={addFeatureBlockRef} className="feature-block">
              <BookBrowserEmpty onScan={loadRandomBooks} />
            </div>
          ) : (
            <div ref={addFeatureBlockRef} className="feature-block text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20" />
              </div>
              <h3 className="text-slate-200 text-lg mb-2">Ready to Scan</h3>
              <p className="text-slate-400 mb-6">Click the button above to scan the Signal Collection</p>
            </div>
          )}

          <div ref={addFeatureBlockRef} className="feature-block">
            <BookBrowserStatus 
              booksCount={combinedBooks.length}
              previouslyShownCount={previouslyShownBooks.size}
            />
          </div>
        </main>

        <AuthorPopup
          author={selectedAuthor}
          isVisible={authorPopupVisible}
          onClose={closeAuthorPopup}
          onAuthorUpdate={setSelectedAuthor}
        />
      </div>
    </>
  );
};

export default BookBrowser;
