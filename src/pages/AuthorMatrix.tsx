
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import EnhancedBookCover from "@/components/EnhancedBookCover";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getScifiAuthors, getAuthorBooks, ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { saveTransmission } from "@/services/transmissionsService";
import { SearchResult } from "@/services/searchService";
import { searchBooksEnhanced } from "@/services/enhanced-google-books-api";
import { searchDebouncer } from "@/services/debounced-search";
import { imageService } from "@/services/image-service";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const AUTHORS_PER_PAGE = 20;

  useEffect(() => {
    loadAuthors();
    
    // Check if there's an author parameter in the URL
    const authorParam = searchParams.get('author');
    if (authorParam) {
      const author = authors.find(a => a.name.toLowerCase() === authorParam.toLowerCase());
      if (author) {
        handleAuthorSelect(author);
      }
    }
  }, [searchParams]);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const authorsData = await getScifiAuthors();
      setAuthors(authorsData);
      
      // Preload cover images for first few authors
      const firstAuthors = authorsData.slice(0, 10);
      firstAuthors.forEach(author => {
        if (author.notable_works) {
          searchDebouncer.search(
            `preload_${author.id}`,
            () => searchBooksEnhanced(`${author.name} ${author.notable_works?.[0]}`, 1),
            (results) => {
              if (results.length > 0) {
                imageService.preloadImages([
                  results[0].coverUrl,
                  results[0].thumbnailUrl,
                  results[0].smallThumbnailUrl
                ].filter(Boolean) as string[]);
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
  };

  const handleAuthorSelect = async (author: ScifiAuthor) => {
    setSelectedAuthor(author);
    setSearchParams({ author: author.name });
    
    try {
      setBooksLoading(true);
      
      // First try to get books from our database
      const dbBooks = await getAuthorBooks(author.id);
      
      if (dbBooks.length > 0) {
        setAuthorBooks(dbBooks);
        // Preload images for database books
        const imageUrls = dbBooks.map(book => book.cover_url).filter(Boolean) as string[];
        imageService.preloadImages(imageUrls);
      } else {
        // Fallback to Google Books API with enhanced caching
        searchDebouncer.search(
          `author_books_${author.id}`,
          () => searchBooksEnhanced(`author:"${author.name}"`, 20),
          (googleBooks) => {
            // Convert Google Books format to our format
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
            
            // Preload images for Google Books results
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
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    
    // Filter and show author results
    const authorResults = results.filter(r => r.type === 'author');
    if (authorResults.length > 0) {
      const matchingAuthors = authors.filter(author => 
        authorResults.some(result => result.title === author.name)
      );
      if (matchingAuthors.length > 0) {
        setAuthors([...matchingAuthors, ...authors.filter(a => !matchingAuthors.includes(a))]);
      }
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    if (result.type === 'author') {
      const author = authors.find(a => a.name === result.title);
      if (author) {
        handleAuthorSelect(author);
      }
    }
  };

  const addToTransmissions = async (book: AuthorBook) => {
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
  };

  const paginatedAuthors = authors.slice(
    currentPage * AUTHORS_PER_PAGE,
    (currentPage + 1) * AUTHORS_PER_PAGE
  );

  const totalPages = Math.ceil(authors.length / AUTHORS_PER_PAGE);

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
            
            <div className="max-w-2xl mx-auto relative">
              <SearchInput 
                onResults={handleSearchResults}
                placeholder="Search authors and books..."
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {searchResults.filter(r => r.type === 'author').map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full p-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                    >
                      <h3 className="font-medium text-slate-200">{result.title}</h3>
                      <p className="text-sm text-slate-400">{result.subtitle}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                      <div
                        key={author.id}
                        className={`bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-slate-800/70 transition-colors cursor-pointer touch-manipulation ${
                          selectedAuthor?.id === author.id ? 'ring-2 ring-blue-400' : ''
                        }`}
                        onClick={() => handleAuthorSelect(author)}
                      >
                        <div className="font-medium text-slate-200 text-sm">{author.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{author.nationality}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls with Pulse Circle Design */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center space-x-4">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${
                          currentPage === 0 
                            ? 'border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 active:scale-95'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-slate-400 text-sm">
                          {currentPage + 1} of {totalPages}
                        </span>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${
                          currentPage === totalPages - 1 
                            ? 'border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 active:scale-95'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-light text-slate-200 mb-1">{selectedAuthor.name}</h2>
                      <p className="text-slate-400 text-sm mb-2">{selectedAuthor.nationality}</p>
                      {selectedAuthor.bio && (
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2 line-clamp-3">{selectedAuthor.bio}</p>
                      )}
                      {selectedAuthor.notable_works && selectedAuthor.notable_works.length > 0 && (
                        <div>
                          <h3 className="text-slate-300 font-medium text-sm mb-1">Notable Works:</h3>
                          <ul className="text-slate-400 text-xs space-y-0.5">
                            {selectedAuthor.notable_works.slice(0, 3).map((work, index) => (
                              <li key={index}>• {work}</li>
                            ))}
                            {selectedAuthor.notable_works.length > 3 && (
                              <li className="text-slate-500">+ {selectedAuthor.notable_works.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Books from Google Books API */}
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
                          <div key={book.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-slate-800/70 transition-colors">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                              <EnhancedBookCover
                                title={book.title}
                                coverUrl={book.cover_url}
                                className="w-8 h-12 sm:w-10 sm:h-14 flex-shrink-0"
                                lazy={true}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-200 text-sm mb-1 leading-tight">{book.title}</h4>
                                {book.subtitle && (
                                  <p className="text-xs text-slate-400 mb-2">{book.subtitle}</p>
                                )}
                                {book.description && (
                                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                    {book.description}
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToTransmissions(book)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 touch-manipulation active:scale-95"
                                >
                                  Log Signal
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
                        </div>
                        <h3 className="text-slate-300 text-lg font-medium mb-2">No Books Found</h3>
                        <p className="text-slate-400 text-sm">
                          No available transmissions found for this consciousness node
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-slate-300 text-lg font-medium mb-2">Select an Author</h3>
                  <p className="text-slate-400 text-sm">
                    Choose from the consciousness archive to explore their literary universe
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Archive depth: {authors.length} consciousness nodes</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Matrix status: Operational</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>API calls: {searchDebouncer.getCallCount('author_books_search')}/10</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default AuthorMatrix;
