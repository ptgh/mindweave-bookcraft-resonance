
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

// Transform publisher data to author data
interface AuthorData {
  name: string;
  books: EnrichedPublisherBook[];
  totalBooks: number;
  x: number;
  y: number;
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

        // Convert to array format with positions for the consciousness web
        const authorsData = Object.entries(authorGroups).map(([author, books], index) => {
          // Create positions in a web-like pattern
          const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for better distribution
          const radius = 200 + (index % 3) * 100;
          const x = Math.cos(angle) * radius + 400;
          const y = Math.sin(angle) * radius + 300;
          
          return {
            name: author,
            books,
            totalBooks: books.length,
            x,
            y
          };
        });

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

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        
        {seriesLoading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-slate-400">Loading author consciousness web...</p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-slate-200 mb-4">Navigate the consciousness web of curated collections—discover your next transmission.</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-light text-slate-200 mb-4">Author Consciousness Web</h2>
              <p className="text-slate-400 mb-6">Navigate the interconnected realms of curated literature. Each node pulses with the essence of its author's vision.</p>
            </div>

            <div className="flex gap-8">
              {/* Author Consciousness Web Visualization */}
              <div className="flex-1">
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6 h-96 relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Connections between authors */}
                    {allAuthors.map((author, i) => 
                      allAuthors.slice(i + 1, i + 3).map((connectedAuthor, j) => (
                        <line
                          key={`${i}-${j}`}
                          x1={author.x}
                          y1={author.y}
                          x2={connectedAuthor.x}
                          y2={connectedAuthor.y}
                          stroke="rgba(139, 92, 246, 0.3)"
                          strokeWidth="1"
                          className="animate-pulse"
                        />
                      ))
                    )}
                    
                    {/* Author nodes */}
                    {allAuthors.slice(0, 8).map((author, index) => (
                      <g key={author.name}>
                        {/* Outer glow ring */}
                        <circle
                          cx={author.x}
                          cy={author.y}
                          r={author.totalBooks > 5 ? 35 : 25}
                          fill="none"
                          stroke={selectedAuthor === author.name ? "rgba(34, 211, 238, 0.6)" : "rgba(139, 92, 246, 0.4)"}
                          strokeWidth="2"
                          className={selectedAuthor === author.name ? "animate-pulse" : ""}
                        />
                        
                        {/* Main node */}
                        <circle
                          cx={author.x}
                          cy={author.y}
                          r={author.totalBooks > 5 ? 25 : 18}
                          fill={selectedAuthor === author.name ? "rgba(34, 211, 238, 0.3)" : "rgba(139, 92, 246, 0.2)"}
                          stroke={selectedAuthor === author.name ? "rgba(34, 211, 238, 0.8)" : "rgba(139, 92, 246, 0.6)"}
                          strokeWidth="2"
                          className="cursor-pointer hover:fill-opacity-40 transition-all duration-200"
                          onClick={() => setSelectedAuthor(selectedAuthor === author.name ? null : author.name)}
                        />
                        
                        {/* Book count indicator */}
                        <text
                          x={author.x}
                          y={author.y + 5}
                          textAnchor="middle"
                          className="text-xs fill-slate-200 font-medium pointer-events-none"
                        >
                          {author.totalBooks}
                        </text>
                      </g>
                    ))}
                  </svg>
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                      <span className="text-xs text-slate-300">Central Consciousness</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-xs text-slate-300">Author Nodes</span>
                    </div>
                  </div>
                  
                  {selectedAuthor && (
                    <div className="absolute top-4 right-4 bg-slate-800/90 border border-cyan-400/40 rounded-lg p-4 max-w-xs">
                      <h3 className="text-cyan-200 font-medium mb-2">{selectedAuthor}</h3>
                      <p className="text-slate-300 text-sm">
                        {selectedAuthorData?.totalBooks} books in collection
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Author Details Panel */}
              <div className="w-1/3">
                {selectedAuthorData ? (
                  <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-medium text-slate-200">{selectedAuthorData.name}</h3>
                        <p className="text-slate-400">Author Collection</p>
                      </div>
                      <span className="text-cyan-400">{selectedAuthorData.totalBooks} books</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="text-slate-400 text-sm">
                        The essential collection—timeless works that shaped the genre.
                      </div>
                      <div className="text-slate-500 text-xs">
                        Covers powered by Google Books API
                      </div>
                    </div>

                    <ScrollArea className="h-80">
                      <div className="space-y-4">
                        {selectedAuthorData.books.map((book) => (
                          <div
                            key={book.id}
                            className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-200"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-20 bg-slate-700/50 border border-cyan-400/30 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {book.cover_url ? (
                                  <img 
                                    src={book.cover_url} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-8 h-8 border border-cyan-400/50 rounded animate-pulse" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-slate-200 font-medium text-sm leading-tight mb-2">{book.title}</h4>
                                <p className="text-slate-400 text-sm mb-3">{book.author}</p>
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setSelectedBook(book)}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleAddFromAuthor(book)}
                                    className="text-xs bg-purple-600/70 hover:bg-purple-600/90 text-white px-3 py-1 rounded transition-all duration-200"
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
                ) : (
                  <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6 flex items-center justify-center h-96">
                    <p className="text-slate-400">Select an author node to explore their consciousness</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span>Consciousness Web: Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Neural Pathways: Synchronized</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
