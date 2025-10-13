
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";
import EnhancedBookPreviewModal from "@/components/EnhancedBookPreviewModal";
import PublisherBookCard from "@/components/PublisherBookCard";
import PublisherSelector from "@/components/PublisherSelector";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { supabase } from "@/integrations/supabase/client";
import penguinLogo from "@/assets/penguin-logo.png";

type PublisherSeries = {
  id: string;
  name: string;
  publisher: string;
  description: string;
  badge_emoji: string;
};

const PublisherResonance = () => {
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<'Penguin' | 'Gollancz'>('Penguin');
  const [publisherSeries, setPublisherSeries] = useState<PublisherSeries[]>([]);
  const [books, setBooks] = useState<EnrichedPublisherBook[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useEnhancedToast();
  const { user, loading: authLoading } = useAuth();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  const currentSeries = useMemo(() => 
    publisherSeries.find(series => series.publisher === selectedPublisher),
    [publisherSeries, selectedPublisher]
  );

  const filteredBooks = useMemo(() => {
    if (!currentSeries) return [];
    return books.filter(book => book.series_id === currentSeries.id);
  }, [books, currentSeries]);

  // Load publisher series and books
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load publisher series
        const { data: seriesData, error: seriesError } = await supabase
          .from('publisher_series')
          .select('*');
        
        if (seriesError) throw seriesError;
        
        // Load books
        const { data: booksData, error: booksError } = await supabase
          .from('publisher_books')
          .select(`
            id,
            series_id,
            title,
            author,
            isbn,
            cover_url,
            editorial_note,
            penguin_url,
            publication_year,
            created_at
          `);
        
        if (booksError) throw booksError;
        
        setPublisherSeries(seriesData || []);
        setBooks((booksData || []).map(book => {
          const series = (seriesData || []).find(s => s.id === book.series_id);
          let publisher_link: string | null = book.penguin_url || null;
          const titleKey = (book.title || '').toLowerCase().trim();
          if (series?.publisher === 'Gollancz') {
            if (titleKey === 'flowers for algernon') {
              publisher_link = 'https://store.gollancz.co.uk/products/flowers-for-algernon';
            }
          }
          return {
            ...book,
            publisher_link,
            google_cover_url: null,
            created_at: book.created_at || new Date().toISOString()
          };
        }));
        
      } catch (error) {
        console.error('Error loading publisher data:', error);
        toast({
          title: "Connection Error",
          description: "Using cached signal data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleBookPreview = useCallback((book: EnrichedPublisherBook) => {
    setSelectedBook(book);
    setShowPreviewModal(true);
  }, []);

  const handleAddToTransmissions = useCallback((book: EnrichedPublisherBook) => {
    toast({
      title: "Signal Added",
      description: `"${book.title}" has been added to your transmissions.`,
      variant: "success"
    });
    setShowPreviewModal(false);
  }, [toast]);

  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
    setSelectedBook(null);
  }, []);

  const handlePublisherClick = (publisher: 'Penguin' | 'Gollancz') => {
    setSelectedPublisher(publisher);
  };

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
              <PublisherSelector
                publishers={[
                  { id: 'Penguin', label: 'Penguin Scan Signal Collection' },
                  { id: 'Gollancz', label: 'Gollancz SF Scan Signal Collection' }
                ]}
                selected={selectedPublisher}
                onSelect={handlePublisherClick}
              />
            </div>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-light text-slate-300 mb-2">
                {currentSeries ? `${currentSeries.publisher} ${currentSeries.name}` : `${selectedPublisher} Collection`}
              </h2>
              {currentSeries && (
                <p className="text-slate-400 text-sm">{currentSeries.description}</p>
              )}
            </div>
            
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-800 rounded-lg h-96"></div>
                  </div>
                ))}
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBooks.map(book => (
                  <PublisherBookCard
                    key={book.id}
                    book={book}
                    onLogSignal={() => handleAddToTransmissions(book)}
                    onPreview={() => handleBookPreview(book)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No signals detected"
                description={`No books found in the ${selectedPublisher} collection`}
              />
            )}
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
