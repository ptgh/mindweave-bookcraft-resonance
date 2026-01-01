import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { X, FileText, ExternalLink, User, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaImage } from '@/components/ui/media-image';
import { supabase } from '@/integrations/supabase/client';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { AuthorPopup } from '@/components/AuthorPopup';
import { extractYouTubeId, getYouTubeSearchUrl } from '@/utils/streamingLinks';

interface FilmData {
  id: string;
  film_title: string;
  film_year: number | null;
  director: string | null;
  book_title: string;
  book_author: string;
  poster_url: string | null;
  trailer_url?: string | null;
  script_url?: string | null;
  script_source?: string | null;
  notable_differences?: string | null;
}

interface ScriptPreviewModalProps {
  film: FilmData | null;
  isVisible: boolean;
  onClose: () => void;
}

export const ScriptPreviewModal: React.FC<ScriptPreviewModalProps> = ({
  film,
  isVisible,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);

  // Parse writers from book_author field (e.g., "Fred Dekker & Shane Black")
  const parseWriters = (authorString: string): string[] => {
    if (!authorString || authorString === 'Unknown Screenwriter') return [];
    
    // Split by common separators: "&", " and ", ","
    return authorString
      .split(/\s*[&,]\s*|\s+and\s+/i)
      .map(name => name.trim())
      .filter(name => name.length > 0 && name !== 'Unknown Screenwriter');
  };

  const writers = film ? parseWriters(film.book_author) : [];

  // Handle writer click - open AuthorPopup
  const handleWriterClick = async (writerName: string) => {
    // Try to find the writer in scifi_authors
    const { data } = await supabase
      .from('scifi_authors')
      .select('*')
      .ilike('name', `%${writerName}%`)
      .limit(1)
      .single();

    if (data) {
      setSelectedAuthor(data as ScifiAuthor);
    } else {
      // Create temporary author for popup
      setSelectedAuthor({
        id: 'temp',
        name: writerName,
        created_at: '',
        updated_at: '',
      } as ScifiAuthor);
    }
    setShowAuthorPopup(true);
  };

  // Get script URL - prefer direct PDF if available
  const getScriptUrl = (): string | null => {
    if (!film?.script_url) return null;
    
    // If it's already a PDF URL, use it directly
    if (film.script_url.endsWith('.pdf') || film.script_url.includes('/pdf/')) {
      return film.script_url;
    }
    
    // If it's a ScriptSlug page URL, try to construct direct PDF link
    if (film.script_url.includes('scriptslug.com/script/')) {
      const scriptPath = film.script_url.split('/script/')[1];
      if (scriptPath) {
        return `https://assets.scriptslug.com/live/pdf/scripts/${scriptPath}.pdf`;
      }
    }
    
    // Return original URL (IMSDb page, etc.)
    return film.script_url;
  };

  const scriptUrl = getScriptUrl();
  const scriptSourceLabel = film?.script_source === 'scriptslug' ? 'ScriptSlug' : 
                           film?.script_source === 'imsdb' ? 'IMSDb' : 'Script';

  // GSAP animation
  useEffect(() => {
    if (!modalRef.current || !overlayRef.current || !contentRef.current) return;

    if (isVisible && film) {
      gsap.set(modalRef.current, { display: 'flex' });
      
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo(contentRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
      );
    } else {
      gsap.to(contentRef.current, {
        scale: 0.95,
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: 'power2.in',
      });

      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          if (modalRef.current) {
            gsap.set(modalRef.current, { display: 'none' });
          }
        },
      });
    }
  }, [isVisible, film]);

  if (!film) return null;

  const modal = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center p-4"
      style={{ display: 'none' }}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative bg-slate-800/95 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-slate-200 text-base font-medium">
                Original Screenplay
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Trailer Section */}
          <div className="aspect-video bg-black relative">
            {(() => {
              const trailerKey = extractYouTubeId(film.trailer_url || '');
              
              if (trailerKey) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?rel=0&autoplay=0`}
                    title={`${film.film_title} Trailer`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                );
              }
              
              // Fallback: show poster with YouTube search link
              return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                  {film.poster_url ? (
                    <img
                      src={film.poster_url}
                      alt={film.film_title}
                      className="h-full w-full object-cover opacity-40"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-cyan-400/50 mb-3" />
                    <span className="text-sm text-muted-foreground mb-3">Original Screenplay</span>
                    <a
                      href={getYouTubeSearchUrl(film.film_title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Watch Trailer
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Main Info */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {film.film_title}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{film.film_year || 'Unknown year'}</span>
                <Badge variant="outline" className="ml-2 text-cyan-400 border-cyan-400/30 bg-cyan-400/10">
                  Original Screenplay
                </Badge>
              </div>
            </div>

            {/* Writers Section - Clickable */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Written by</span>
              </div>
              
              {writers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {writers.map((writer, index) => (
                    <button
                      key={index}
                      onClick={() => handleWriterClick(writer)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg text-sm text-emerald-300 hover:text-emerald-200 transition-all flex items-center gap-1.5"
                    >
                      <User className="w-3 h-3" />
                      {writer}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Screenwriter information not available
                </p>
              )}
            </div>

            {/* Director */}
            {film.director && (
              <div className="text-sm text-muted-foreground">
                <span className="text-amber-400">Director:</span> {film.director}
              </div>
            )}

            {/* Script Link - Primary Action */}
            {scriptUrl && (
              <div className="pt-2">
                <a
                  href={scriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Read Script on {scriptSourceLabel}
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            )}

            {/* No script available */}
            {!scriptUrl && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Script not yet available in our database
                </p>
              </div>
            )}

            {/* Synopsis/Notes if available */}
            {film.notable_differences && (
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {film.notable_differences}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Author Popup */}
      <AuthorPopup
        author={selectedAuthor}
        isVisible={showAuthorPopup}
        onClose={() => setShowAuthorPopup(false)}
      />
    </div>
  );

  return createPortal(modal, document.body);
};

export default ScriptPreviewModal;
