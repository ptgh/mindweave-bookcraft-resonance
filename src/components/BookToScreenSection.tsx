import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, Book, Star, Calendar, Trophy, ExternalLink, Play, Loader2, X, Sparkles, Tv, FileText } from 'lucide-react';
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
import { MediaImage } from '@/components/ui/media-image';
import { preloadImages, getHighQualityDisplayUrl } from '@/utils/performance';
import { cleanPersonName, truncateWithBreak } from '@/utils/textCleaners';
import { 
  getYouTubeSearchUrl, 
  extractYouTubeId
} from '@/utils/streamingLinks';
import { FilterMode } from './BookToScreenSelector';


interface WatchProvider {
  provider_name: string;
  provider_id: number;
  logo_path?: string;
}

interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
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
  // Provider caching fields
  watch_providers?: WatchProviders | null;
  watch_providers_updated_at?: string | null;
  watch_providers_region?: string | null;
  // Book linking fields
  book_id?: string | null;
  match_confidence?: number | null;
  // Script fields
  script_url?: string | null;
  script_source?: string | null;
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
  const [linkedPublisherBook, setLinkedPublisherBook] = useState<EnrichedPublisherBook | null>(null);
  const [isLoadingLinkedBook, setIsLoadingLinkedBook] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<{ name: string } | null>(null);
  const [showDirectorPopup, setShowDirectorPopup] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [modalProviders, setModalProviders] = useState<WatchProviders | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const authorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const directorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Trailer is now sourced from film.trailer_url (no on-demand fetch)

  // Use centralized text cleaners
  const truncateAuthors = (author: string, maxLength: number = 20) => truncateWithBreak(author, maxLength);

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('is_admin', { _user_id: user.id });
        setIsAdmin(!!data);
      }
    };
    checkAdmin();
  }, []);

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
          book_author: cleanPersonName(item.book_author), // Clean on fetch
          streaming_availability: typeof item.streaming_availability === 'object' && item.streaming_availability !== null
            ? item.streaming_availability as Record<string, string>
            : null,
          awards: Array.isArray(item.awards) ? item.awards as Array<{ name: string; year: number }> : null,
          watch_providers: typeof item.watch_providers === 'object' && item.watch_providers !== null
            ? item.watch_providers as WatchProviders
            : null,
        }));
        setAdaptations(mapped);
        
        // Admin debug: Log data health stats
        if (import.meta.env.DEV || isAdmin) {
          const stats = {
            total: mapped.length,
            withBookId: mapped.filter(f => f.book_id).length,
            withPoster: mapped.filter(f => f.poster_url).length,
            withTrailer: mapped.filter(f => f.trailer_url).length,
            criterion: mapped.filter(f => f.is_criterion_collection).length,
          };
          console.log('[BookToScreen] Data health:', stats);
        }
      } catch (error) {
        console.error('Error fetching film adaptations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdaptations();
  }, [isAdmin]);

  // Helper: Check if film is in Criterion Collection (DB fields as source-of-truth)
  const isCriterionFilm = (film: FilmAdaptation): boolean => {
    return film.is_criterion_collection === true || film.criterion_url !== null;
  };

  // Helper: Get Criterion link (DB fields first, then fallback)
  const getCriterionLink = (film: FilmAdaptation): string | null => {
    if (film.criterion_url) return film.criterion_url;
    if (film.is_criterion_collection) {
      return "https://www.criterion.com/shop/browse/list?genre=science-fiction";
    }
    return null;
  };

  // Filter adaptations based on search query only (all films shown)
  const filteredAdaptations = React.useMemo(() => {
    let result = adaptations;
    
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
  }, [adaptations, searchQuery]);

  // Visible films for infinite scroll
  const visibleFilms = filteredAdaptations.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAdaptations.length;

  // Preload images for visible films to prevent loading lag
  useEffect(() => {
    if (visibleFilms.length > 0) {
      const imagesToPreload = visibleFilms.flatMap(film => [
        film.book_cover_url,
        film.poster_url
      ]).filter((url): url is string => !!url);
      
      preloadImages(imagesToPreload);
    }
  }, [visibleFilms]);

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

  // Fetch linked publisher book if book_id exists
  const fetchLinkedBook = useCallback(async (bookId: string) => {
    setIsLoadingLinkedBook(true);
    try {
      const { data, error } = await supabase
        .from('publisher_books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;

      if (data) {
        const enrichedBook: EnrichedPublisherBook = {
          ...data,
          cover_url: data.cover_url || undefined,
        };
        setLinkedPublisherBook(enrichedBook);
      }
    } catch (err) {
      console.error('Failed to fetch linked book:', err);
    } finally {
      setIsLoadingLinkedBook(false);
    }
  }, []);

  const openBookPreview = (film: FilmAdaptation) => {
    // For original screenplays, there's no source book to preview
    if (film.adaptation_type === 'original') {
      return;
    }

    // If film has a linked book_id, fetch the real publisher book
    if (film.book_id) {
      fetchLinkedBook(film.book_id).then(() => {
        // Will open the modal with linkedPublisherBook when ready
      });
      return;
    }
    
    // Fallback: create synthetic book from film data
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

  // Helper: Check if cached providers are fresh (< 7 days old)
  const isCacheFresh = useCallback((updatedAt: string | null | undefined): boolean => {
    if (!updatedAt) return false;
    const cacheDate = new Date(updatedAt);
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return (now.getTime() - cacheDate.getTime()) < sevenDaysMs;
  }, []);

  // Fetch and cache providers for a film
  const fetchProviders = useCallback(async (film: FilmAdaptation) => {
    setIsLoadingProviders(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-watch-providers', {
        body: { 
          title: film.film_title, 
          year: film.film_year,
          region: 'GB' 
        }
      });

      if (error) throw error;

      if (data?.success && data?.providers) {
        setModalProviders(data.providers as WatchProviders);
        
        // Fire-and-forget cache if admin
        if (isAdmin) {
          supabase.functions.invoke('cache-watch-providers', {
            body: {
              filmId: film.id,
              providers: data.providers,
              region: 'GB'
            }
          }).catch(err => console.warn('Failed to cache providers:', err));
        }
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [isAdmin]);

  const openFilmModal = async (film: FilmAdaptation) => {
    setSelectedFilm(film);
    setShowFilmModal(true);
    setModalProviders(null); // Reset providers
    
    // Check if we have fresh cached providers
    if (film.watch_providers && isCacheFresh(film.watch_providers_updated_at)) {
      // Use cached data immediately
      setModalProviders(film.watch_providers);
    } else {
      // Fetch fresh providers
      fetchProviders(film);
    }
  };

  const closeFilmModal = () => {
    setShowFilmModal(false);
    setSelectedFilm(null);
    setModalProviders(null);
    setIsLoadingProviders(false);
    setLinkedPublisherBook(null);
    setIsLoadingLinkedBook(false);
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

  // No mode-specific info needed - showing all films

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
      <div className="text-sm text-muted-foreground">
        <span>
          Showing {visibleFilms.length} of {filteredAdaptations.length} films
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleFilms.map((film) => {
          const { display: authorDisplay, full: authorFull } = truncateAuthors(film.book_author, 20);
          const directorDisplay = film.director && film.director.length > 20 
            ? film.director.substring(0, 18) + '...' 
            : film.director;
          
          return (
            <Card 
              key={film.id} 
              ref={el => { if (el) cardRefs.current.set(film.id, el); }}
              className="bg-card/40 border-border/30 hover:border-amber-400/30 transition-all duration-300 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex gap-3">
                  {/* Book/Source Card with Cover */}
                  <button
                    onClick={() => film.adaptation_type === 'original' ? openFilmModal(film) : openBookPreview(film)}
                    className={`flex-1 rounded-lg border transition-all text-left group overflow-hidden ${
                      film.adaptation_type === 'original'
                        ? 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 hover:border-violet-400/50 cursor-pointer'
                        : 'bg-muted/20 hover:bg-muted/40 border-border/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex gap-2 h-full">
                      {/* Cover wrapper - do not change dimensions */}
                      <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-sm">
                        {film.adaptation_type === 'original' ? (
                          <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-purple-800/40 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-violet-400" />
                          </div>
                        ) : (
                          <MediaImage
                            src={film.book_cover_url}
                            alt={film.book_title}
                            type="book"
                            quality="optimized"
                            fallbackIcon={<Book className="w-6 h-6 text-primary/40" />}
                            aspectRatio="auto"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 py-2 pr-2 min-w-0 flex flex-col">
                        <div className="flex items-center gap-1 mb-1">
                          {film.adaptation_type === 'original' ? (
                            <>
                              <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                              <span className="text-[9px] uppercase tracking-wider text-violet-400 font-medium">Original</span>
                            </>
                          ) : (
                            <>
                              <Book className="w-3 h-3 text-primary flex-shrink-0" />
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Book</span>
                            </>
                          )}
                        </div>
                        <h4 className={`text-[11px] sm:text-xs font-medium line-clamp-3 transition-colors leading-snug mb-auto ${
                          film.adaptation_type === 'original'
                            ? 'text-foreground group-hover:text-violet-400'
                            : 'text-foreground group-hover:text-primary'
                        }`}>
                          {film.adaptation_type === 'original' ? film.film_title : film.book_title}
                        </h4>
                        {/* Author/Writer + Year - fixed height row */}
                        <div className="mt-2 space-y-0.5">
                          <button
                            ref={el => { if (el) authorRefs.current.set(film.id + '-author', el); }}
                            onClick={(e) => { e.stopPropagation(); handleAuthorClick(authorFull); }}
                            className={`text-[10px] relative inline-block truncate max-w-full ${
                              film.adaptation_type === 'original' ? 'text-violet-300' : 'text-emerald-400'
                            }`}
                            title={authorFull !== authorDisplay ? authorFull : undefined}
                          >
                            {film.adaptation_type === 'original' ? (film.director || 'Writer/Director') : authorDisplay}
                            <span className={`gsap-underline absolute bottom-0 left-0 w-0 h-0.5 ${
                              film.adaptation_type === 'original' ? 'bg-violet-400' : 'bg-emerald-400'
                            }`} />
                          </button>
                          <p className="text-[10px] text-muted-foreground/70">
                            {film.adaptation_type === 'original' 
                              ? 'Original Screenplay' 
                              : film.book_publication_year || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Film Card with Poster */}
                  <button
                    onClick={() => openFilmModal(film)}
                    className="flex-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-amber-400/40 transition-all text-left group overflow-hidden"
                  >
                    <div className="flex gap-2 h-full">
                      {/* Cover wrapper - do not change dimensions */}
                      <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-sm">
                        <MediaImage
                          src={film.poster_url}
                          alt={film.film_title}
                          type="film"
                          quality="optimized"
                          fallbackIcon={<Film className="w-6 h-6 text-amber-400/40" />}
                          aspectRatio="auto"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 py-2 pr-2 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <Film className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Film</span>
                          </div>
                          {film.imdb_rating && (
                            <div className="flex items-center gap-0.5 bg-amber-500/20 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-[11px] font-bold text-amber-400">{film.imdb_rating}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-3 group-hover:text-amber-400 transition-colors leading-snug mb-auto">
                          {film.film_title}
                        </h4>
                        {/* Director + Year - same height row as book side */}
                        <div className="mt-2 space-y-0.5">
                          {film.director ? (
                            <button
                              ref={el => { if (el) directorRefs.current.set(film.id + '-director', el); }}
                              onClick={(e) => { e.stopPropagation(); handleDirectorClick(film.director!); }}
                              className="text-[10px] text-amber-300 relative inline-block truncate max-w-full"
                              title={film.director !== directorDisplay ? film.director : undefined}
                            >
                              {directorDisplay}
                              <span className="gsap-underline absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">—</span>
                          )}
                          <p className="text-[10px] text-muted-foreground/70">
                            {film.film_year || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Badges row - AI suggested and Script */}
                {(film.source === 'ai_suggested' || film.script_url) && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                    {film.source === 'ai_suggested' && (
                      <span className="text-[10px] text-violet-400 font-medium">✨ AI Suggested</span>
                    )}
                    {film.script_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-medium bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        <FileText className="w-3 h-3" />
                        Script
                      </span>
                    )}
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

      {/* Film Preview Modal - Styled to match Signal Preview */}
      {showFilmModal && selectedFilm && createPortal(
        <div className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center bg-background/50 backdrop-blur-sm p-4" onClick={closeFilmModal}>
          <div 
            className="modal-content bg-slate-800/50 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - matching Signal Preview style */}
            <div className="p-3 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="text-slate-200 text-base font-medium">
                    Film Preview
                  </span>
                </div>
                <button
                  onClick={closeFilmModal}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Trailer - sourced from DB only */}
              <div className="aspect-video bg-black relative">
                {(() => {
                  const trailerKey = extractYouTubeId(selectedFilm.trailer_url || '');
                  
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
                  
                  // No trailer in DB - show pending state with YouTube search fallback
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                      <Film className="w-12 h-12 text-amber-400/30 mb-3" />
                      <span className="text-sm text-muted-foreground mb-3">Trailer pending</span>
                      <a
                        href={getYouTubeSearchUrl(selectedFilm.film_title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Search YouTube
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Content section */}
              <div className="p-4 space-y-4">
                {/* Title & meta - matching book modal layout */}
                <div className="flex space-x-4">
                  {/* Film poster thumbnail */}
                  {selectedFilm.poster_url && (
                    <div className="flex-shrink-0 w-16 h-24 bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden shadow-lg">
                      <MediaImage
                        src={getHighQualityDisplayUrl(selectedFilm.poster_url)}
                        alt={selectedFilm.film_title}
                        type="film"
                        quality="optimized"
                        fallbackIcon={<Film className="w-6 h-6 text-amber-400/40" />}
                        aspectRatio="auto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h2 className="text-slate-200 font-bold text-xl leading-tight">
                      {selectedFilm.film_title}
                    </h2>
                    {selectedFilm.adaptation_type === 'original' ? (
                      <p className="text-violet-300 text-sm">
                        Original Screenplay by {selectedFilm.book_author || selectedFilm.director || 'Unknown'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-slate-400 text-sm">
                          Based on "{selectedFilm.book_title}" by {selectedFilm.book_author}
                        </p>
                        {/* Not linked to library banner */}
                        {!selectedFilm.book_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            ⚠ Not linked to library record
                          </span>
                        )}
                        {selectedFilm.book_id && selectedFilm.match_confidence && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Linked ({selectedFilm.match_confidence}% match)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Film details row */}
                    <div className="flex flex-wrap gap-3 text-sm pt-1">
                      {selectedFilm.film_year && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{selectedFilm.film_year}</span>
                        </div>
                      )}
                      {selectedFilm.director && (
                        <button 
                          onClick={() => handleDirectorClick(selectedFilm.director!)} 
                          className="text-amber-300 hover:text-amber-400 transition-colors text-sm"
                        >
                          Dir: {selectedFilm.director}
                        </button>
                      )}
                      {selectedFilm.imdb_rating && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-medium text-sm">{selectedFilm.imdb_rating}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedFilm.notable_differences && (
                  <div className="space-y-2">
                    <h3 className="text-slate-200 font-semibold text-sm">About the Adaptation</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-h-24 overflow-y-auto scrollbar-hide">
                      {selectedFilm.notable_differences}
                    </p>
                  </div>
                )}

                {/* Awards */}
                {selectedFilm.awards && selectedFilm.awards.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
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

                {/* Streaming Section - with cached providers */}
                <div className="border border-slate-700 rounded-lg p-3 bg-slate-700/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-200 text-sm font-medium">Watch Options (UK)</span>
                    </div>
                    {isLoadingProviders && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                  
                  {/* Provider chips */}
                  {modalProviders && (
                    <div className="space-y-2">
                      {/* Streaming (flatrate) */}
                      {modalProviders.flatrate && modalProviders.flatrate.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {modalProviders.flatrate.map((p) => (
                            <span
                              key={p.provider_id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20"
                            >
                              {p.logo_path && (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} 
                                  alt="" 
                                  className="w-4 h-4 rounded-sm"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              {p.provider_name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Rent */}
                      {modalProviders.rent && modalProviders.rent.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {modalProviders.rent.slice(0, 4).map((p) => (
                            <span
                              key={p.provider_id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
                            >
                              {p.logo_path && (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} 
                                  alt="" 
                                  className="w-4 h-4 rounded-sm"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              Rent: {p.provider_name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Buy */}
                      {modalProviders.buy && modalProviders.buy.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {modalProviders.buy.slice(0, 3).map((p) => (
                            <span
                              key={p.provider_id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20"
                            >
                              {p.logo_path && (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} 
                                  alt="" 
                                  className="w-4 h-4 rounded-sm"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              Buy: {p.provider_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* No providers found or loading */}
                  {!isLoadingProviders && !modalProviders && (
                    <p className="text-slate-500 text-xs">No streaming info available</p>
                  )}
                  
                  {/* Fallback Google search */}
                  <a
                    href={`https://www.google.com/search?q=watch+${encodeURIComponent(selectedFilm.film_title)}+${selectedFilm.film_year || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <span>Search all platforms</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Buy Physical Section - only Criterion if applicable */}
                {isCriterionFilm(selectedFilm) && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Buy Physical</p>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={getCriterionLink(selectedFilm) || "https://www.criterion.com/shop/browse?genre=science-fiction"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600/50 bg-slate-700/30 hover:bg-slate-700/50 hover:border-slate-500 transition-all group"
                      >
                        <img src="/images/criterion-logo.jpg" alt="" className="h-5 w-auto rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-sm text-slate-200">
                          Criterion{selectedFilm.criterion_spine ? ` #${selectedFilm.criterion_spine}` : ''}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions - matching Signal Preview style */}
            <div className="border-t border-slate-700 p-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={closeFilmModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  Close
                </button>
                {/* Read Screenplay button - only when script_url exists */}
                {selectedFilm.script_url && (
                  <a
                    href={selectedFilm.script_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Read Screenplay
                  </a>
                )}
                {/* Only show View Book button for adaptations, not original screenplays */}
                {selectedFilm.adaptation_type !== 'original' && (
                  <button 
                    onClick={() => { closeFilmModal(); openBookPreview(selectedFilm); }}
                    disabled={isLoadingLinkedBook}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Book className="w-4 h-4" />
                    {selectedFilm.book_id ? 'View Library Book' : 'View Book'}
                    {!selectedFilm.book_id && (
                      <span className="text-[10px] text-muted-foreground ml-1">(unlinked)</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {(selectedBook || linkedPublisherBook) && (
        <EnhancedBookPreviewModal 
          book={(linkedPublisherBook || selectedBook)!} 
          onClose={() => { 
            setSelectedBook(null); 
            setLinkedPublisherBook(null); 
          }} 
          onAddBook={() => {}} 
        />
      )}
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
