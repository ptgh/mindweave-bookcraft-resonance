import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, BookOpen, Search, Map, Eye, Building, Mail } from "lucide-react";
import Header from "@/components/Header";
import { StandardButton } from "@/components/ui/standard-button";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import ContactModal from "@/components/ContactModal";
import ContributionButton from "@/components/ContributionButton";
import { SEOHead } from "@/components/SEOHead";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { NaturalLanguageSearchBar, SearchResultsView, SearchFilters, QuerySuggestions } from "@/components/search";
import { semanticSearch, SemanticSearchResult, SearchFilters as SearchFiltersType } from "@/services/semanticSearchService";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

// Type for passing book data to Signal Archive
export interface SpotlightBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  sourceType: string;
  metadata?: Record<string, unknown>;
}

const Discovery: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});
  const [responseTimeMs, setResponseTimeMs] = useState<number | undefined>();
  const [hasSearched, setHasSearched] = useState(false);
  
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const { toast } = useEnhancedToast();
  const navigate = useNavigate();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await semanticSearch(query, {
        limit: 20,
        threshold: 0.3,
        filters: searchFilters,
        searchType: 'hybrid',
      });
      
      setSearchResults(response.results);
      setResponseTimeMs(response.responseTimeMs);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchFilters, toast]);

  const handleResultClick = useCallback((result: SemanticSearchResult) => {
    // Check if this is a user's transmission (can be highlighted directly)
    const isTransmission = result.sourceType === 'transmission';
    
    let transmissionId: string | null = null;
    
    if (isTransmission) {
      // Check metadata first (most reliable for embeddings-based search)
      if (result.metadata?.transmission_id) {
        transmissionId = String(result.metadata.transmission_id);
      }
      
      // Check result.id for "transmission-123" format
      if (!transmissionId) {
        const idMatch = result.id?.match(/transmission-(\d+)/);
        if (idMatch) {
          transmissionId = idMatch[1];
        }
      }
      
      // Check bookIdentifier for "transmission_123" format
      if (!transmissionId) {
        const identifierMatch = result.bookIdentifier?.match(/transmission_(\d+)/);
        if (identifierMatch) {
          transmissionId = identifierMatch[1];
        }
      }
    }
    
    if (transmissionId && isTransmission) {
      // Navigate with highlight ID for existing transmissions
      navigate(`/book-browser?highlight=${transmissionId}&search=${encodeURIComponent(result.title)}`);
    } else {
      // For NEW books (author_books, publisher_books), pass full book data via state
      const spotlightBook: SpotlightBook = {
        id: result.id,
        title: result.title,
        author: result.author,
        coverUrl: result.metadata?.cover_url as string || '',
        description: result.metadata?.description as string || result.metadata?.editorial_note as string || '',
        sourceType: result.sourceType,
        metadata: result.metadata,
      };
      
      console.log('Navigating to Signal Archive with new book:', spotlightBook);
      navigate('/book-browser', { state: { spotlightBook } });
    }
  }, [navigate]);

  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main id="main-content" ref={mainContainerRef} className="container mx-auto px-6 py-12">
          <div ref={addFeatureBlockRef} className="feature-block text-center mb-16">
            <h1 ref={heroTitleRef} className="text-4xl font-light text-slate-200 mb-4 tracking-wide">
              <span className="text-blue-400">LEAFNODE</span>
            </h1>
            <p className="text-sm text-slate-400 mb-2">for the future-literate</p>
            
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
              Mapping the narrative threads of consciousness
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Signal strength: Rising • Frequency: 432 Hz
            </p>
          </div>
          
          {/* Semantic Search */}
          <section
            aria-labelledby="semantic-search"
            className="max-w-4xl mx-auto mb-10"
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-2xl">
              <h2 id="semantic-search" className="text-lg font-medium text-foreground mb-4">
                Semantic Search
              </h2>

              <NaturalLanguageSearchBar
                onSearch={handleSearch}
                isSearching={isSearching}
                placeholder="Describe what you're looking for..."
              />

              {hasSearched && (
                <div className="mt-6 space-y-4">
                  <SearchFilters filters={searchFilters} onFiltersChange={setSearchFilters} />

                  <SearchResultsView
                    results={searchResults}
                    query={searchQuery}
                    isLoading={isSearching}
                    responseTimeMs={responseTimeMs}
                    onResultClick={handleResultClick}
                  />

                  {searchResults.length > 0 && (
                    <QuerySuggestions
                      currentQuery={searchQuery}
                      results={searchResults.map(r => ({ title: r.title, author: r.author }))}
                      onSuggestionClick={handleSearch}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-8 max-w-4xl mx-auto">
            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/library" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Transmissions</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Your saved signal archive
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/book-browser" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Signal Archive</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Discover new sci-fi signals
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/author-matrix" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Author Matrix</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Explore author consciousness maps
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/thread-map" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Map className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Chrono Thread</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Timeline consciousness map
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/publisher-resonance" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Building className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Publisher Resonance</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Explore publisher consciousness
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/test-brain" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Neural Map</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Neural consciousness visualization
                  </p>
                </div>
              </Link>
            </div>

          </div>

          <div className="max-w-4xl mx-auto mt-16">
            <div className="flex flex-col md:grid md:grid-cols-3 items-center text-slate-400 text-xs gap-4 md:gap-4">
              <div className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                <div className="scale-75 origin-center md:origin-left">
                  <NewsletterSignup />
                </div>
              </div>
              
              <div className="flex items-center justify-center w-full md:w-auto">
                <span aria-hidden="true" className="mr-2">•</span>
                <span className="inline-flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse inline-block" />
                  <span className="whitespace-nowrap">Quantum resonance stabilized</span>
                </span>
                <span aria-hidden="true" className="ml-2">•</span>
              </div>
              
              <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
                <StandardButton
                  onClick={() => setShowContactModal(true)}
                  variant="standard"
                  size="xs"
                  className="inline-flex items-center justify-center gap-1.5 px-3 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none whitespace-nowrap min-w-[120px]"
                >
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span>Make Contact</span>
                </StandardButton>
                
                <ContributionButton 
                  walletAddress="0xDd966928cC8EA2e61221170490D696BD224866bf"
                />
              </div>
            </div>
          </div>
        </main>

        <ContactModal
          isOpen={showContactModal} 
          onClose={() => setShowContactModal(false)} 
        />
      </div>
    </>
  );
};

export default Discovery;
