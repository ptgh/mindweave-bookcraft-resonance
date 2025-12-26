import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, Book, Star, Calendar, Trophy, ExternalLink, Play, Search, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { EnrichedPublisherBook } from '@/services/publisherService';
import { AuthorPopup } from '@/components/AuthorPopup';
import { DirectorPopup } from '@/components/DirectorPopup';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { getGoogleWatchLink, getProviderDirectLink, getYouTubeSearchUrl, extractYouTubeId, getCriterionBrowseUrl } from '@/utils/streamingLinks';
import { FilterMode } from './BookToScreenSelector';

interface WatchProvider {
  id: number;
  name: string;
  logo: string | null;
  priority: number;
  deepLink?: string | null;
}

interface WatchProvidersData {
  streaming: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  link: string | null;
}

interface FilmAdaptation {
  id: string;
  book_title: string;
  book_author: string;
  book_publication_year: number | null;
  book_cover_url?: string | null;
  film_title: string;
  film_year: number | null;
  director: string | null;
  imdb_rating: number | null;
  rotten_tomatoes_score: number | null;
  poster_url: string | null;
  trailer_url: string | null;
  streaming_availability: Record<string, string> | null;
  adaptation_type: string | null;
  notable_differences: string | null;
  awards: Array<{ name: string; year: number }> | null;
  criterion_spine?: number | null;
  criterion_url?: string | null;
  is_criterion_collection?: boolean;
  source?: string;
}

interface BookToScreenSectionProps {
  className?: string;
  showTitle?: boolean;
  filterMode?: FilterMode;
  searchQuery?: string;
}

const BATCH_SIZE = 12;

export const BookToScreenSection: React.FC<BookToScreenSectionProps> = ({ 
  className, 
  showTitle = true,
  filterMode = 'all',
  searchQuery = ''
}) => {
  const [adaptations, setAdaptations] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState<FilmAdaptation | null>(null);
  const [showFilmModal, setShowFilmModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<{ name: string } | null>(null);
  const [showDirectorPopup, setShowDirectorPopup] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const authorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const directorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProvidersData | null>(null);
  const [tmdbTrailer, setTmdbTrailer] = useState<{ url: string; key: string } | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  // Clean author names - remove encoding issues and truncate for display
  const cleanAuthorName = (author: string): string => {
    // Remove Bengali/other script characters and clean up common AI formatting issues
    return author
      .replace(/[\u0980-\u09FF]+/g, '') // Remove Bengali characters
      .replace(/\s+(or|and|,)\s+/gi, ', ') // Normalize separators
      .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parenthetical notes
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim();
  };

  const truncateAuthors = (author: string, maxLength: number = 30): { display: string; full: string } => {
    const cleaned = cleanAuthorName(author);
    if (cleaned.length <= maxLength) {
      return { display: cleaned, full: cleaned };
    }
    // Find a good break point (comma or space)
    const breakPoint = cleaned.lastIndexOf(',', maxLength) > 10 
      ? cleaned.lastIndexOf(',', maxLength) 
      : cleaned.lastIndexOf(' ', maxLength);
    return {
      display: cleaned.substring(0, breakPoint > 10 ? breakPoint : maxLength) + '...',
      full: cleaned
    };
  };

  useEffect(() => {
    const fetchAdaptations = async () => {
      try {
        const { data, error } = await supabase
          .from('sf_film_adaptations')
          .select('*')
          .order('created_at', { ascending: false }); // New films at top

        if (error) throw error;
        
        const mapped: FilmAdaptation[] = (data || []).map(item => ({
          ...item,
          book_author: cleanAuthorName(item.book_author), // Clean on fetch
          streaming_availability: typeof item.streaming_availability === 'object' && item.streaming_availability !== null
            ? item.streaming_availability as Record<string, string>
            : null,
          awards: Array.isArray(item.awards) ? item.awards as Array<{ name: string; year: number }> : null,
        }));
        setAdaptations(mapped);
      } catch (error) {
        console.error('Error fetching film adaptations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdaptations();
  }, []);

  // Filter adaptations based on mode and search query
  const filteredAdaptations = React.useMemo(() => {
    let result = adaptations;
    
    // Filter by mode
    if (filterMode === 'criterion') {
      result = result.filter(film => film.is_criterion_collection === true);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(film => 
        film.film_title.toLowerCase().includes(query) ||
        film.book_title.toLowerCase().includes(query) ||
        film.book_author.toLowerCase().includes(query) ||
        (film.director && film.director.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [adaptations, filterMode, searchQuery]);

  // Visible films for infinite scroll
  const visibleFilms = filteredAdaptations.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAdaptations.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filterMode, searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredAdaptations.length));
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, filteredAdaptations.length]);

  // GSAP fade-in animation for cards (initial load + new cards)
  const prevCountRef = useRef(0);
  useEffect(() => {
    const cards = Array.from(cardRefs.current.values());
    if (cards.length > 0) {
      // Determine if this is initial load or adding more cards
      const isInitialLoad = prevCountRef.current === 0;
      const cardsToAnimate = isInitialLoad ? cards : cards.slice(-BATCH_SIZE);
      
      gsap.fromTo(cardsToAnimate,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: isInitialLoad ? 0.03 : 0.05, 
          ease: 'power2.out' 
        }
      );
      prevCountRef.current = cards.length;
    }
  }, [visibleCount, filteredAdaptations.length]);

  // GSAP underline animations
  useEffect(() => {
    const setupUnderlineAnimation = (ref: HTMLButtonElement) => {
      const underline = ref.querySelector('.gsap-underline');
      if (!underline) return;
      
      const handleEnter = () => gsap.to(underline, { width: '100%', duration: 0.3, ease: 'power2.out' });
      const handleLeave = () => gsap.to(underline, { width: '0%', duration: 0.3, ease: 'power2.out' });
      
      ref.addEventListener('mouseenter', handleEnter);
      ref.addEventListener('mouseleave', handleLeave);
      
      return () => {
        ref.removeEventListener('mouseenter', handleEnter);
        ref.removeEventListener('mouseleave', handleLeave);
      };
    };

    const cleanups: (() => void)[] = [];
    authorRefs.current.forEach(ref => {
      const cleanup = setupUnderlineAnimation(ref);
      if (cleanup) cleanups.push(cleanup);
    });
    directorRefs.current.forEach(ref => {
      const cleanup = setupUnderlineAnimation(ref);
      if (cleanup) cleanups.push(cleanup);
    });

    return () => cleanups.forEach(fn => fn());
  }, [visibleFilms]);

  const openBookPreview = (film: FilmAdaptation) => {
    const book: EnrichedPublisherBook = {
      id: film.id,
      title: film.book_title,
      author: film.book_author,
      series_id: '',
      created_at: new Date().toISOString(),
      cover_url: film.book_cover_url || undefined,
    };
    setSelectedBook(book);
  };

  // Auto-detect user region from timezone
  const getUserRegion = useCallback((): string => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const regionMap: Record<string, string> = {
        'Australia': 'AU', 'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
        'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
        'Asia/Tokyo': 'JP', 'Asia/Hong_Kong': 'HK', 'Pacific/Auckland': 'NZ'
      };
      for (const [key, code] of Object.entries(regionMap)) {
        if (tz.includes(key)) return code;
      }
      return 'US'; // Default
    } catch { return 'US'; }
  }, []);

  const openFilmModal = async (film: FilmAdaptation) => {
    setSelectedFilm(film);
    setShowFilmModal(true);
    setWatchProviders(null);
    setTmdbTrailer(null);
    
    // Fetch watch providers and trailer from TMDB with auto-detected region
    setIsLoadingProviders(true);
    try {
      const region = getUserRegion();
      const { data, error } = await supabase.functions.invoke('get-watch-providers', {
        body: { filmTitle: film.film_title, filmYear: film.film_year, region }
      });
      
      if (!error && data?.success && data?.found) {
        setWatchProviders(data.providers);
        // Use TMDB trailer if available
        if (data.trailer?.key) {
          setTmdbTrailer({ url: data.trailer.url, key: data.trailer.key });
        }
      }
    } catch (e) {
      console.error('Failed to fetch watch providers:', e);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const closeFilmModal = () => {
    setShowFilmModal(false);
    setSelectedFilm(null);
    setWatchProviders(null);
    setTmdbTrailer(null);
  };

  const handleAuthorClick = async (authorName: string) => {
    const { data } = await supabase
      .from('scifi_authors')
      .select('*')
      .ilike('name', `%${authorName}%`)
      .limit(1)
      .single();

    if (data) {
      setSelectedAuthor(data as ScifiAuthor);
    } else {
      setSelectedAuthor({ id: 'temp', name: authorName, created_at: '', updated_at: '' } as ScifiAuthor);
    }
    setShowAuthorPopup(true);
  };

  const handleDirectorClick = (directorName: string) => {
    closeFilmModal();
    setSelectedDirector({ name: directorName });
    setShowDirectorPopup(true);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-medium text-foreground">Book to Screen</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (filteredAdaptations.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Film className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {searchQuery 
            ? `No films found matching "${searchQuery}"`
            : filterMode === 'criterion' 
              ? 'No Criterion Collection films found. Click "Scan Signal Collection ✨ AI" to populate with Criterion titles.'
              : 'No film adaptations found'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-medium text-foreground">Book to Screen</h2>
            <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-400">
              {filteredAdaptations.length} Adaptations
            </Badge>
          </div>
        </div>
      )}

      {/* Film count indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {visibleFilms.length} of {filteredAdaptations.length} films
          {filterMode === 'criterion' && ' (Criterion Collection)'}
        </span>
        {filterMode === 'criterion' && (
          <a
            href={getCriterionBrowseUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-xs"
          >
            Browse on Criterion
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleFilms.map((film) => {
          const isInCriterion = film.is_criterion_collection === true;
          
          return (
            <Card 
              key={film.id} 
              ref={el => { if (el) cardRefs.current.set(film.id, el); }}
              className="bg-card/40 border-border/30 hover:border-amber-400/30 transition-all duration-300 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex gap-2">
                  {/* Book Card with Cover */}
                  <button
                    onClick={() => openBookPreview(film)}
                    className="flex-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-primary/40 transition-all text-left group overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <div className="w-16 h-24 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                        {film.book_cover_url ? (
                          <img 
                            src={film.book_cover_url} 
                            alt={film.book_title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="w-6 h-6 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-2 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Book className="w-3 h-3 text-primary" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Book</span>
                        </div>
                        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                          {film.book_title}
                        </h4>
                        {(() => {
                          const { display, full } = truncateAuthors(film.book_author);
                          return (
                            <button
                              ref={el => { if (el) authorRefs.current.set(film.id + '-author', el); }}
                              onClick={(e) => { e.stopPropagation(); handleAuthorClick(full); }}
                              className="text-[10px] text-emerald-400 mt-1 relative inline-block"
                              title={full !== display ? full : undefined}
                            >
                              {display}
                              <span className="gsap-underline absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400" />
                            </button>
                          );
                        })()}
                        {film.book_publication_year && (
                          <p className="text-[9px] text-muted-foreground/70 mt-0.5">{film.book_publication_year}</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Film Card with Poster */}
                  <button
                    onClick={() => openFilmModal(film)}
                    className="flex-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-amber-400/40 transition-all text-left group overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <div className="w-16 h-24 flex-shrink-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 overflow-hidden">
                        {film.poster_url ? (
                          <img 
                            src={film.poster_url} 
                            alt={film.film_title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-amber-400/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-2 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <Film className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Film</span>
                          </div>
                          {film.imdb_rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              <span className="text-[10px] font-medium text-amber-400">{film.imdb_rating}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-amber-400 transition-colors leading-tight">
                          {film.film_title}
                        </h4>
                        {film.director && (
                          <button
                            ref={el => { if (el) directorRefs.current.set(film.id + '-director', el); }}
                            onClick={(e) => { e.stopPropagation(); handleDirectorClick(film.director!); }}
                            className="text-[10px] text-amber-300 mt-1 relative inline-block"
                          >
                            {film.director}
                            <span className="gsap-underline absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400" />
                          </button>
                        )}
                        {film.film_year && (
                          <p className="text-[9px] text-muted-foreground/70 mt-0.5">{film.film_year}</p>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Criterion Badge with purchase link */}
                {isInCriterion && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                      <img src="/images/criterion-logo.jpg" alt="" className="h-3 w-auto rounded-sm" />
                      <span className="text-[10px] text-amber-400 font-medium">Criterion Collection</span>
                      {film.criterion_spine && (
                        <span className="text-[9px] text-muted-foreground">#{film.criterion_spine}</span>
                      )}
                    </div>
                    {film.criterion_url && (
                      <a
                        href={film.criterion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Buy
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* AI-suggested badge */}
                {film.source === 'ai_suggested' && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                    <span className="text-[10px] text-violet-400 font-medium">✨ AI Suggested</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load more trigger for infinite scroll */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-sm">Loading more films...</span>
          </div>
        </div>
      )}

      {/* Film Preview Modal - Original styling with scroll */}
      {showFilmModal && selectedFilm && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeFilmModal}>
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900/95 rounded-xl shadow-2xl border border-amber-500/30 overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeFilmModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
              {/* Trailer */}
              <div className="aspect-video bg-black relative">
                {(() => {
                  const trailerKey = tmdbTrailer?.key || extractYouTubeId(selectedFilm.trailer_url || '');
                  
                  if (trailerKey) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?rel=0&autoplay=0`}
                        title={`${selectedFilm.film_title} Trailer`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    );
                  }
                  
                  if (isLoadingProviders) {
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                        <Loader2 className="w-10 h-10 text-amber-400/50 animate-spin mb-3" />
                        <span className="text-sm text-muted-foreground">Finding trailer...</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                      <Film className="w-12 h-12 text-amber-400/30 mb-3" />
                      <a
                        href={getYouTubeSearchUrl(selectedFilm.film_title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Watch on YouTube
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Title & meta */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedFilm.film_title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on "{selectedFilm.book_title}" by {selectedFilm.book_author}
                  </p>
                </div>

                {/* Film details */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedFilm.film_year && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>{selectedFilm.film_year}</span>
                    </div>
                  )}
                  {selectedFilm.director && (
                    <button 
                      onClick={() => handleDirectorClick(selectedFilm.director!)} 
                      className="text-amber-300 hover:text-amber-400 transition-colors"
                    >
                      Dir: {selectedFilm.director}
                    </button>
                  )}
                  {selectedFilm.imdb_rating && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="font-medium">{selectedFilm.imdb_rating}/10</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedFilm.notable_differences && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedFilm.notable_differences}</p>
                )}

                {/* Awards */}
                {selectedFilm.awards && selectedFilm.awards.length > 0 && (
                  <div className="flex items-start gap-3 flex-wrap">
                    <Trophy className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div className="flex flex-wrap gap-2">
                      {selectedFilm.awards.map((award, idx) => (
                        <a
                          key={idx}
                          href={`https://www.google.com/search?q=${encodeURIComponent(award.name + ' ' + selectedFilm.film_title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          {award.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Where to Watch - with Google direct links for each provider */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    Where to Watch
                  </h4>
                  
                  {(() => {
                    // Filter for Google Play only (provider_id: 3 = Google Play Movies, 192 = YouTube)
                    const GOOGLE_PLAY_ID = 3;
                    const googlePlayRent = watchProviders?.rent.find(p => p.id === GOOGLE_PLAY_ID);
                    const googlePlayBuy = watchProviders?.buy.find(p => p.id === GOOGLE_PLAY_ID);
                    const hasGooglePlay = googlePlayRent || googlePlayBuy;
                    
                    if (isLoadingProviders) {
                      return (
                        <div className="flex items-center gap-2 text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Finding streaming options...</span>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {/* Google Play - Rent/Buy */}
                        {hasGooglePlay ? (
                          <a
                            href={`https://play.google.com/store/search?q=${encodeURIComponent(selectedFilm.film_title + ' ' + (selectedFilm.film_year || ''))}&c=movies`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-primary/30 transition-all group"
                          >
                            {(googlePlayRent?.logo || googlePlayBuy?.logo) && (
                              <img 
                                src={googlePlayRent?.logo || googlePlayBuy?.logo || ''} 
                                alt="Google Play" 
                                className="w-10 h-10 rounded-lg"
                              />
                            )}
                            <div className="text-left">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block">
                                Google Play Movies
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {googlePlayRent && googlePlayBuy ? 'Rent or Buy' : googlePlayRent ? 'Rent' : 'Buy'}
                              </span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary ml-auto" />
                          </a>
                        ) : (
                          <a
                            href={`https://play.google.com/store/search?q=${encodeURIComponent(selectedFilm.film_title + ' ' + (selectedFilm.film_year || ''))}&c=movies`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Search className="w-4 h-4" />
                            Search on Google Play
                          </a>
                        )}

                        {/* Criterion link */}
                        {selectedFilm.is_criterion_collection && selectedFilm.criterion_url && (
                          <a
                            href={selectedFilm.criterion_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors"
                          >
                            <img src="/images/criterion-logo.jpg" alt="" className="h-4 w-auto rounded-sm" />
                            Buy from Criterion Collection
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* View Book button */}
                <button 
                  onClick={() => { closeFilmModal(); openBookPreview(selectedFilm); }}
                  className="w-full py-3 text-sm font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Book className="w-4 h-4" />
                  View Book
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedBook && <EnhancedBookPreviewModal book={selectedBook} onClose={() => setSelectedBook(null)} onAddBook={() => {}} />}
      <AuthorPopup author={selectedAuthor} isVisible={showAuthorPopup} onClose={() => setShowAuthorPopup(false)} />
      <DirectorPopup 
        director={selectedDirector} 
        isVisible={showDirectorPopup} 
        onClose={() => setShowDirectorPopup(false)} 
        onFilmClick={(filmTitle) => {
          setShowDirectorPopup(false);
          const film = adaptations.find(f => 
            f.film_title.toLowerCase().includes(filmTitle.toLowerCase()) ||
            filmTitle.toLowerCase().includes(f.film_title.toLowerCase())
          );
          if (film) {
            openFilmModal(film);
          }
        }}
      />
    </div>
  );
};

export default BookToScreenSection;
