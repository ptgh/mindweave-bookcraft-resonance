
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getScifiAuthors, getAuthorBooks, ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { saveTransmission } from "@/services/transmissionsService";
import { SearchResult } from "@/services/searchService";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { searchDebouncer } from "@/services/debounced-search";
import { imageService } from "@/services/image-service";
import { searchAppleBooks } from "@/services/appleBooks";
const AUTHORS_PER_PAGE = 20;

export const useAuthorMatrix = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authors, setAuthors] = useState<ScifiAuthor[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [authorBooks, setAuthorBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  const totalPages = useMemo(() => Math.ceil(authors.length / AUTHORS_PER_PAGE), [authors.length]);
  const paginatedAuthors = useMemo(() => 
    authors.slice(currentPage * AUTHORS_PER_PAGE, (currentPage + 1) * AUTHORS_PER_PAGE),
    [authors, currentPage]
  );

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const authorsData = await getScifiAuthors();
      setAuthors(authorsData);
    } catch (error: any) {
      console.error('Error loading authors:', error);
      toast({
        title: "Loading Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleAuthorSelect = useCallback(async (author: ScifiAuthor) => {
    setSelectedAuthor(author);
    setSearchParams({ author: author.name });
    
    try {
      setBooksLoading(true);
      
      const dbBooks = await getAuthorBooks(author.id);
      
      if (dbBooks.length > 0) {
        setAuthorBooks(dbBooks);
        
        const imageUrls = dbBooks.map(book => book.cover_url).filter(Boolean) as string[];
        if (imageUrls.length > 0) {
          imageService.preloadImages(imageUrls);
        }
      } else {
        const searchKey = `author_books_${author.id}_${Date.now()}`;
        
        searchDebouncer.search(
          searchKey,
          () => {
            const sciFiQuery = `author:"${author.name}" subject:"science fiction" OR author:"${author.name}" subject:"sci-fi"`;
            return searchBooksEnhanced(sciFiQuery, 20);
          },
          (googleBooks: EnhancedBookSuggestion[]) => {
            const sciFiBooks = googleBooks.filter(book => {
              const categories = book.categories || [];
              const description = book.description || '';
              const title = book.title || '';
              
              const isSciFi = categories.some(cat => 
                cat.toLowerCase().includes('science fiction') ||
                cat.toLowerCase().includes('sci-fi')
              ) || 
              [title, description].some(text => 
                text.toLowerCase().includes('science fiction') ||
                text.toLowerCase().includes('sci-fi') ||
                text.toLowerCase().includes('space') ||
                text.toLowerCase().includes('future') ||
                text.toLowerCase().includes('alien')
              );
              
              return isSciFi;
            });
            
            const convertedBooks: AuthorBook[] = sciFiBooks.map(book => ({
              id: book.id,
              author_id: author.id,
              google_books_id: book.id,
              title: book.title,
              subtitle: book.subtitle,
              description: book.description,
              cover_url: book.coverUrl,
              categories: book.categories,
              published_date: book.publishedDate,
              page_count: book.pageCount,
              rating: book.rating,
              ratings_count: book.ratingsCount,
              preview_link: book.previewLink,
              info_link: book.infoLink,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            setAuthorBooks(convertedBooks);
            
            const imageUrls = sciFiBooks
              .map(book => [book.coverUrl, book.thumbnailUrl, book.smallThumbnailUrl])
              .flat()
              .filter(Boolean) as string[];
            
            if (imageUrls.length > 0) {
              imageService.preloadImages(imageUrls);
            }
          }
        );
      }
    } catch (error: any) {
      console.error('Error loading books:', error);
      toast({
        title: "Error Loading Books",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBooksLoading(false);
    }
  }, [setSearchParams, toast]);

  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
    
    const authorResults = results.filter(r => r.type === 'author');
    if (authorResults.length > 0) {
      const matchingAuthors = authors.filter(author => 
        authorResults.some(result => result.title === author.name)
      );
      if (matchingAuthors.length > 0) {
        setAuthors([...matchingAuthors, ...authors.filter(a => !matchingAuthors.includes(a))]);
      }
    }
  }, [authors]);

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    if (result.type === 'author') {
      const author = authors.find(a => a.name === result.title);
      if (author) {
        handleAuthorSelect(author);
      }
    }
  }, [authors, handleAuthorSelect]);

  const addToTransmissions = useCallback(async (book: AuthorBook) => {
    try {
      // Try to enrich with Apple Books link (cached)
      let appleLink: string | undefined;
      try {
        const found = await searchAppleBooks(book.title, selectedAuthor?.name || '', undefined);
        if (found?.storeUrl) {
          appleLink = found.storeUrl;
        }
      } catch (e) {
        console.warn('Apple Books lookup failed (author matrix):', e);
      }

      await saveTransmission({
        title: book.title,
        author: selectedAuthor?.name || 'Unknown',
        cover_url: book.cover_url || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read',
        apple_link: appleLink
      });
      
      toast({
        title: "Signal Logged",
        description: `"${book.title}" has been added to your transmissions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [selectedAuthor, toast]);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  useEffect(() => {
    const authorParam = searchParams.get('author');
    if (authorParam && authors.length > 0) {
      const author = authors.find(a => a.name.toLowerCase() === authorParam.toLowerCase());
      if (author && (!selectedAuthor || selectedAuthor.id !== author.id)) {
        handleAuthorSelect(author);
      }
    }
  }, [searchParams, authors, selectedAuthor, handleAuthorSelect]);

  return {
    authors: paginatedAuthors,
    selectedAuthor,
    authorBooks,
    loading,
    booksLoading,
    searchResults,
    currentPage,
    totalPages,
    setCurrentPage,
    handleAuthorSelect,
    handleSearchResults,
    handleSearchResultSelect,
    addToTransmissions
  };
};
