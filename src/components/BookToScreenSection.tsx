import React, { useState, useEffect, useRef } from 'react';
import { Film, Book, X, Star, Calendar, Trophy, ExternalLink, Play, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
}

interface BookToScreenSectionProps {
  className?: string;
  showTitle?: boolean;
}

// Only Criterion and Apple TV supported
const streamingServices: Record<string, { color: string; bgColor: string; label: string; icon?: string }> = {
  apple: { color: 'text-slate-200', bgColor: 'bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/40', label: 'Apple TV+' },
  criterion: { color: 'text-amber-400', bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30', label: 'Criterion' },
};

export const BookToScreenSection: React.FC<BookToScreenSectionProps> = ({ className, showTitle = true }) => {
  const [adaptations, setAdaptations] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState<FilmAdaptation | null>(null);
  const [showFilmModal, setShowFilmModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<{ name: string } | null>(null);
  const [showDirectorPopup, setShowDirectorPopup] = useState(false);
  const authorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const directorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const fetchAdaptations = async () => {
      try {
        const { data, error } = await supabase
          .from('sf_film_adaptations')
          .select('*')
          .order('imdb_rating', { ascending: false });

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
  }, [adaptations]);

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
    // Close film modal first so director popup appears on top
    closeFilmModal();
    setSelectedDirector({ name: directorName });
    setShowDirectorPopup(true);
  };

  const extractYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
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

  if (adaptations.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-medium text-foreground">Book to Screen</h2>
            <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-400">
              {adaptations.length} Adaptations
            </Badge>
          </div>
          <a
            href="https://www.criterion.com/shop/browse?genre=science-fiction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
          >
            <img src="/images/criterion-logo.jpg" alt="Criterion" className="h-5 w-auto rounded" />
            <span className="text-xs text-amber-400 font-medium">Browse Criterion</span>
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {adaptations.map((film) => {
          // Filter streaming to only show apple and criterion
          const filteredStreaming = film.streaming_availability 
            ? Object.entries(film.streaming_availability).filter(([platform]) => platform === 'apple' || platform === 'criterion')
            : [];
          
          return (
            <Card key={film.id} className="bg-card/40 border-border/30 hover:border-amber-400/30 transition-all duration-300 overflow-hidden">
              <div className="p-3">
                <div className="flex gap-2">
                  {/* Book Card with Cover */}
                  <button
                    onClick={() => openBookPreview(film)}
                    className="flex-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-primary/40 transition-all text-left group overflow-hidden"
                  >
                    <div className="flex gap-2">
                      {/* Book Cover */}
                      <div className="w-16 h-24 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                        {film.book_cover_url ? (
                          <img 
                            src={film.book_cover_url} 
                            alt={film.book_title}
                            className="w-full h-full object-cover"
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
                      {/* Film Poster */}
                      <div className="w-16 h-24 flex-shrink-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 overflow-hidden">
                        {film.poster_url ? (
                          <img 
                            src={film.poster_url} 
                            alt={film.film_title}
                            className="w-full h-full object-cover"
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

                {/* Streaming Links - Only show Criterion or Apple TV if available */}
                {(film.streaming_availability?.criterion || film.streaming_availability?.apple) && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/20">
                    {film.streaming_availability?.criterion && (
                      <a
                        href={film.streaming_availability.criterion.includes('/films/') 
                          ? film.streaming_availability.criterion 
                          : `https://www.criterion.com/search#stq=${encodeURIComponent(film.film_title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded border transition-all bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src="/images/criterion-logo.jpg" alt="" className="h-3 w-auto rounded-sm" />
                        Criterion
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {film.streaming_availability?.apple && (
                      <a
                        href={film.streaming_availability.apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded border transition-all bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/40 text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple TV
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Film Preview Modal - tap away to close */}
      {showFilmModal && selectedFilm && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeFilmModal}>
          <div className="relative w-full max-w-2xl bg-slate-900/95 rounded-xl overflow-hidden shadow-2xl border border-amber-500/30" onClick={(e) => e.stopPropagation()}>
            {/* Trailer - Embed YouTube or provide search link */}
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
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedFilm.film_title + ' official trailer')}&sp=EgIQAQ%253D%253D`}
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

              {/* Where to Watch - Only show if available */}
              {(selectedFilm.streaming_availability?.criterion || selectedFilm.streaming_availability?.apple) && (
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <p className="text-sm font-medium text-foreground">Where to Watch</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Apple TV - only if available */}
                    {selectedFilm.streaming_availability?.apple && (
                      <a
                        href={selectedFilm.streaming_availability.apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/40 text-slate-200"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple TV
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {/* Criterion - use proper URL if available */}
                    {selectedFilm.streaming_availability?.criterion && (
                      <a
                        href={selectedFilm.streaming_availability.criterion.includes('/films/') 
                          ? selectedFilm.streaming_availability.criterion 
                          : `https://www.criterion.com/search#stq=${encodeURIComponent(selectedFilm.film_title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400"
                      >
                        <img src="/images/criterion-logo.jpg" alt="Criterion" className="h-4 w-auto rounded" />
                        Buy Physical
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

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
          // Find the film in adaptations and open its modal
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
