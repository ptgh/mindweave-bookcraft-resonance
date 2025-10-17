
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
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
  const [highlightedAuthorId, setHighlightedAuthorId] = useState<string | null>(null);
  const { toast } = useEnhancedToast();

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
      console.log(`Loaded ${dbBooks.length} books for ${author.name} from database`);
      
      // Always start with DB books (author-curated)
      setAuthorBooks(dbBooks);
      
      const dbImageUrls = dbBooks.map(book => book.cover_url).filter(Boolean) as string[];
      if (dbImageUrls.length > 0) {
        imageService.preloadImages(dbImageUrls);
      }
      
      // Stop loading indicator after DB books are shown
      setBooksLoading(false);
      
      // Try to fetch additional titles from Google Books in background
      const searchKey = `author_books_${author.id}_${Date.now()}`;
      
      searchDebouncer.search(
        searchKey,
        () => {
          return searchBooksEnhanced(author.name, 30, 0, author.name);
        },
        (googleBooks: EnhancedBookSuggestion[]) => {
          // Handle empty results (e.g., from API failures)
          if (!googleBooks || googleBooks.length === 0) {
            console.log('No additional books from Google Books API, showing database books only');
            return;
          }
          
          const apiBooks: AuthorBook[] = googleBooks.map(book => ({
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
          
          const byTitle = new Map<string, AuthorBook>();
          dbBooks.forEach(b => byTitle.set((b.title || '').toLowerCase(), b));
          apiBooks.forEach(b => {
            const key = (b.title || '').toLowerCase();
            if (!byTitle.has(key)) byTitle.set(key, b);
          });
          
          const merged = Array.from(byTitle.values());
          console.log(`Merged ${merged.length} total books (${dbBooks.length} from DB, ${apiBooks.length} from API)`);
          setAuthorBooks(merged);
          
          const imageUrls = merged
            .map(book => book.cover_url)
            .filter(Boolean) as string[];
          if (imageUrls.length > 0) {
            imageService.preloadImages(imageUrls);
          }
        }
      );
    } catch (error: any) {
      console.error('Error loading books:', error);
      setBooksLoading(false);
      toast({
        title: "Error Loading Books",
        description: "Unable to load books. Please try again.",
        variant: "destructive",
      });
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
        // Auto-highlight/select when there's a strong/unique match
        const top = authorResults[0];
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
        const exact = authors.find(a => normalize(a.name) === normalize(top.title));
        if (authorResults.length === 1 || exact) {
          const toSelect = exact || matchingAuthors[0];
          if (toSelect && (!selectedAuthor || selectedAuthor.id !== toSelect.id)) {
            handleAuthorSelect(toSelect);
          }
        }
      }
    }
  }, [authors, selectedAuthor, handleAuthorSelect]);

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
        variant: "success"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [selectedAuthor, toast]);

  const handleAuthorQueryChange = useCallback((query: string) => {
    if (!query.trim()) {
      setHighlightedAuthorId(null);
      return;
    }

    const normalized = query.toLowerCase().trim();
    
    // Find best match: prefix first, then includes
    let bestMatch = authors.find(a => a.name.toLowerCase().startsWith(normalized));
    if (!bestMatch) {
      bestMatch = authors.find(a => a.name.toLowerCase().includes(normalized));
    }

    if (bestMatch) {
      setHighlightedAuthorId(bestMatch.id);
      
      // Calculate page and navigate to it
      const authorIndex = authors.findIndex(a => a.id === bestMatch!.id);
      if (authorIndex !== -1) {
        const targetPage = Math.floor(authorIndex / AUTHORS_PER_PAGE);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    } else {
      setHighlightedAuthorId(null);
    }
  }, [authors, currentPage]);

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
    highlightedAuthorId,
    setCurrentPage,
    handleAuthorSelect,
    handleSearchResults,
    handleSearchResultSelect,
    handleAuthorQueryChange,
    addToTransmissions
  };
};
