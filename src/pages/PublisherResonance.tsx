
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

const PublisherResonance = () => {
  const [allBooks, setAllBooks] = useState<EnrichedPublisherBook[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const { toast } = useToast();

  // Get all publisher series
  const { data: publisherSeries = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries,
  });

  // Load all books for all series
  useEffect(() => {
    const loadAllBooks = async () => {
      if (publisherSeries.length === 0) return;
      
      try {
        const allBooksPromises = publisherSeries.map(series => 
          getPublisherBooks(series.id)
        );
        const booksArrays = await Promise.all(allBooksPromises);
        const flatBooks = booksArrays.flat();
        setAllBooks(flatBooks);
      } catch (error) {
        console.error('Failed to load books:', error);
      }
    };

    loadAllBooks();
  }, [publisherSeries]);

  const handleAddFromPublisher = async (book: EnrichedPublisherBook) => {
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

  const selectedSeriesBooks = selectedSeries 
    ? allBooks.filter(book => book.series_id === selectedSeries)
    : [];

  const selectedSeriesData = publisherSeries.find(s => s.id === selectedSeries);

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        
        {seriesLoading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-slate-400">Loading publisher data...</p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-slate-200 mb-4">Publisher Resonance</h1>
              <p className="text-slate-400 text-lg">Explore curated book collections from leading publishers</p>
            </div>

            <div className="flex gap-8">
              {/* Publisher Series List */}
              <div className="w-1/3">
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-medium text-slate-200 mb-4">Publisher Series</h2>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {publisherSeries.map((series) => (
                        <button
                          key={series.id}
                          onClick={() => setSelectedSeries(series.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                            selectedSeries === series.id
                              ? 'bg-cyan-400/20 border-cyan-400/60 text-cyan-200'
                              : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/60 hover:border-cyan-400/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{series.name}</h3>
                              <p className="text-sm opacity-70">{series.publisher}</p>
                            </div>
                            <span className="text-xs opacity-50">
                              {allBooks.filter(book => book.series_id === series.id).length} books
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Books Display */}
              <div className="flex-1">
                {selectedSeriesData ? (
                  <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-medium text-slate-200">{selectedSeriesData.name}</h2>
                        <p className="text-slate-400">{selectedSeriesData.publisher}</p>
                      </div>
                      <span className="text-cyan-400">{selectedSeriesBooks.length} books</span>
                    </div>

                    <ScrollArea className="h-96">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSeriesBooks.map((book) => (
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
                                    onClick={() => handleAddFromPublisher(book)}
                                    className="text-xs bg-cyan-600/70 hover:bg-cyan-600/90 text-white px-3 py-1 rounded transition-all duration-200"
                                  >
                                    Add to Library
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
                    <p className="text-slate-400">Select a publisher series to view books</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Book Detail Modal */}
        {selectedBook && (
          <BookPortalModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onAddBook={handleAddFromPublisher}
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
