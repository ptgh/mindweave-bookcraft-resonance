import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, MessageSquare, TrendingUp, Globe, Sparkles, Film, Play, Star, Calendar, FileText } from 'lucide-react';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import ScreenplayReaderModal from '@/components/ScreenplayReaderModal';
import { AuthorPopup } from '@/components/AuthorPopup';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import gsap from 'gsap';

interface FilmAdaptation {
  id: string;
  film_title: string;
  book_title: string;
  book_author: string;
  film_year: number | null;
  director: string | null;
  imdb_rating: number | null;
  poster_url: string | null;
  trailer_url: string | null;
  adaptation_type?: string | null;
  script_url?: string | null;
  script_source?: string | null;
}

interface FeaturedSectionProps {
  className?: string;
}

// Rotation interval in milliseconds (10 seconds)
const ROTATION_INTERVAL = 10000;

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ className }) => {
  const { featuredContent, loading } = useFeaturedContent();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const workRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Featured film state (book adaptations only)
  const [featuredFilms, setFeaturedFilms] = useState<FilmAdaptation[]>([]);
  const [currentFilmIndex, setCurrentFilmIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // Original screenplay state
  const [originalScreenplays, setOriginalScreenplays] = useState<FilmAdaptation[]>([]);
  const [currentOriginalIndex, setCurrentOriginalIndex] = useState(0);
  const [showOriginalTrailer, setShowOriginalTrailer] = useState(false);
  const [showScreenplayReader, setShowScreenplayReader] = useState(false);
  
  // Modal state for notable works and featured book
  const [selectedBook, setSelectedBook] = useState<{
    title: string;
    author: string;
    cover_url?: string;
  } | null>(null);
  
  // Author popup state
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const authorCardRef = useRef<HTMLDivElement>(null);

  // Fetch featured films (book adaptations) and original screenplays
  useEffect(() => {
    const fetchFilms = async () => {
      // Fetch book adaptations (non-original)
      const { data: adaptations } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title, book_title, book_author, film_year, director, imdb_rating, poster_url, trailer_url, adaptation_type')
        .neq('adaptation_type', 'original')
        .not('poster_url', 'is', null)
        .order('imdb_rating', { ascending: false })
        .limit(10);
      
      if (adaptations) setFeaturedFilms(adaptations);

      // Fetch original screenplays - only those with ScriptSlug scripts
      const { data: originals } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title, book_title, book_author, film_year, director, imdb_rating, poster_url, trailer_url, adaptation_type, script_url, script_source')
        .eq('adaptation_type', 'original')
        .eq('script_source', 'scriptslug')
        .not('script_url', 'is', null)
        .not('poster_url', 'is', null)
        .order('imdb_rating', { ascending: false })
        .limit(10);
      
      if (originals) setOriginalScreenplays(originals);
    };
    fetchFilms();
  }, []);

  // Rotation effect for featured films
  useEffect(() => {
    if (featuredFilms.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentFilmIndex(prev => (prev + 1) % featuredFilms.length);
    }, ROTATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [featuredFilms.length]);

  // Rotation effect for original screenplays
  useEffect(() => {
    if (originalScreenplays.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentOriginalIndex(prev => (prev + 1) % originalScreenplays.length);
    }, ROTATION_INTERVAL + 2000); // Offset slightly from film rotation
    
    return () => clearInterval(interval);
  }, [originalScreenplays.length]);

  const featuredFilm = featuredFilms[currentFilmIndex] || null;
  const featuredOriginal = originalScreenplays[currentOriginalIndex] || null;

  useEffect(() => {
    if (!sectionRef.current || loading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out'
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [loading]);

  // Add hover animation to notable works
  useEffect(() => {
    workRefs.current.filter(Boolean).forEach(ref => {
      if (!ref) return;
      
      const handleMouseEnter = () => {
        gsap.to(ref, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
      };
      
      const handleMouseLeave = () => {
        gsap.to(ref, { scale: 1, duration: 0.2, ease: 'power2.out' });
      };
      
      ref.addEventListener('mouseenter', handleMouseEnter);
      ref.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        ref.removeEventListener('mouseenter', handleMouseEnter);
        ref.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [featuredContent]);

  const handleWorkClick = (workTitle: string) => {
    if (!featuredContent?.featured_author?.name) return;
    
    setSelectedBook({
      title: workTitle,
      author: featuredContent.featured_author.name
    });
  };

  const handleBookClick = () => {
    if (!featuredContent?.featured_book) return;
    
    setSelectedBook({
      title: featuredContent.featured_book.title,
      author: featuredContent.featured_book.author,
      cover_url: featuredContent.featured_book.cover_url || undefined
    });
  };

  const handleAuthorClick = (authorName: string) => {
    // Create a ScifiAuthor object from the featured author data
    const author: ScifiAuthor = {
      id: 'featured',
      name: authorName,
      nationality: featuredContent?.featured_author?.nationality || undefined,
      notable_works: featuredContent?.featured_author?.notable_works || [],
      bio: featuredContent?.featured_author?.bio || undefined,
      wikipedia_url: featuredContent?.featured_author?.wikipedia_url || undefined,
      birth_year: undefined,
      death_year: undefined,
      data_quality_score: undefined,
      data_source: undefined,
      needs_enrichment: true,
      verification_status: undefined,
      enrichment_attempts: undefined,
      last_enriched: undefined
    };
    setSelectedAuthor(author);
    setShowAuthorPopup(true);
  };

  const extractYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Fetch author portrait URL
  const [authorPortraitUrl, setAuthorPortraitUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!featuredContent?.featured_author?.name) return;
    const fetchPortrait = async () => {
      const { data } = await supabase
        .from('scifi_authors')
        .select('portrait_url')
        .ilike('name', featuredContent.featured_author!.name)
        .maybeSingle();
      if (data?.portrait_url) setAuthorPortraitUrl(data.portrait_url);
    };
    fetchPortrait();
  }, [featuredContent?.featured_author?.name]);

  // Generate author initials for avatar fallback
  const authorInitials = featuredContent?.featured_author?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AU';

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-48 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'bg-blue-500/20 text-blue-400',
      glow: 'hover:shadow-blue-500/10'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'bg-purple-500/20 text-purple-400',
      glow: 'hover:shadow-purple-500/10'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'bg-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-emerald-500/10'
    }
  };

  return (
    <>
      <div ref={sectionRef} className={cn("grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
        {/* Featured Author Card - Clickable */}
        <div
          ref={(el) => { cardsRef.current[0] = el; authorCardRef.current = el; }}
          onClick={() => featuredContent?.featured_author && handleAuthorClick(featuredContent.featured_author.name)}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.blue.bg,
            colorClasses.blue.border,
            colorClasses.blue.glow,
            featuredContent?.featured_author && "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.blue.icon)}>
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Featured Author</h3>
          </div>
          
          {featuredContent?.featured_author ? (
            <div className="space-y-3">
              {/* Author Header with Avatar */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-500/30">
                  {authorPortraitUrl ? (
                    <img src={authorPortraitUrl} alt={featuredContent.featured_author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {authorInitials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-slate-200 truncate hover:text-blue-300 transition-colors">
                    {featuredContent.featured_author.name}
                  </p>
                  {featuredContent.featured_author.nationality && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {featuredContent.featured_author.nationality}
                    </p>
                  )}
                </div>
              </div>

              {/* Notable Works - Now Clickable */}
              {featuredContent.featured_author.notable_works && 
               featuredContent.featured_author.notable_works.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Notable Works
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {featuredContent.featured_author.notable_works.slice(0, 3).map((work, i) => (
                      <button 
                        key={i}
                        ref={el => { workRefs.current[i] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkClick(work);
                        }}
                        className="text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 truncate max-w-[120px] hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer"
                        title={`Preview "${work}"`}
                      >
                        {work}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {featuredContent.featured_author.transmission_count} readers this month
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No featured author yet</p>
          )}
        </div>

        {/* Featured Book Card - Clickable */}
        <div
          ref={el => { cardsRef.current[1] = el; }}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.purple.bg,
            colorClasses.purple.border,
            colorClasses.purple.glow
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.purple.icon)}>
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Featured Book</h3>
          </div>
          
          {featuredContent?.featured_book ? (
            <div className="flex gap-3">
              {/* Book Cover */}
              {featuredContent.featured_book.cover_url ? (
                <img 
                  src={featuredContent.featured_book.cover_url}
                  alt={featuredContent.featured_book.title}
                  onClick={handleBookClick}
                  className="w-16 h-24 object-cover rounded-md shadow-md flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                />
              ) : (
                <div 
                  onClick={handleBookClick}
                  className="w-16 h-24 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-slate-600 transition-colors"
                >
                  <BookOpen className="w-6 h-6 text-slate-500" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p 
                  onClick={handleBookClick}
                  className="text-lg font-medium text-slate-200 line-clamp-2 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {featuredContent.featured_book.title}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthorClick(featuredContent.featured_book!.author);
                  }}
                  className="text-sm text-slate-400 truncate text-left hover:text-blue-300 transition-colors"
                >
                  by {featuredContent.featured_book.author}
                </button>
                <p className="text-xs text-purple-400 mt-1">
                  {featuredContent.featured_book.post_count} discussions
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Start a discussion!</p>
          )}
        </div>

        {/* Trending Post Card */}
        <div
          ref={el => { cardsRef.current[2] = el; }}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.emerald.bg,
            colorClasses.emerald.border,
            colorClasses.emerald.glow
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.emerald.icon)}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Trending Post</h3>
          </div>
          
          {featuredContent?.featured_post ? (
            <>
              <p className="text-sm text-slate-300 line-clamp-2">
                "{featuredContent.featured_post.content}..."
              </p>
              <p className="text-xs text-slate-500 mt-2">
                on {featuredContent.featured_post.book_title}
              </p>
              <p className="text-xs text-emerald-400">
                {featuredContent.featured_post.likes_count} likes
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Be the first to post!</p>
          )}
        </div>

        {/* Featured Film Card */}
        <div
          ref={el => { cardsRef.current[3] = el; }}
          onClick={featuredFilm?.trailer_url ? () => setShowTrailer(true) : undefined}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            "bg-amber-500/10",
            "border-amber-500/20 hover:border-amber-500/40",
            "hover:shadow-amber-500/10",
            featuredFilm?.trailer_url && "cursor-pointer"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Film className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-slate-400">Featured Film</h3>
            </div>
            {featuredFilms.length > 1 && (
              <div className="flex gap-1">
                {featuredFilms.slice(0, 5).map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      idx === currentFilmIndex ? "bg-amber-400" : "bg-amber-400/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {featuredFilm ? (
            <div className="flex gap-3">
              {featuredFilm.poster_url ? (
                <div className="relative w-16 h-24 flex-shrink-0">
                  <img 
                    src={featuredFilm.poster_url}
                    alt={featuredFilm.film_title}
                    className="w-full h-full object-cover rounded-md shadow-md"
                  />
                  {featuredFilm.trailer_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-24 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                  <Film className="w-6 h-6 text-slate-500" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-medium text-slate-200 line-clamp-1 hover:text-amber-300 transition-colors">
                  {featuredFilm.film_title}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  Based on "{featuredFilm.book_title}"
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  {featuredFilm.film_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {featuredFilm.film_year}
                    </span>
                  )}
                  {featuredFilm.imdb_rating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {featuredFilm.imdb_rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No featured film</p>
          )}
        </div>

        {/* Original Screenplay Card */}
        <div
          ref={el => { cardsRef.current[4] = el; }}
          onClick={featuredOriginal?.script_url ? () => setShowScreenplayReader(true) : undefined}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            "bg-violet-500/10",
            "border-violet-500/20 hover:border-violet-500/40",
            "hover:shadow-violet-500/10",
            featuredOriginal?.script_url && "cursor-pointer"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-slate-400">Original Screenplay</h3>
            </div>
            {originalScreenplays.length > 1 && (
              <div className="flex gap-1">
                {originalScreenplays.slice(0, 5).map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      idx === currentOriginalIndex ? "bg-violet-400" : "bg-violet-400/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {featuredOriginal ? (
            <div className="flex gap-3">
              {featuredOriginal.poster_url ? (
                <div className="relative w-16 h-24 flex-shrink-0 group">
                  <img 
                    src={featuredOriginal.poster_url}
                    alt={featuredOriginal.film_title}
                    className="w-full h-full object-cover rounded-md shadow-md"
                  />
                  {featuredOriginal.script_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-900/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-24 bg-gradient-to-br from-violet-600/30 to-purple-800/40 rounded-md flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-medium text-slate-200 line-clamp-1 hover:text-violet-300 transition-colors">
                  {featuredOriginal.film_title}
                </p>
                <p className="text-xs text-violet-300 truncate">
                  {featuredOriginal.director || 'Unknown Director'}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  {featuredOriginal.film_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {featuredOriginal.film_year}
                    </span>
                  )}
                  {featuredOriginal.imdb_rating && (
                    <span className="flex items-center gap-1 text-violet-400">
                      <Star className="w-3 h-3 fill-violet-400" />
                      {featuredOriginal.imdb_rating}
                    </span>
                  )}
                </div>
                {featuredOriginal.script_url && (
                  <span className="text-[10px] text-violet-400/70 mt-1 flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    Tap to read screenplay
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No original screenplays</p>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && featuredFilm && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setShowTrailer(false)}
            >
              ✕
            </button>
            
            {extractYouTubeId(featuredFilm.trailer_url) ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(featuredFilm.trailer_url)}?autoplay=1&rel=0`}
                  title={`${featuredFilm.film_title} Trailer`}
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
            
            <div className="p-4 bg-slate-800/50 border-t border-slate-700/30">
              <h3 className="text-lg font-medium text-slate-100">{featuredFilm.film_title}</h3>
              <p className="text-sm text-slate-400">
                Based on "{featuredFilm.book_title}" by {featuredFilm.book_author}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Original Screenplay Trailer Modal */}
      {showOriginalTrailer && featuredOriginal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowOriginalTrailer(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setShowOriginalTrailer(false)}
            >
              ✕
            </button>
            
            {extractYouTubeId(featuredOriginal.trailer_url) ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(featuredOriginal.trailer_url)}?autoplay=1&rel=0`}
                  title={`${featuredOriginal.film_title} Trailer`}
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
            
            <div className="p-4 bg-violet-900/30 border-t border-violet-700/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-violet-400 font-medium">Original Screenplay</span>
              </div>
              <h3 className="text-lg font-medium text-slate-100">{featuredOriginal.film_title}</h3>
              <p className="text-sm text-slate-400">
                Directed by {featuredOriginal.director || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Book Preview Modal */}
      {selectedBook && (
        <EnhancedBookPreviewModal
          book={{
            id: `book-${selectedBook.title.replace(/\s+/g, '-').toLowerCase()}`,
            title: selectedBook.title,
            author: selectedBook.author,
            cover_url: selectedBook.cover_url,
            series_id: 'featured-content',
            created_at: new Date().toISOString()
          }}
          onClose={() => setSelectedBook(null)}
          onAddBook={() => {}}
        />
      )}

      {/* Screenplay Reader Modal */}
      <ScreenplayReaderModal
        isOpen={showScreenplayReader}
        onClose={() => setShowScreenplayReader(false)}
        screenplay={featuredOriginal ? {
          film_title: featuredOriginal.film_title,
          director: featuredOriginal.director,
          film_year: featuredOriginal.film_year,
          imdb_rating: featuredOriginal.imdb_rating,
          poster_url: featuredOriginal.poster_url,
          script_url: featuredOriginal.script_url || '',
          script_source: featuredOriginal.script_source || null
        } : null}
      />

      {/* Author Popup */}
      <AuthorPopup
        author={selectedAuthor}
        isVisible={showAuthorPopup}
        onClose={() => {
          setShowAuthorPopup(false);
          setSelectedAuthor(null);
        }}
        triggerRef={authorCardRef}
      />
    </>
  );
};
