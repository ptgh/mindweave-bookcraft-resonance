
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AuthorCard from "@/components/AuthorCard";
import AuthorDetails from "@/components/AuthorDetails";
import BookListItem from "@/components/BookListItem";
import AuthorSearch from "@/components/AuthorSearch";
import EmptyState from "@/components/EmptyState";
import PulseCirclePagination from "@/components/PulseCirclePagination";
import { useToast } from "@/hooks/use-toast";
import { getScifiAuthors, getAuthorBooks, ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { saveTransmission } from "@/services/transmissionsService";
import { SearchResult } from "@/services/searchService";
import { searchBooksEnhanced } from "@/services/enhanced-google-books-api";
import { searchDebouncer } from "@/services/debounced-search";
import { imageService } from "@/services/image-service";
import { Brain } from "lucide-react";

const AUTHORS_PER_PAGE = 20;

const AuthorMatrix = () => {
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
      
      // Preload cover images for first few authors
      const firstAuthors = authorsData.slice(0, 10);
      firstAuthors.forEach(author => {
        if (author.notable_works?.[0]) {
          searchDebouncer.search(
            `preload_${author.id}`,
            () => searchBooksEnhanced(`${author.name} ${author.notable_works[0]}`, 1),
            (results) => {
              if (results.length > 0) {
                const imageUrls = [results[0].coverUrl, results[0].thumbnailUrl, results[0].smallThumbnailUrl]
                  .filter(Boolean) as string[];
                imageService.preloadImages(imageUrls);
              }
            }
          );
        }
      });
    } catch (error: any) {
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
        imageService.preloadImages(imageUrls);
      } else {
        searchDebouncer.search(
          `author_books_${author.id}`,
          () => searchBooksEnhanced(`author:"${author.name}"`, 20),
          (googleBooks) => {
            const convertedBooks: AuthorBook[] = googleBooks.map(book => ({
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
            
            const imageUrls = [
              ...googleBooks.map(book => book.coverUrl),
              ...googleBooks.map(book => book.thumbnailUrl),
              ...googleBooks.map(book => book.smallThumbnailUrl)
            ].filter(Boolean) as string[];
            
            imageService.preloadImages(imageUrls);
          }
        );
      }
    } catch (error: any) {
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
      await saveTransmission({
        title: book.title,
        author: selectedAuthor?.name || 'Unknown',
        cover_url: book.cover_url || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read'
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
    
    const authorParam = searchParams.get('author');
    if (authorParam) {
      const author = authors.find(a => a.name.toLowerCase() === authorParam.toLowerCase());
      if (author) {
        handleAuthorSelect(author);
      }
    }
  }, [searchParams, loadAuthors, authors, handleAuthorSelect]);

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-slate-200 mb-2 tracking-wider">
              Author Matrix
            </h1>
            <p className="text-slate-400 text-sm mb-4 sm:mb-6">
              Navigate the consciousness territories of science fiction masters
            </p>
            
            <AuthorSearch
              onResults={handleSearchResults}
              onResultSelect={handleSearchResultSelect}
              searchResults={searchResults}
            />
          </div>

          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-slate-200 text-lg sm:text-xl font-medium mb-1">Authors</h2>
              <p className="text-slate-400 text-sm">Consciousness archives from the science fiction masters</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {/* Authors List */}
            <div className="lg:col-span-1">
              {loading ? (
                <LoadingSkeleton type="author-card" count={10} />
              ) : (
                <>
                  <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                    {paginatedAuthors.map(author => (
                      <AuthorCard
                        key={author.id}
                        author={author}
                        isSelected={selectedAuthor?.id === author.id}
                        onSelect={handleAuthorSelect}
                      />
                    ))}
                  </div>
                  
                  <PulseCirclePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>

            {/* Author Details & Books */}
            <div className="lg:col-span-3 mt-6 lg:mt-0">
              {selectedAuthor ? (
                <div>
                  {booksLoading ? (
                    <LoadingSkeleton type="author-detail" />
                  ) : (
                    <AuthorDetails author={selectedAuthor} />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-slate-200 text-lg sm:text-xl font-medium mb-1">Available Books</h3>
                        <p className="text-slate-400 text-sm">Transmissions ready for signal logging</p>
                      </div>
                    </div>
                    
                    {booksLoading ? (
                      <LoadingSkeleton type="book-grid" count={6} />
                    ) : authorBooks.length > 0 ? (
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {authorBooks.map(book => (
                          <BookListItem
                            key={book.id}
                            book={book}
                            onAddToTransmissions={addToTransmissions}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Brain}
                        title="No Books Found"
                        description="No available transmissions found for this consciousness node"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Brain}
                  title="Select an Author"
                  description="Choose from the consciousness archive to explore their literary universe"
                />
              )}
            </div>
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Archive depth: {authors.length} consciousness nodes</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Matrix status: Operational</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default AuthorMatrix;
