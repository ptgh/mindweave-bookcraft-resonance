import React, { useState, useEffect, useRef } from 'react';
import { Film, Book, Star, Calendar, Trophy, ExternalLink, Play, Loader2 } from 'lucide-react';
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
import { 
  getYouTubeSearchUrl, 
  extractYouTubeId, 
  getCriterionBrowseUrl, 
  getArrowBrowseUrl,
  getCriterionPurchaseUrl,
  getArrowPurchaseUrl,
  getCriterionFilm,
  getArrowFilm,
  CRITERION_SF_FILMS,
  ARROW_SF_FILMS
} from '@/utils/streamingLinks';
import { FilterMode } from './BookToScreenSelector';


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
  const [tmdbTrailer, setTmdbTrailer] = useState<{ url: string; key: string } | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

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
    
    // Filter by mode - using verified lists
    if (filterMode === 'criterion') {
      result = result.filter(film => 
        getCriterionFilm(film.film_title) !== null || film.is_criterion_collection === true
      );
    } else if (filterMode === 'arrow') {
      result = result.filter(film => getArrowFilm(film.film_title) !== null);
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

  const openFilmModal = async (film: FilmAdaptation) => {
    setSelectedFilm(film);
    setShowFilmModal(true);
    setTmdbTrailer(null);
    
    // Fetch trailer from TMDB if not already stored
    if (!film.trailer_url) {
      setIsLoadingTrailer(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-watch-providers', {
          body: { filmTitle: film.film_title, filmYear: film.film_year, region: 'US' }
        });
        
        if (!error && data?.success && data?.trailer?.key) {
          setTmdbTrailer({ url: data.trailer.url, key: data.trailer.key });
        }
      } catch (e) {
        console.error('Failed to fetch trailer:', e);
      } finally {
        setIsLoadingTrailer(false);
      }
    }
  };

  const closeFilmModal = () => {
    setShowFilmModal(false);
    setSelectedFilm(null);
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

  // Get mode-specific info
  const getModeInfo = () => {
    if (filterMode === 'criterion') {
      return {
        browseUrl: getCriterionBrowseUrl(),
        browseText: 'Browse on Criterion',
        count: CRITERION_SF_FILMS.length,
        label: 'Criterion Collection'
      };
    }
    if (filterMode === 'arrow') {
      return {
        browseUrl: getArrowBrowseUrl(),
        browseText: 'Browse on Arrow',
        count: ARROW_SF_FILMS.length,
        label: 'Arrow Films'
      };
    }
    return null;
  };

  const modeInfo = getModeInfo();

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
              : filterMode === 'arrow'
                ? 'No Arrow Films found in your collection.'
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
          {modeInfo && ` (${modeInfo.label})`}
        </span>
        {modeInfo && (
          <a
            href={modeInfo.browseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-xs"
          >
            {modeInfo.browseText}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleFilms.map((film) => {
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
                  
                  if (isLoadingTrailer) {
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

                {/* Where to Watch - Google search integration + Physical Media */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    Where to Watch
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Primary: Google Watch search - opens in new tab showing all providers */}
                    <a
                      href={`https://www.google.com/search?q=watch+${encodeURIComponent(selectedFilm.film_title)}+${selectedFilm.film_year || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block">
                          Find Streaming Options
                        </span>
                        <span className="text-xs text-muted-foreground">
                          See all available platforms
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </a>

                    {/* Physical Media Section */}
                    {(getCriterionFilm(selectedFilm.film_title) || getArrowFilm(selectedFilm.film_title)) && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Buy Physical</p>
                        <div className="flex gap-2 flex-wrap">
                          {/* Criterion Collection */}
                          {getCriterionFilm(selectedFilm.film_title) && (
                            <a
                              href={getCriterionPurchaseUrl(selectedFilm.film_title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 transition-all group"
                            >
                              <img src="/images/criterion-logo.jpg" alt="" className="h-4 w-auto rounded-sm" />
                              <span className="text-xs font-medium text-slate-200">Criterion</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-200" />
                            </a>
                          )}

                          {/* Arrow Films */}
                          {getArrowFilm(selectedFilm.film_title) && (
                            <a
                              href={getArrowPurchaseUrl(selectedFilm.film_title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-600/30 hover:border-red-500/50 transition-all group"
                            >
                              <span className="text-red-500 font-bold text-sm">▶</span>
                              <span className="text-xs font-medium text-red-200">Arrow</span>
                              <ExternalLink className="w-3 h-3 text-red-400 group-hover:text-red-200" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Book button - styled consistently */}
                <button 
                  onClick={() => { closeFilmModal(); openBookPreview(selectedFilm); }}
                  className="w-full py-3 text-sm font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-2"
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
