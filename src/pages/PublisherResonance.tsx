
import React, { useState, useEffect, useRef } from 'react';
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Building, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublisherSeries, getPublisherBooks } from "@/services/publisherService";
import PublisherBooksGrid from "@/components/PublisherBooksGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PublisherResonance = () => {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "author">("title");
  
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const { data: publisherSeries = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['publisher-books', selectedSeries],
    queryFn: () => selectedSeries ? getPublisherBooks(selectedSeries) : Promise.resolve([]),
    enabled: !!selectedSeries
  });

  // Find Penguin Science Fiction series
  const penguinSeries = publisherSeries.find(series => 
    series.name.toLowerCase().includes('penguin') && 
    series.name.toLowerCase().includes('science fiction')
  );

  // Auto-select Penguin series on load
  useEffect(() => {
    if (penguinSeries && !selectedSeries) {
      setSelectedSeries(penguinSeries.id);
    }
  }, [penguinSeries, selectedSeries]);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out"
        });
      }

      // Grid entrance animation
      if (gridRef.current && books.length > 0) {
        gsap.from(cardsRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.3
        });
      }
    });

    return () => ctx.revert();
  }, [books]);

  const addToCardsRef = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return a.author.localeCompare(b.author);
  });

  const selectedSeriesData = publisherSeries.find(s => s.id === selectedSeries);

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-lg flex items-center justify-center border border-orange-500/30">
                <span className="text-2xl">🐧</span>
              </div>
              <h1 className="text-4xl font-light text-slate-200 tracking-wide">
                <span className="text-orange-400">Publisher Resonance</span>
              </h1>
            </div>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Curated collections from consciousness-shaping publishers
            </p>

            {/* Publisher Series Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {publisherSeries.map((series) => (
                <Button
                  key={series.id}
                  variant={selectedSeries === series.id ? "default" : "outline"}
                  onClick={() => setSelectedSeries(series.id)}
                  className={`
                    ${selectedSeries === series.id 
                      ? 'bg-orange-500/80 hover:bg-orange-500/90 text-white border-orange-400' 
                      : 'bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-orange-400/50'
                    }
                    transition-all duration-300
                  `}
                >
                  <span className="mr-2">{series.badge_emoji}</span>
                  {series.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Controls Section */}
          {selectedSeriesData && (
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "title" | "author")}
                    className="bg-slate-800/50 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="author">Sort by Author</option>
                  </select>
                </div>
              </div>

              {/* Books Grid */}
              <div ref={gridRef}>
                {booksLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-slate-400">Loading collection...</p>
                  </div>
                ) : filteredBooks.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBooks.map((book) => (
                      <div key={book.id} ref={addToCardsRef}>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-300 hover:border-orange-400/30 group">
                          <div className="flex items-start space-x-4">
                            {/* Book Cover */}
                            <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:shadow-lg transition-shadow">
                              {book.cover_url ? (
                                <img 
                                  src={book.cover_url} 
                                  alt={book.title} 
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`flex items-center justify-center text-orange-400 text-lg ${book.cover_url ? 'hidden' : ''}`}>
                                🐧
                              </div>
                            </div>
                            
                            {/* Book Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-slate-200 font-medium text-sm leading-tight group-hover:text-orange-300 transition-colors">{book.title}</h3>
                                  <p className="text-slate-400 text-xs mt-1">{book.author}</p>
                                </div>
                                <div className="w-3 h-3 rounded-full border-2 border-orange-400 bg-orange-400/10 flex-shrink-0 group-hover:bg-orange-400/20 transition-colors"></div>
                              </div>
                              
                              {book.editorial_note && (
                                <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-2 mb-3">{book.editorial_note}</p>
                              )}
                              
                              <Button
                                size="sm"
                                className="w-full bg-orange-600/70 hover:bg-orange-600/90 text-white text-xs h-8 font-light border-0 group-hover:bg-orange-500 transition-all duration-300"
                              >
                                <span className="mr-2">🐧</span>
                                Add to Transmissions
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600/50 flex items-center justify-center">
                      <span className="text-2xl">🐧</span>
                    </div>
                    <h3 className="text-slate-300 text-lg font-medium mb-2">No books found</h3>
                    <p className="text-slate-400 text-sm">
                      {searchQuery ? 'Try adjusting your search terms' : 'This collection is being curated'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback for no series selected */}
          {!selectedSeriesData && !seriesLoading && (
            <div className="bg-slate-800/30 border border-orange-500/30 rounded-lg p-8 max-w-2xl mx-auto text-center">
              <div className="text-orange-400 mb-4">
                <Building className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h2 className="text-xl text-slate-200 mb-4">Mapping Publisher Consciousness</h2>
              <p className="text-slate-400 mb-6">
                Publisher series are being calibrated. Select a series above to explore curated collections.
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
