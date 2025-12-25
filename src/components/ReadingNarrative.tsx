import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { gsap } from 'gsap';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Transmission } from '@/services/transmissionsService';
import { AuthorPopup } from './AuthorPopup';
import { getAuthorByName, ScifiAuthor } from '@/services/scifiAuthorsService';
import EnhancedBookCover from './EnhancedBookCover';
import AppleBooksLink from './AppleBooksLink';
import GoogleBooksLink from './GoogleBooksLink';
import FreeEbookDownloadIcon from './FreeEbookDownloadIcon';
import { searchGoogleBooks } from '@/services/googleBooks';

interface ReadingNarrativeProps {
  narrative: string;
  transmissions: Transmission[];
}

interface HighlightedNameProps {
  name: string;
  type: 'book' | 'author';
  onClick: () => void;
}

const HighlightedName = ({ name, type, onClick }: HighlightedNameProps) => {
  const underlineRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            
            if (underlineRef.current) {
              const glowHsl = type === 'book' ? "217 91% 60%" : "142 71% 45%";
              
              // Animate underline width
              gsap.fromTo(
                underlineRef.current,
                { scaleX: 0, transformOrigin: 'left' },
                { 
                  scaleX: 1, 
                  duration: 0.6, 
                  ease: "power2.out",
                  delay: 0.2
                }
              );
              
              // Add pulsing glow effect
              gsap.fromTo(
                underlineRef.current,
                { boxShadow: `0 0 0px 0px hsl(${glowHsl} / 0)` },
                { 
                  boxShadow: `0 0 10px 3px hsl(${glowHsl} / 0.7)`,
                  duration: 0.4,
                  delay: 0.4,
                  ease: "power2.out",
                  onComplete: () => {
                    if (underlineRef.current) {
                      gsap.to(underlineRef.current, {
                        boxShadow: `0 0 0px 0px hsl(${glowHsl} / 0)`,
                        duration: 0.6,
                        ease: "power2.inOut"
                      });
                    }
                  }
                }
              );
              
              // Reset underline for hover effect
              gsap.to(underlineRef.current, {
                scaleX: 0,
                duration: 0.3,
                ease: "power2.in",
                delay: 1.4
              });
            }
            
            observer.disconnect();
          }
        });
      },
      { root: null, threshold: 0.1 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [type]);

  const handleMouseEnter = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { scaleX: 1, duration: 0.3, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { scaleX: 0, duration: 0.3, ease: "power2.in" });
    }
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <button
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      type="button"
      className={`relative inline text-left transition-colors duration-300 ${
        type === 'book' 
          ? 'text-blue-300 hover:text-blue-200' 
          : 'text-emerald-300 hover:text-emerald-200'
      }`}
    >
      <span className="relative">
        {name}
        <span 
          ref={underlineRef}
          className={`absolute bottom-0 left-0 w-full h-0.5 ${
            type === 'book' ? 'bg-blue-400' : 'bg-emerald-400'
          }`}
          style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
        />
      </span>
    </button>
  );
};

// Simple book preview modal for inline narrative
interface BookPreviewModalProps {
  transmission: Transmission;
  onClose: () => void;
}

const BookPreviewModal = ({ transmission, onClose }: BookPreviewModalProps) => {
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGoogle = async () => {
      try {
        const results = await searchGoogleBooks(`${transmission.title} ${transmission.author}`, 1);
        if (results.length > 0) {
          setGoogleUrl(results[0].previewLink || results[0].infoLink || null);
        }
      } catch (_) {}
    };
    fetchGoogle();
  }, [transmission.title, transmission.author]);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, []);

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  }, [handleClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  }, [handleClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        ref={modalRef}
        className="relative bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full shadow-2xl"
        onClick={handleContentClick}
      >
        <button
          type="button"
          onClick={handleCloseClick}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <EnhancedBookCover
            title={transmission.title || ''}
            author={transmission.author || ''}
            isbn={transmission.isbn || undefined}
            coverUrl={transmission.cover_url || undefined}
            className="w-24 h-36 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-2">
              {transmission.title}
            </h3>
            <p className="text-slate-400 text-sm mb-2">{transmission.author}</p>
            
            {transmission.publication_year && (
              <p className="text-slate-500 text-xs mb-3">
                Published {transmission.publication_year}
              </p>
            )}

            {transmission.tags && transmission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {transmission.tags.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                  >
                    {typeof tag === 'string' ? tag.trim() : tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {transmission.notes && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-300 italic">"{transmission.notes}"</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
          <AppleBooksLink 
            appleLink={transmission.apple_link || ''} 
            title={transmission.title || ''}
          />
          <GoogleBooksLink
            googleLink={googleUrl || ''}
            title={transmission.title || ''}
          />
          <FreeEbookDownloadIcon 
            title={transmission.title || ''} 
            author={transmission.author || ''} 
            isbn={transmission.isbn || undefined}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ReadingNarrative = ({ narrative, transmissions }: ReadingNarrativeProps) => {
  const [selectedTransmission, setSelectedTransmission] = useState<Transmission | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);

  // Create maps for quick lookup
  const bookTitles = new Set(transmissions.map(t => t.title).filter(Boolean));
  const authorNames = new Set(transmissions.map(t => t.author).filter(Boolean));

  const handleBookClick = useCallback((title: string) => {
    const transmission = transmissions.find(t => t.title === title);
    if (transmission) {
      setSelectedTransmission(transmission);
    }
  }, [transmissions]);

  const handleAuthorClick = useCallback(async (authorName: string) => {
    try {
      const author = await getAuthorByName(authorName);
      if (author) {
        setSelectedAuthor(author);
        setShowAuthorPopup(true);
      } else {
        // Create a minimal author object for display
        const minimalAuthor: ScifiAuthor = {
          id: '',
          name: authorName,
          bio: undefined,
          nationality: undefined,
          notable_works: [],
          birth_year: undefined,
          death_year: undefined,
          needs_enrichment: true,
          enrichment_attempts: 0,
          last_enriched: undefined,
          data_source: undefined,
          data_quality_score: undefined,
          verification_status: undefined,
          wikipedia_url: undefined
        };
        setSelectedAuthor(minimalAuthor);
        setShowAuthorPopup(true);
      }
    } catch (error) {
      console.error('Failed to fetch author:', error);
    }
  }, []);

  // Custom text renderer to add interactive links to book/author names
  const components: Components = {
    p: ({ children }) => {
      const processText = (text: any): any => {
        if (typeof text !== 'string') return text;
        
        // Find all matching book titles and author names
        const allMatches: { name: string; type: 'book' | 'author'; index: number }[] = [];
        
        bookTitles.forEach(title => {
          if (title && text.includes(title)) {
            let idx = text.indexOf(title);
            while (idx !== -1) {
              allMatches.push({ name: title, type: 'book', index: idx });
              idx = text.indexOf(title, idx + 1);
            }
          }
        });
        
        authorNames.forEach(author => {
          if (author && text.includes(author)) {
            let idx = text.indexOf(author);
            while (idx !== -1) {
              // Check if this position is already covered by a book title
              const isOverlapping = allMatches.some(m => 
                m.type === 'book' && 
                idx >= m.index && 
                idx < m.index + m.name.length
              );
              if (!isOverlapping) {
                allMatches.push({ name: author, type: 'author', index: idx });
              }
              idx = text.indexOf(author, idx + 1);
            }
          }
        });
        
        if (allMatches.length === 0) return text;
        
        // Sort by index
        allMatches.sort((a, b) => a.index - b.index);
        
        // Remove overlapping matches (keep longer ones)
        const filteredMatches: typeof allMatches = [];
        for (const match of allMatches) {
          const isOverlapping = filteredMatches.some(m => 
            (match.index >= m.index && match.index < m.index + m.name.length) ||
            (m.index >= match.index && m.index < match.index + match.name.length)
          );
          if (!isOverlapping) {
            filteredMatches.push(match);
          }
        }
        
        // Build result array
        const result: React.ReactNode[] = [];
        let lastIndex = 0;
        
        filteredMatches.forEach((match, i) => {
          // Add text before match
          if (match.index > lastIndex) {
            result.push(text.substring(lastIndex, match.index));
          }
          
          // Add highlighted name
          result.push(
            <HighlightedName
              key={`${match.type}-${match.name}-${match.index}-${i}`}
              name={match.name}
              type={match.type}
              onClick={() => match.type === 'book' ? handleBookClick(match.name) : handleAuthorClick(match.name)}
            />
          );
          
          lastIndex = match.index + match.name.length;
        });
        
        // Add remaining text
        if (lastIndex < text.length) {
          result.push(text.substring(lastIndex));
        }
        
        return result;
      };

      return (
        <p className="text-slate-300 leading-relaxed mb-4 text-base">
          {Array.isArray(children) 
            ? children.map((child, i) => <span key={i}>{processText(child)}</span>)
            : processText(children)
          }
        </p>
      );
    },
    h1: () => null,
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="text-slate-100 font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-blue-200 italic">{children}</em>
    ),
    ul: ({ children }) => (
      <ul className="my-4 list-disc list-inside">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-slate-300 mb-2">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-4 text-slate-300 italic my-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <>
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown components={components}>
          {narrative}
        </ReactMarkdown>
      </article>

      {/* Book Preview Modal */}
      {selectedTransmission && (
        <BookPreviewModal
          transmission={selectedTransmission}
          onClose={() => setSelectedTransmission(null)}
        />
      )}

      {/* Author Popup */}
      {selectedAuthor && (
        <AuthorPopup
          author={selectedAuthor}
          isVisible={showAuthorPopup}
          onClose={() => {
            setShowAuthorPopup(false);
            setSelectedAuthor(null);
          }}
        />
      )}
    </>
  );
};
