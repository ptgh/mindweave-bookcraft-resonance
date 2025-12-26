import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Film, Calendar, X, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Director {
  id: string;
  name: string;
  nationality?: string | null;
  bio?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  photo_url?: string | null;
  wikipedia_url?: string | null;
  notable_sf_films?: string[] | null;
}

interface DirectorPopupProps {
  director: Director | { name: string } | null;
  isVisible: boolean;
  onClose: () => void;
  onFilmClick?: (filmTitle: string) => void;
}

export const DirectorPopup: React.FC<DirectorPopupProps> = ({
  director,
  isVisible,
  onClose,
  onFilmClick
}) => {
  const { toast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fullDirector, setFullDirector] = useState<Director | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showAllFilms, setShowAllFilms] = useState(false);

  // Fetch full director data when name is provided
  useEffect(() => {
    const fetchDirector = async () => {
      if (!director || !('name' in director)) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sf_directors')
          .select('*')
          .eq('name', director.name)
          .single();

        if (data && !error) {
          setFullDirector(data as Director);
        } else {
          // Fallback: create minimal director object
          setFullDirector({
            id: 'temp',
            name: director.name,
            notable_sf_films: []
          });
        }
      } catch (e) {
        console.error('Error fetching director:', e);
        setFullDirector({
          id: 'temp',
          name: director.name,
          notable_sf_films: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (director && isVisible) {
      if ('id' in director && director.id !== 'temp') {
        setFullDirector(director as Director);
      } else {
        fetchDirector();
      }
    }
  }, [director, isVisible]);

  // GSAP animation for popup
  useEffect(() => {
    if (!popupRef.current || !overlayRef.current || !contentRef.current) return;

    if (isVisible && (fullDirector || director)) {
      gsap.set(popupRef.current, { display: 'flex' });
      
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      gsap.fromTo(contentRef.current,
        { 
          scale: 0.8,
          opacity: 0,
          y: 50
        },
        { 
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
          delay: 0.1
        }
      );
    } else {
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.9,
          opacity: 0,
          y: 30,
          duration: 0.2,
          ease: "power2.in"
        });
      }
      
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            if (popupRef.current) {
              gsap.set(popupRef.current, { display: 'none' });
            }
          }
        });
      }
    }
  }, [isVisible, fullDirector, director]);

  const displayDirector = fullDirector || (director && 'name' in director ? { id: 'temp', name: director.name } : null);

  if (!displayDirector) {
    return null;
  }

  const formatLifespan = () => {
    if (fullDirector?.birth_year && fullDirector?.death_year) {
      return `${fullDirector.birth_year} - ${fullDirector.death_year}`;
    } else if (fullDirector?.birth_year) {
      return `Born ${fullDirector.birth_year}`;
    }
    return null;
  };

  const validFilms = (fullDirector?.notable_sf_films || []).filter(f => f && f.trim().length > 2);

  const needsEnrichment = fullDirector && (!fullDirector.bio || !fullDirector.nationality);

  const handleEnrichDirector = async () => {
    if (!fullDirector || fullDirector.id === 'temp') {
      toast({
        title: 'Cannot enrich',
        description: 'Director not found in database. Add via admin panel first.',
        variant: 'destructive'
      });
      return;
    }

    setIsEnriching(true);
    try {
      // Simple enrichment - update that data is being requested
      toast({
        title: 'Enrichment requested',
        description: `Looking up data for ${fullDirector.name}...`,
      });
      
      // For now, open Wikipedia in new tab as a manual enrichment helper
      const searchQuery = `${fullDirector.name} film director`;
      window.open(`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(searchQuery)}`, '_blank');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ display: 'none' }}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <Card
        ref={contentRef}
        className="relative w-full max-w-md bg-slate-900/95 border-amber-500/30 shadow-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-100">
                  {displayDirector.name}
                </h3>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                  <Film className="w-3 h-3 mr-1" />
                  Director
                </Badge>
              </div>
              {formatLifespan() && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-3 h-3" />
                  <span>{formatLifespan()}</span>
                </div>
              )}
              {fullDirector?.nationality && (
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  {fullDirector.nationality}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {isLoading ? (
            <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-700 rounded w-5/6" />
              </div>
            </div>
          ) : fullDirector?.bio ? (
            <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 max-h-48 overflow-y-auto scrollbar-hide">
              <p className="text-sm text-slate-200 leading-relaxed">
                {fullDirector.bio}
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 italic mb-3">
                Biographical information not yet available.
              </p>
              {needsEnrichment && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnrichDirector}
                  disabled={isEnriching}
                  className="w-full bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20"
                >
                  {isEnriching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Enrich Data
                </Button>
              )}
            </div>
          )}

          {/* Notable SF Films */}
          {validFilms.length > 0 && (
            <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 max-h-48 overflow-y-auto scrollbar-hide">
              <div className="flex items-center gap-2 mb-1">
                <Film className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Notable SF Films</span>
              </div>
              <div className="flex flex-col">
                {validFilms
                  .slice(0, showAllFilms ? validFilms.length : 4)
                  .map((film, index) => (
                    <button
                      key={index}
                      onClick={() => onFilmClick?.(film)}
                      className="text-sm text-slate-300 hover:text-amber-300 transition-colors text-left w-full group relative leading-tight"
                    >
                      <span className="relative">
                        • {film}
                        <span className="absolute bottom-0 left-2 w-0 h-0.5 bg-amber-400 group-hover:w-[calc(100%-8px)] transition-all duration-300 ease-out" />
                      </span>
                    </button>
                  ))}
                {validFilms.length > 4 && !showAllFilms && (
                  <button
                    onClick={() => setShowAllFilms(true)}
                    className="text-sm text-amber-400 hover:text-amber-300 italic transition-colors"
                  >
                    ...and {validFilms.length - 4} more films
                  </button>
                )}
                {showAllFilms && validFilms.length > 4 && (
                  <button
                    onClick={() => setShowAllFilms(false)}
                    className="text-sm text-slate-400 hover:text-slate-300 italic transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}

          {/* External Link */}
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20 transition-all duration-300"
            onClick={() => {
              if (fullDirector?.wikipedia_url && fullDirector.wikipedia_url.includes('wikipedia.org')) {
                window.open(fullDirector.wikipedia_url, '_blank');
                return;
              }
              const searchQuery = `${displayDirector.name} film director`;
              const wikiSearchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(searchQuery)}`;
              window.open(wikiSearchUrl, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorPopup;
