import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, Book, Star, Calendar, Trophy, ExternalLink, Play, Search } from 'lucide-react';
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
import { getGoogleWatchLink, getYouTubeSearchUrl, extractYouTubeId, getCriterionBrowseUrl } from '@/utils/streamingLinks';
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

  useEffect(() => {
    const fetchAdaptations = async () => {
      try {
        const { data, error } = await supabase
          .from('sf_film_adaptations')
          .select('*')
          .order('imdb_rating', { ascending: false, nullsFirst: false });

        if (error) throw error;
        
        const mapped: FilmAdaptation[] = (data || []).map(item => ({
          ...item,
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

  // GSAP fade-in animation for new cards
  useEffect(() => {
    const newCards = Array.from(cardRefs.current.values()).slice(-BATCH_SIZE);
    if (newCards.length > 0 && visibleCount > BATCH_SIZE) {
      gsap.fromTo(newCards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [visibleCount]);

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

  const openFilmModal = (film: FilmAdaptation) => {
    setSelectedFilm(film);
    setShowFilmModal(true);
  };

  const closeFilmModal = () => {
    setShowFilmModal(false);
    setSelectedFilm(null);
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
                        <button
                          ref={el => { if (el) authorRefs.current.set(film.id + '-author', el); }}
                          onClick={(e) => { e.stopPropagation(); handleAuthorClick(film.book_author); }}
                          className="text-[10px] text-emerald-400 mt-1 relative inline-block"
                        >
                          {film.book_author}
                          <span className="gsap-underline absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400" />
                        </button>
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

      {/* Film Preview Modal */}
      {showFilmModal && selectedFilm && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeFilmModal}>
          <div className="relative w-full max-w-2xl bg-slate-900/95 rounded-xl overflow-hidden shadow-2xl border border-amber-500/30" onClick={(e) => e.stopPropagation()}>
            {/* Trailer */}
            <div className="aspect-video bg-black relative">
              {selectedFilm.trailer_url && extractYouTubeId(selectedFilm.trailer_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(selectedFilm.trailer_url)}?rel=0&autoplay=0`}
                  title={`${selectedFilm.film_title} Trailer`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                  <Film className="w-12 h-12 text-amber-400/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">Find official trailer</p>
                  <a
                    href={getYouTubeSearchUrl(selectedFilm.film_title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch on YouTube
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{selectedFilm.film_title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on "{selectedFilm.book_title}" by {selectedFilm.book_author}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {selectedFilm.film_year && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>{selectedFilm.film_year}</span>
                  </div>
                )}
                {selectedFilm.director && (
                  <button onClick={() => handleDirectorClick(selectedFilm.director!)} className="text-amber-300 hover:text-amber-400 transition-colors relative group">
                    <span>Dir: {selectedFilm.director}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
                  </button>
                )}
                {selectedFilm.imdb_rating && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-medium">{selectedFilm.imdb_rating}/10</span>
                  </div>
                )}
              </div>

              {selectedFilm.notable_differences && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedFilm.notable_differences}</p>
              )}

              {selectedFilm.awards && selectedFilm.awards.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Awards</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFilm.awards.slice(0, 4).map((award, idx) => (
                      <a
                        key={idx}
                        href={`https://www.google.com/search?q=${encodeURIComponent(award.name + ' ' + award.year)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        {award.name}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Where to Watch - Google Search Method */}
              <div className="space-y-2 pt-2 border-t border-border/20">
                <p className="text-sm font-medium text-foreground">Where to Watch</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={getGoogleWatchLink(selectedFilm.film_title, selectedFilm.film_year)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border-blue-500/30 text-blue-300"
                  >
                    <Search className="w-4 h-4" />
                    Find Streaming Options
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {selectedFilm.is_criterion_collection && selectedFilm.criterion_url && (
                    <a
                      href={selectedFilm.criterion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/30 text-amber-300"
                    >
                      <img src="/images/criterion-logo.jpg" alt="" className="h-4 w-auto rounded-sm" />
                      Buy on Criterion
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Shows all available streaming services including Netflix, Apple TV+, Prime Video, and more
                </p>
              </div>

              <button 
                onClick={() => { closeFilmModal(); openBookPreview(selectedFilm); }}
                className="w-full mt-2 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Book className="w-3 h-3" />
                View Book
              </button>
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
