
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { StandardButton } from "@/components/ui/standard-button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";
import EnhancedBookPreviewModal from "@/components/EnhancedBookPreviewModal";
import PublisherBookCard from "@/components/PublisherBookCard";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import penguinLogo from "@/assets/penguin-logo.png";

const PublisherResonance = () => {
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  // Static data for Penguin Science Fiction series
  const penguinBooks: EnrichedPublisherBook[] = useMemo(() => [
    {
      id: "ark-sakura",
      series_id: "penguin-scifi",
      title: "The Ark Sakura",
      author: "Kobo Abe & Juliet Winters Carpenter",
      isbn: "9780241454589",
      cover_url: "/lovable-uploads/bf7a5e03-17a9-4a36-b156-3d23678f4ba5.png",
      publisher_link: "https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589",
      editorial_note: "'One of Japan's most venerated writers' David Mitchell\n\nIn this unnerving fable from one of Japan's greatest novelists, a recluse known as 'Mole' retreats to a vast underground bunker, only to find that strange guests, booby traps and a giant toilet may prove even greater obstacles than nuclear disaster.",
      google_cover_url: null,
      created_at: new Date().toISOString()
    }
  ], []);

  const publisherSeries = {
    id: "penguin-scifi",
    name: "Penguin Science Fiction",
    publisher: "Penguin",
    badge_emoji: "🐧",
    description: "Classic and contemporary science fiction from Penguin"
  };

  const handleBookPreview = useCallback((book: EnrichedPublisherBook) => {
    setSelectedBook(book);
    setShowPreviewModal(true);
  }, []);

  const handleAddToTransmissions = useCallback((book: EnrichedPublisherBook) => {
    toast({
      title: "Signal Added",
      description: `"${book.title}" has been added to your transmissions.`,
    });
    setShowPreviewModal(false);
  }, [toast]);

  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
    setSelectedBook(null);
  }, []);

  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Establishing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-4 sm:px-6 py-8">
          <div ref={addFeatureBlockRef} className="feature-block">
            <div className="text-center mb-8">
              <h1 ref={heroTitleRef} className="text-3xl font-light text-slate-200 tracking-wide mb-4">
                Signal Collection
              </h1>
              <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6">
                Discover your next science fiction transmission through the quantum field of possibilities
              </p>
              <StandardButton
                onClick={() => window.open('https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction', '_blank')}
                variant="standard"
                className="touch-manipulation active:scale-95"
              >
                Discover Scan Signal Collection
              </StandardButton>
            </div>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block mb-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {penguinBooks.map(book => (
                <PublisherBookCard
                  key={book.id}
                  book={book}
                  onLogSignal={() => handleAddToTransmissions(book)}
                  onPreview={() => handleBookPreview(book)}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-12 pb-8">
            <footer className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="inline-flex items-center space-x-2 text-slate-400 text-xs">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span>Publisher frequency: Active</span>
                </div>
              </div>
            </footer>
          </div>
        </main>
        
        {selectedBook && showPreviewModal && (
          <EnhancedBookPreviewModal
            book={selectedBook}
            onClose={handleClosePreview}
            onAddBook={handleAddToTransmissions}
          />
        )}
        
        <Footer />
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
