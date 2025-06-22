
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import PublisherSeriesSelector from "@/components/PublisherSeriesSelector";
import PublisherBooksGrid from "@/components/PublisherBooksGrid";
import { getPublisherSeries, getPublisherBooks, PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import { saveTransmission } from "@/services/transmissionsService";
import { useToast } from "@/hooks/use-toast";

const PublisherResonance = () => {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<PublisherSeries | null>(null);
  const { toast } = useToast();

  // Get all publisher series
  const { data: publisherSeries = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries,
  });

  // Get books for selected series
  const { data: books = [], isLoading: booksLoading, refetch: refetchBooks } = useQuery({
    queryKey: ['publisher-books', selectedSeriesId],
    queryFn: () => selectedSeriesId ? getPublisherBooks(selectedSeriesId) : Promise.resolve([]),
    enabled: !!selectedSeriesId,
  });

  // Update selected series when series ID changes
  useEffect(() => {
    if (selectedSeriesId && publisherSeries.length > 0) {
      const series = publisherSeries.find(s => s.id === selectedSeriesId);
      setSelectedSeries(series || null);
    }
  }, [selectedSeriesId, publisherSeries]);

  // Auto-select first series if none selected
  useEffect(() => {
    if (!selectedSeriesId && publisherSeries.length > 0) {
      setSelectedSeriesId(publisherSeries[0].id);
    }
  }, [publisherSeries, selectedSeriesId]);

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

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2">Publisher Resonance</h1>
            <p className="text-slate-400 text-lg">Curated collections from premier publishers—discover your next transmission.</p>
          </div>

          {seriesLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-slate-400">Loading publisher collections...</p>
            </div>
          ) : (
            <>
              <PublisherSeriesSelector
                series={publisherSeries}
                selectedSeriesId={selectedSeriesId}
                onSeriesChange={setSelectedSeriesId}
              />

              {selectedSeries && (
                <PublisherBooksGrid
                  books={books}
                  series={selectedSeries}
                  onAddBook={handleAddFromPublisher}
                  loading={booksLoading}
                />
              )}
            </>
          )}

          {publisherSeries.length === 0 && !seriesLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-slate-300 text-lg font-medium mb-2">No publisher collections available</h3>
              <p className="text-slate-400 text-sm">
                Publisher collections will appear here as they become available.
              </p>
            </div>
          )}

          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Dynamic Collections: Active</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>API Integration: Google Books</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
