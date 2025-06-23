
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import PublisherConsciousnessGrid from "@/components/PublisherConsciousnessGrid";
import { getPublisherSeries, getPublisherBooks, PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import { saveTransmission } from "@/services/transmissionsService";
import { useToast } from "@/hooks/use-toast";

const PublisherResonance = () => {
  const [allBooks, setAllBooks] = useState<EnrichedPublisherBook[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
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
        title: "Signal Added",
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

  const handleFilterToggle = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2">Publisher Consciousness Web</h1>
            <p className="text-slate-400 text-lg">Navigate the living grid of literary consciousness—explore publishers, series, and your reading pathways in one seamless web.</p>
          </div>

          {seriesLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-slate-400">Initializing consciousness grid...</p>
            </div>
          ) : (
            <PublisherConsciousnessGrid
              series={publisherSeries}
              books={allBooks}
              activeFilters={activeFilters}
              onFilterToggle={handleFilterToggle}
              onAddBook={handleAddFromPublisher}
            />
          )}

          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Grid Matrix: Active</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Neural Pathways: Synchronized</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
