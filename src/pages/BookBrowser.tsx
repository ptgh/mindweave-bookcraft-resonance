import { useState, useEffect, useRef } from "react";
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

const BookBrowser = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const searchQuery = searchParams.get('search');
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    books,
    loading,
    visibleBooks,
    previouslyShownBooks,
    loadRandomBooks,
    addToTransmissions,
    aiRecommendations
  } = useBookBrowser();

  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [authorPopupVisible, setAuthorPopupVisible] = useState(false);
  const [userBooksCount, setUserBooksCount] = useState(0);
  
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

  // Handle highlight from URL parameter (from Neural Map navigation)
  // Fetch the transmission directly and show it first
  const [reorderedBooks, setReorderedBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [highlightAnimating, setHighlightAnimating] = useState(false);
  const [fetchedTransmission, setFetchedTransmission] = useState<EnhancedBookSuggestion | null>(null);
  
  // Fetch the highlighted transmission from the database
  useEffect(() => {
    const fetchHighlightedTransmission = async () => {
      if (highlightId && searchQuery) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Fetch the transmission by ID
            const { data: transmission, error } = await supabase
              .from('transmissions')
              .select('*')
              .eq('id', parseInt(highlightId))
              .eq('user_id', user.id)
              .single();
            
            if (!error && transmission) {
              // Transform transmission to EnhancedBookSuggestion format
              const bookSuggestion: EnhancedBookSuggestion = {
                id: `transmission-${transmission.id}`,
                title: transmission.title || '',
                author: transmission.author || 'Unknown Author',
                coverUrl: transmission.cover_url || '',
                thumbnailUrl: transmission.cover_url || '',
                smallThumbnailUrl: transmission.cover_url || '',
                description: transmission.notes || '',
                categories: transmission.tags ? JSON.parse(transmission.tags) : [],
              };
              setFetchedTransmission(bookSuggestion);
              setHighlightedBookId(bookSuggestion.id);
              console.log('Fetched highlighted transmission:', bookSuggestion.title);
            }
          }
        } catch (error) {
          console.error('Error fetching highlighted transmission:', error);
        }
      }
    };
    
    fetchHighlightedTransmission();
  }, [highlightId, searchQuery]);
  
  // Reorder books with fetched transmission first - PERSIST the book in the list
  useEffect(() => {
    if (fetchedTransmission && !loading) {
      // Put the fetched transmission first, then the rest of the books
      const reordered = [fetchedTransmission, ...books.filter(b => b.id !== fetchedTransmission.id)];
      setHighlightAnimating(true);
      setReorderedBooks(reordered);
      
      // Reset animation state after transition
      setTimeout(() => setHighlightAnimating(false), 600);
      
      // Clear ONLY the highlight styling after 5 seconds, but KEEP the book visible
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedBookId(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('highlight');
        newParams.delete('search');
        setSearchParams(newParams, { replace: true });
        // NOTE: Do NOT clear fetchedTransmission - keep the book in the list
      }, 5000);
    } else if (!fetchedTransmission) {
      setReorderedBooks(books);
    }
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [fetchedTransmission, loading, books, searchParams, setSearchParams]);

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
            />
          </div>

          {loading ? (
            <div ref={addFeatureBlockRef} className="feature-block text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
              </div>
              <p className="text-slate-400">Scanning the consciousness archive...</p>
            </div>
          ) : books.length > 0 ? (
          <div ref={addFeatureBlockRef} className="feature-block min-h-[60vh]">
              <BookGrid
                books={reorderedBooks.length > 0 ? reorderedBooks : books}
                visibleBooks={visibleBooks}
                onAddToTransmissions={addToTransmissions}
                onAuthorClick={handleAuthorClick}
                aiRecommendations={aiRecommendations}
                highlightedBookId={highlightedBookId}
                highlightAnimating={highlightAnimating}
              />
            </div>
          ) : (
            <div ref={addFeatureBlockRef} className="feature-block">
              <BookBrowserEmpty onScan={loadRandomBooks} />
            </div>
          )}

          <div ref={addFeatureBlockRef} className="feature-block">
            <BookBrowserStatus 
              booksCount={books.length}
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
