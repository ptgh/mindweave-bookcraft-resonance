import React, { useState, useEffect } from 'react';
import { Film, Book, X, Star, Calendar, Trophy, ExternalLink, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { EnrichedPublisherBook } from '@/services/publisherService';

interface FilmAdaptation {
  id: string;
  book_title: string;
  book_author: string;
  book_publication_year: number | null;
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
}

interface BookToScreenSectionProps {
  className?: string;
  showTitle?: boolean;
}

// Streaming service colors and icons
const streamingServices: Record<string, { color: string; bgColor: string; label: string }> = {
  netflix: { color: 'text-red-500', bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30', label: 'Netflix' },
  prime: { color: 'text-blue-400', bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', label: 'Prime' },
  hbo: { color: 'text-purple-400', bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30', label: 'Max' },
  apple: { color: 'text-slate-300', bgColor: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30', label: 'Apple TV+' },
  disney: { color: 'text-blue-300', bgColor: 'bg-blue-400/10 hover:bg-blue-400/20 border-blue-400/30', label: 'Disney+' },
  peacock: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30', label: 'Peacock' },
  criterion: { color: 'text-amber-400', bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30', label: 'Criterion' },
};

export const BookToScreenSection: React.FC<BookToScreenSectionProps> = ({ className, showTitle = true }) => {
  const [adaptations, setAdaptations] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState<FilmAdaptation | null>(null);
  const [showFilmModal, setShowFilmModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);

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

  const openBookPreview = (film: FilmAdaptation) => {
    const book: EnrichedPublisherBook = {
      id: film.id,
      title: film.book_title,
      author: film.book_author,
      series_id: '',
      created_at: new Date().toISOString(),
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

  if (adaptations.length === 0) {
    return null;
  }

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
        </div>
      )}

      {/* Paired Book/Film Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {adaptations.map((film) => (
          <Card
            key={film.id}
            className="bg-card/40 border-border/30 hover:border-amber-400/30 transition-all duration-300 overflow-hidden"
          >
            <div className="p-3">
              {/* Side by side Book + Film */}
              <div className="flex gap-3">
                {/* Book Card */}
                <button
                  onClick={() => openBookPreview(film)}
                  className="flex-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-primary/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Book className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Book</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {film.book_title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{film.book_author}</p>
                  {film.book_publication_year && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{film.book_publication_year}</p>
                  )}
                </button>

                {/* Film Card */}
                <button
                  onClick={() => openFilmModal(film)}
                  className="flex-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-amber-400/40 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Film</span>
                    </div>
                    {film.imdb_rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-amber-400">{film.imdb_rating}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {film.film_title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{film.director}</p>
                  {film.film_year && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{film.film_year}</p>
                  )}
                </button>
              </div>

              {/* Streaming Links */}
              {film.streaming_availability && Object.keys(film.streaming_availability).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/20">
                  {Object.entries(film.streaming_availability).map(([platform, url]) => {
                    const service = streamingServices[platform];
                    if (!service || !url) return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "px-2 py-1 text-[10px] font-medium rounded border transition-all",
                          service.bgColor,
                          service.color
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {service.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Film Preview Modal */}
      {showFilmModal && selectedFilm && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeFilmModal}
        >
          <div 
            className="relative w-full max-w-2xl bg-card rounded-xl overflow-hidden shadow-2xl border border-border/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-foreground hover:bg-muted"
              onClick={closeFilmModal}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Trailer Section */}
            {selectedFilm.trailer_url && extractYouTubeId(selectedFilm.trailer_url) ? (
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(selectedFilm.trailer_url)}?rel=0`}
                  title={`${selectedFilm.film_title} Trailer`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No trailer available</p>
                </div>
              </div>
            )}

            {/* Film Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{selectedFilm.film_title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on "{selectedFilm.book_title}" by {selectedFilm.book_author}
                </p>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedFilm.film_year && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>{selectedFilm.film_year}</span>
                  </div>
                )}
                {selectedFilm.director && (
                  <div className="text-muted-foreground">
                    <span className="text-muted-foreground/60">Director:</span> {selectedFilm.director}
                  </div>
                )}
                {selectedFilm.imdb_rating && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-medium">{selectedFilm.imdb_rating}/10</span>
                    <span className="text-muted-foreground/60 text-xs">IMDb</span>
                  </div>
                )}
                {selectedFilm.rotten_tomatoes_score && (
                  <div className="text-muted-foreground">
                    🍅 {selectedFilm.rotten_tomatoes_score}%
                  </div>
                )}
              </div>

              {/* Notable Differences */}
              {selectedFilm.notable_differences && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedFilm.notable_differences}
                </p>
              )}

              {/* Awards */}
              {selectedFilm.awards && selectedFilm.awards.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Awards</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFilm.awards.slice(0, 4).map((award, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                        {award.name}
                      </Badge>
                    ))}
                    {selectedFilm.awards.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                        +{selectedFilm.awards.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Streaming Links */}
              {selectedFilm.streaming_availability && Object.keys(selectedFilm.streaming_availability).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <p className="text-sm font-medium text-foreground">Where to Watch</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedFilm.streaming_availability).map(([platform, url]) => {
                      const service = streamingServices[platform];
                      if (!service || !url) return null;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all",
                            service.bgColor,
                            service.color
                          )}
                        >
                          {service.label}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View Book Button */}
              <Button
                variant="outline"
                className="w-full mt-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => {
                  closeFilmModal();
                  openBookPreview(selectedFilm);
                }}
              >
                <Book className="w-4 h-4 mr-2" />
                View Book Details
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Book Preview Modal */}
      {selectedBook && (
        <EnhancedBookPreviewModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAddBook={() => {}}
        />
      )}
    </div>
  );
};

export default BookToScreenSection;
