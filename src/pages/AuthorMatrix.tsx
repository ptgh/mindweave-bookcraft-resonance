
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { getPublisherSeries, getPublisherBooks, PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import { saveTransmission } from "@/services/transmissionsService";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import BookPortalModal from "@/components/BookPortalModal";
import { Brain, Grid3X3, Users, BookOpen } from "lucide-react";

// Transform publisher data to author data
interface AuthorData {
  name: string;
  books: EnrichedPublisherBook[];
  totalBooks: number;
  id: string;
}

const AuthorMatrix = () => {
  const [allAuthors, setAllAuthors] = useState<AuthorData[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const { toast } = useToast();

  // Get all publisher series
  const { data: publisherSeries = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries,
  });

  // Load all books and group by author
  useEffect(() => {
    const loadAllBooksAndGroupByAuthor = async () => {
      if (publisherSeries.length === 0) return;
      
      try {
        const allBooksPromises = publisherSeries.map(series => 
          getPublisherBooks(series.id)
        );
        const booksArrays = await Promise.all(allBooksPromises);
        const flatBooks = booksArrays.flat();
        
        // Group books by author
        const authorGroups = flatBooks.reduce((acc, book) => {
          if (!acc[book.author]) {
            acc[book.author] = [];
          }
          acc[book.author].push(book);
          return acc;
        }, {} as Record<string, EnrichedPublisherBook[]>);

        // Convert to array format and limit to 5 books per author
        const authorsData = Object.entries(authorGroups).map(([author, books], index) => ({
          name: author,
          books: books.slice(0, 5), // Limit to 5 books per author
          totalBooks: books.length,
          id: `author-${index}`
        }));

        setAllAuthors(authorsData);
      } catch (error) {
        console.error('Failed to load books:', error);
      }
    };

    loadAllBooksAndGroupByAuthor();
  }, [publisherSeries]);

  const handleAddFromAuthor = async (book: EnrichedPublisherBook) => {
    try {
      const newBook = {
        title: book.title,
        author: book.author,
        cover_url: book.cover_url || "",
        status: "want-to-read" as const,
        tags: [],
        notes: book.editorial_note || "",
        rating: {
          truth: false,
          confirmed: false,
          disrupted: false,
          rewired: false
        },
        publisher_series_id: book.series_id
      };
      
      await saveTransmission(newBook);
      toast({
        title: "Portal Activated",
        description: `"${book.title}" has been added to your transmissions.`,
      });
    } catch (error: any) {
      toast({
        title: "Transmission Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectedAuthorData = allAuthors.find(author => author.name === selectedAuthor);
  const totalAuthors = allAuthors.length;
  const totalPortals = allAuthors.reduce((sum, author) => sum + author.totalBooks, 0);

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-slate-200 mb-4">Author Consciousness Matrix</h1>
            <p className="text-slate-400">Navigate the literary mindscape—explore author territories and activate narrative portals in the digital grid.</p>
          </div>

          {seriesLoading ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                <p className="text-slate-400">Initializing consciousness matrix...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Control Panel */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Grid3X3 className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-medium text-cyan-300">AUTHOR GRID</h2>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">ONLINE</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Active Authors:</span>
                      <span className="text-cyan-400 font-mono">{totalAuthors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Portals:</span>
                      <span className="text-cyan-400 font-mono">{totalPortals}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid Display */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/60 border border-cyan-400/30 rounded-lg p-6 min-h-[600px]">
                  {/* Grid Background Pattern */}
                  <div className="relative h-full">
                    <div className="absolute inset-0 opacity-10">
                      <div className="grid grid-cols-8 grid-rows-8 h-full gap-1">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div key={i} className="border border-cyan-400/20 rounded-sm"></div>
                        ))}
                      </div>
                    </div>

                    {/* Author Selection Grid */}
                    <div className="relative z-10 p-4">
                      <div className="mb-6">
                        <div className="text-slate-300 text-sm mb-2">SELECT AUTHOR:</div>
                        <div className="h-1 bg-slate-700 rounded overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                        </div>
                      </div>

                      <ScrollArea className="h-[450px]">
                        <div className="space-y-3">
                          {allAuthors.map((author) => (
                            <div
                              key={author.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all duration-1000 hover:scale-[1.02] ${
                                selectedAuthor === author.name
                                  ? 'border-cyan-400 bg-cyan-400/10 shadow-cyan-400/20 shadow-lg'
                                  : 'border-slate-600 bg-slate-800/30 hover:border-cyan-400/50 hover:bg-slate-700/30'
                              }`}
                              onClick={() => setSelectedAuthor(selectedAuthor === author.name ? null : author.name)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-slate-200 font-medium">{author.name}</h3>
                                  <p className="text-slate-400 text-sm">
                                    {author.books.length} of {author.totalBooks} {author.totalBooks === 1 ? 'portal' : 'portals'}
                                  </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full transition-all duration-800 ${selectedAuthor === author.name ? 'bg-cyan-400' : 'bg-slate-600'}`}>
                                  {selectedAuthor === author.name && (
                                    <div className="w-full h-full bg-cyan-400 rounded-full animate-pulse opacity-40"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Details Panel */}
              <div className="space-y-6">
                {selectedAuthorData ? (
                  <>
                    <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-medium text-slate-200">{selectedAuthorData.name}</h3>
                          <p className="text-slate-400">Author Collection</p>
                        </div>
                        <span className="text-cyan-400 font-mono">
                          {selectedAuthorData.books.length}/{selectedAuthorData.totalBooks} books
                        </span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="text-slate-400 text-sm">
                          Essential works from this consciousness—up to 5 key portals displayed.
                        </div>
                        <div className="text-slate-500 text-xs">
                          Covers powered by Google Books API
                        </div>
                      </div>

                      <ScrollArea className="h-96">
                        <div className="space-y-4 pr-4">
                          {selectedAuthorData.books.map((book, index) => (
                            <div
                              key={book.id}
                              className="bg-slate-900/50 border border-slate-600/40 rounded-lg p-4 hover:bg-slate-700/50 hover:border-cyan-400/30 transition-all duration-800 hover:scale-[1.02] group"
                              style={{ animationDelay: `${index * 150}ms` }}
                            >
                              <div className="flex items-start space-x-4">
                                <div className="w-16 h-20 bg-slate-700/50 border border-cyan-400/30 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-cyan-400/60 transition-all duration-800">
                                  {book.cover_url ? (
                                    <img 
                                      src={book.cover_url} 
                                      alt={book.title} 
                                      className="w-full h-full object-cover rounded transition-transform duration-800 group-hover:scale-105"
                                    />
                                  ) : (
                                    <BookOpen className="w-6 h-6 text-cyan-400/50 group-hover:text-cyan-400 transition-colors duration-800" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-slate-200 font-medium text-sm leading-tight mb-2 group-hover:text-cyan-300 transition-colors duration-800">
                                    {book.title}
                                  </h4>
                                  <p className="text-slate-400 text-sm mb-3">{book.author}</p>
                                  
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedBook(book)}
                                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-all duration-500 border border-cyan-400/30 hover:border-cyan-400/60 px-2 py-1 rounded hover:bg-cyan-400/10"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => handleAddFromAuthor(book)}
                                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-all duration-500 border border-cyan-400/30 hover:border-cyan-400/60 px-2 py-1 rounded hover:bg-cyan-400/10"
                                    >
                                      Add to Transmissions
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-800/50 border border-cyan-400/30 rounded-lg p-6">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Select an author from the grid to explore their consciousness</p>
                      <div className="mt-4 text-xs text-slate-500">
                        Navigate through the literary matrix to discover hidden connections
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-4 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>Consciousness Web: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Neural Pathways: Synchronized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Literary Matrix: Online</span>
              </div>
            </div>
          </div>
        </main>

        {/* Book Detail Modal */}
        {selectedBook && (
          <BookPortalModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onAddBook={handleAddFromAuthor}
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default AuthorMatrix;
