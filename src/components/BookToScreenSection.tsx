import React, { useState, useEffect } from 'react';
import { Film, Play, X, ExternalLink, Star, Calendar, Clapperboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  streaming_availability: Record<string, any> | null;
  adaptation_type: string | null;
  notable_differences: string | null;
}

interface BookToScreenSectionProps {
  className?: string;
  showTitle?: boolean;
}

export const BookToScreenSection: React.FC<BookToScreenSectionProps> = ({ className, showTitle = true }) => {
  const [adaptations, setAdaptations] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState<FilmAdaptation | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchAdaptations = async () => {
      try {
        const { data, error } = await supabase
          .from('sf_film_adaptations')
          .select('*')
          .order('imdb_rating', { ascending: false })
          .limit(12);

        if (error) throw error;
        // Map database response to our interface
        const mapped: FilmAdaptation[] = (data || []).map(item => ({
          ...item,
          streaming_availability: typeof item.streaming_availability === 'object' && item.streaming_availability !== null
            ? item.streaming_availability as Record<string, any>
            : null,
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

  const extractYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const openTrailerModal = (film: FilmAdaptation) => {
    setSelectedFilm(film);
    setShowTrailer(true);
  };

  const closeTrailerModal = () => {
    setShowTrailer(false);
    setSelectedFilm(null);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-medium text-slate-200">Book to Screen</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (adaptations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-medium text-slate-200">Book to Screen</h2>
            <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-400">
              SF Classics
            </Badge>
          </div>
        </div>
      )}

      <ScrollArea className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-4">
          {adaptations.map((film) => (
            <Card
              key={film.id}
              className="group relative overflow-hidden bg-slate-800/40 border-slate-700/30 hover:border-amber-400/40 transition-all duration-300 cursor-pointer"
              onClick={() => openTrailerModal(film)}
            >
              {/* Poster */}
              <div className="aspect-[2/3] relative overflow-hidden">
                {film.poster_url ? (
                  <img
                    src={film.poster_url}
                    alt={film.film_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <Clapperboard className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                {film.trailer_url && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Rating Badge */}
                {film.imdb_rating && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-white font-medium">{film.imdb_rating}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <h3 className="font-medium text-sm text-slate-200 truncate">{film.film_title}</h3>
                <p className="text-xs text-slate-400 truncate">
                  Based on: {film.book_title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {film.film_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {film.film_year}
                    </span>
                  )}
                  {film.director && (
                    <span className="truncate">• {film.director}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Trailer Modal */}
      {showTrailer && selectedFilm && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeTrailerModal}
        >
          <div 
            className="relative w-full max-w-5xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeTrailerModal}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Pop-out Button */}
            {selectedFilm.trailer_url && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-14 z-10 text-white hover:bg-white/20"
                onClick={() => window.open(selectedFilm.trailer_url!, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            )}

            {/* YouTube Embed */}
            {selectedFilm.trailer_url && extractYouTubeId(selectedFilm.trailer_url) ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(selectedFilm.trailer_url)}?autoplay=1&rel=0`}
                  title={`${selectedFilm.film_title} Trailer`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-slate-800">
                <p className="text-slate-400">No trailer available</p>
              </div>
            )}

            {/* Film Info Panel */}
            <div className="p-6 bg-slate-800/50 border-t border-slate-700/30">
              <div className="flex gap-6">
                {/* Poster Thumbnail */}
                {selectedFilm.poster_url && (
                  <img 
                    src={selectedFilm.poster_url} 
                    alt={selectedFilm.film_title}
                    className="w-24 h-36 object-cover rounded-lg hidden md:block"
                  />
                )}
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-medium text-slate-100">{selectedFilm.film_title}</h3>
                    <p className="text-sm text-slate-400">
                      Based on "{selectedFilm.book_title}" by {selectedFilm.book_author}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedFilm.film_year && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>{selectedFilm.film_year}</span>
                      </div>
                    )}
                    {selectedFilm.director && (
                      <div className="text-slate-300">
                        <span className="text-slate-500">Director:</span> {selectedFilm.director}
                      </div>
                    )}
                    {selectedFilm.imdb_rating && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{selectedFilm.imdb_rating}/10 IMDb</span>
                      </div>
                    )}
                    {selectedFilm.rotten_tomatoes_score && (
                      <div className="text-slate-300">
                        🍅 {selectedFilm.rotten_tomatoes_score}%
                      </div>
                    )}
                  </div>

                  {selectedFilm.notable_differences && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {selectedFilm.notable_differences}
                    </p>
                  )}

                  {/* Streaming Links */}
                  {selectedFilm.streaming_availability && Object.keys(selectedFilm.streaming_availability).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedFilm.streaming_availability).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookToScreenSection;
