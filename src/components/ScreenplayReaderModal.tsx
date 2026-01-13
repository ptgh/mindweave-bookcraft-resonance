import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, ExternalLink, Maximize2, Minimize2, Download, Sparkles, Calendar, Star, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface ScreenplayReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenplay: {
    film_title: string;
    director?: string | null;
    film_year?: number | null;
    imdb_rating?: number | null;
    poster_url?: string | null;
    script_url: string;
    script_source?: string | null;
  } | null;
}

export const ScreenplayReaderModal: React.FC<ScreenplayReaderModalProps> = ({
  isOpen,
  onClose,
  screenplay
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(8); // PKD comic has 8 pages

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GSAP animation on open/close
  useEffect(() => {
    if (!overlayRef.current || !modalRef.current) return;

    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      const tl = gsap.timeline();
      
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      
      tl.fromTo(
        modalRef.current,
        { 
          opacity: 0, 
          scale: 0.9, 
          y: isMobile ? 100 : 50 
        },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: 'back.out(1.2)' 
        },
        '-=0.2'
      );
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  const handleClose = () => {
    if (!overlayRef.current || !modalRef.current) {
      onClose();
      return;
    }

    const tl = gsap.timeline({
      onComplete: onClose
    });

    tl.to(modalRef.current, {
      opacity: 0,
      scale: 0.9,
      y: isMobile ? 100 : 50,
      duration: 0.25,
      ease: 'power2.in'
    });

    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.15');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen || !screenplay) return null;

  // Build the script URL - ensure it's a proper PDF URL from ScriptSlug
  const scriptUrl = screenplay.script_url;
  const isScriptSlugPdf = scriptUrl.includes('scriptslug.com') && scriptUrl.endsWith('.pdf');
  
  // Check if this is a local comic/page-based script
  const isLocalComic = scriptUrl.startsWith('/scripts/') && !scriptUrl.endsWith('.pdf');
  const isComic = screenplay.script_source === 'Comic Book';
  
  // Generate page URLs for comic readers
  const getComicPageUrl = (pageNum: number) => {
    if (scriptUrl.endsWith('/')) {
      return `${scriptUrl}page-${pageNum}.webp`;
    }
    return `${scriptUrl}/page-${pageNum}.webp`;
  };
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative bg-slate-900 backdrop-blur-xl border-2 border-violet-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-violet-900/40 flex flex-col",
          isFullscreen 
            ? "w-full h-full max-w-none rounded-none" 
            : isMobile 
              ? "w-full h-[95vh] max-w-lg mx-2" 
              : "w-full max-w-5xl h-[90vh]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Polished with clear card definition */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-violet-500/30 bg-gradient-to-r from-violet-900/50 to-purple-900/50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {screenplay.poster_url && !isMobile && (
              <img
                src={screenplay.poster_url}
                alt={screenplay.film_title}
                className="w-10 h-14 object-cover rounded-md shadow-lg flex-shrink-0 border border-violet-500/20"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isComic ? (
                  <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${isComic ? 'text-amber-400' : 'text-violet-400'}`}>
                  {isComic ? 'Biographical Comic' : 'Original Screenplay'}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-semibold text-slate-100 truncate">
                {screenplay.film_title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                {screenplay.director && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {screenplay.director}
                  </span>
                )}
                {screenplay.film_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {screenplay.film_year}
                  </span>
                )}
                {screenplay.imdb_rating && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {screenplay.imdb_rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons - Fixed sizing for even alignment */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Open in new tab */}
            <a
              href={scriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-violet-200 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-red-500/30 text-slate-300 hover:text-red-300 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          {isLocalComic || isComic ? (
            // Comic Page Viewer
            <div className="relative w-full h-full flex flex-col">
              {/* Comic Page Display */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                <img
                  src={getComicPageUrl(currentPage)}
                  alt={`Page ${currentPage} of ${totalPages}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </div>
              
              {/* Page Navigation */}
              <div className="flex items-center justify-center gap-4 p-4 bg-slate-900/80 border-t border-violet-500/20">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : isScriptSlugPdf ? (
            <>
              {/* Desktop: embed PDF */}
              <iframe
                src={`${scriptUrl}#view=FitH`}
                className="w-full h-full border-0 hidden md:block"
                title={`${screenplay.film_title} Screenplay`}
              />
              
              {/* Mobile: show a nice fallback with link */}
              <div className="md:hidden flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-2">
                  {screenplay.film_title}
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">
                  Tap below to read the original screenplay in your PDF viewer
                </p>
                <a
                  href={scriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-violet-900/50 transition-all hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  Read Screenplay
                </a>
                <p className="text-xs text-slate-500 mt-4">
                  Powered by ScriptSlug
                </p>
              </div>
            </>
          ) : (
            // Fallback for non-ScriptSlug scripts
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Unable to display script inline
              </p>
              <a
                href={scriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Script
              </a>
            </div>
          )}
        </div>

        {/* Footer - Clear bottom definition */}
        <div className="p-3 md:p-4 border-t-2 border-violet-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0 rounded-b-2xl">
          <span className="flex items-center gap-1.5 font-medium">
            {isComic ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-amber-400/70" />
                Robert Crumb / Weirdo Magazine
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-violet-400/70" />
                ScriptSlug
              </>
            )}
          </span>
          <span className="text-slate-500">{isComic ? 'Use arrow keys or buttons to navigate' : 'Use ⌘/Ctrl + scroll to zoom'}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ScreenplayReaderModal;
