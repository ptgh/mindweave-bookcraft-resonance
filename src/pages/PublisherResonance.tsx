
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import PublisherResonanceBadge from "@/components/PublisherResonanceBadge";
import PublisherResonanceModal from "@/components/PublisherResonanceModal";
import { Button } from "@/components/ui/button";
import { getPublisherSeries, getPublisherBooks, PublisherSeries, PublisherBook } from "@/services/publisherService";
import { saveTransmission } from "@/services/transmissionsService";
import { useToast } from "@/hooks/use-toast";

const PublisherResonance = () => {
  const [selectedSeries, setSelectedSeries] = useState<PublisherSeries | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: publisherSeries = [], isLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries,
  });

  const handleAddFromPublisher = async (book: PublisherBook) => {
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
        title: "Signal Logged",
        description: "Publisher Resonance signal added to your transmissions.",
      });
      setIsModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Transmission Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openSeriesModal = (series: PublisherSeries) => {
    setSelectedSeries(series);
    setIsModalOpen(true);
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2">Publisher Resonance</h1>
            <p className="text-slate-400 text-lg">Explore curated threads—classics curated for future memory.</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading publisher threads...</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {publisherSeries.map((series) => (
                <div 
                  key={series.id} 
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:bg-slate-800/70 transition-colors group cursor-pointer"
                  onClick={() => openSeriesModal(series)}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    {series.logo_url ? (
                      <img src={series.logo_url} alt={series.name} className="w-12 h-12 rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                        <span className="text-2xl">{series.badge_emoji}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <PublisherResonanceBadge series={series} size="md" />
                      <p className="text-slate-400 text-sm mt-1">{series.publisher}</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">{series.description}</p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 w-full group-hover:border-purple-400/50 transition-colors"
                  >
                    Explore Thread
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Publisher Threads: Active</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Curated Signals: Expanding</span>
            </div>
          </div>
        </main>

        {selectedSeries && (
          <PublisherResonanceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            series={selectedSeries}
            onAddBook={handleAddFromPublisher}
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
