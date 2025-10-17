
import { useState, useEffect, useRef } from "react";
import { Edit, Archive, X } from "lucide-react";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import PenguinPublisherBadge from "./PenguinPublisherBadge";
import EnhancedBookCover from "./EnhancedBookCover";
import FreeEbookDownloadIcon from "./FreeEbookDownloadIcon";
import AppleBooksLink from "./AppleBooksLink";
import GoogleBooksLink from "./GoogleBooksLink";
import { searchAppleBooks } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { searchFreeEbooks } from "@/services/freeEbookService";
import { updateTransmission } from "@/services/transmissionsService";
import { ConceptualBridge } from "@/services/patternRecognition";
import { filterConceptualTags } from "@/constants/conceptualTags";

interface BookCardProps {
  id: number;
  title: string;
  author: string;
  status: "reading" | "read" | "want-to-read";
  tags?: string[];
  coverUrl?: string;
  rating?: {
    truth?: boolean;
    confirmed?: boolean;
    disrupted?: boolean;
    rewired?: boolean;
  };
  publisher_series?: {
    id: string;
    name: string;
    publisher: string;
    description: string;
    logo_url?: string;
    badge_emoji: string;
  };
  isbn?: string;
  apple_link?: string;
  open_count?: number;
  is_favorite?: boolean;
  onEdit?: () => void;
  onKeep?: () => void;
  onDiscard?: () => void;
  onAuthorClick?: (authorName: string) => void;
  bridges?: ConceptualBridge[];
  publicationYear?: number;
}

const BookCard = ({ 
  id, 
  title, 
  author, 
  status, 
  tags = [], 
  coverUrl, 
  rating,
  publisher_series,
  isbn,
  apple_link,
  open_count,
  is_favorite = false,
  onEdit,
  onKeep,
  onDiscard,
  onAuthorClick,
  bridges = [],
  publicationYear
}: BookCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [hasFreeEbook, setHasFreeEbook] = useState(false);
  const [appleUrl, setAppleUrl] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reading":
        return "border-blue-400 bg-blue-400/10";
      case "read":
        return "border-green-400 bg-green-400/10";
      case "want-to-read":
        return "border-slate-500 bg-slate-500/10";
      default:
        return "border-slate-500 bg-slate-500/10";
    }
  };

  const getResonanceLabels = () => {
    if (!rating) return [];
    
    const labels = [];
    if (rating.truth) labels.push({ text: "Felt like truth", color: "text-green-400" });
    if (rating.confirmed) labels.push({ text: "Confirmed a knowing", color: "text-blue-400" });
    if (rating.disrupted) labels.push({ text: "Disrupted my thinking", color: "text-orange-400" });
    if (rating.rewired) labels.push({ text: "Rewired my perspective", color: "text-purple-400" });
    
    return labels;
  };

  const resonanceLabels = getResonanceLabels();

  // Check if this is a Penguin book based on various indicators
  const isPenguinBook = publisher_series?.name.toLowerCase().includes('penguin') || 
                        title.toLowerCase().includes('penguin') ||
                        author.toLowerCase().includes('penguin');

  useEffect(() => {
    let cancelled = false;
    const fetchApple = async () => {
      if (apple_link) return; // use persisted link if available
      try {
        const result = await searchAppleBooks(title, author, isbn);
        if (!cancelled && result?.storeUrl) {
          setAppleUrl(result.storeUrl);
          
          // Persist found Apple Books link to database
          console.log(`💾 Persisting Apple Books link for "${title}"`);
          try {
            await updateTransmission(id, { apple_link: result.storeUrl });
          } catch (updateError) {
            console.error('Failed to persist Apple Books link:', updateError);
          }
        }
      } catch (_) {
        // silent fail
      }
    };
    fetchApple();
    return () => { cancelled = true; };
  }, [apple_link, title, author, isbn, id]);

  // Fetch Google Books link
  useEffect(() => {
    let cancelled = false;
    const fetchGoogle = async () => {
      try {
        const results = await searchGoogleBooks(`${title} ${author}`, 1);
        if (!cancelled && results.length > 0) {
          const googleLink = results[0].previewLink || results[0].infoLink;
          if (googleLink) {
            setGoogleUrl(googleLink);
          }
        }
      } catch (_) {
        // silent fail
      }
    };
    fetchGoogle();
    return () => { cancelled = true; };
  }, [title, author]);

  // Observe when card becomes visible, then check free-ebook availability once
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isInView) return;
    (async () => {
      try {
        const result = await searchFreeEbooks(title, author, isbn);
        if (!cancelled) setHasFreeEbook(!!result?.hasLinks);
      } catch (e) {
        console.warn('Free ebook check failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isInView, title, author, isbn]);

  return (
    <div 
      ref={rootRef} 
      className={`bg-slate-900/60 backdrop-blur-lg border rounded-lg p-4 shadow-2xl shadow-slate-900/20 transition-all h-full flex flex-col ${
        is_favorite ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-slate-700/30'
      }`}
    >
      <div className="flex items-start space-x-4 flex-1 mb-4">
        <EnhancedBookCover
          title={title}
          author={author}
          isbn={isbn}
          coverUrl={coverUrl}
          className="w-12 h-16 flex-shrink-0"
          lazy={false}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-200 font-medium text-sm leading-tight line-clamp-2 mb-1">
                {title}
              </h3>
              {onAuthorClick ? (
                <button
                  onClick={() => onAuthorClick(author)}
                  className="author-name-hover text-slate-400 text-xs mb-1 text-left relative group"
                  style={{ 
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgb(148, 163, 184)';
                  }}
                >
                  <span className="relative">
                    {author}
                    <span 
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 ease-out"
                      style={{ transformOrigin: 'left' }}
                    />
                  </span>
                </button>
              ) : (
                <p className="text-slate-400 text-xs mb-1">{author}</p>
              )}
              {open_count && open_count > 0 && (
                <p className="text-slate-500 text-xs">Opened {open_count} time{open_count !== 1 ? 's' : ''}</p>
              )}
            </div>
            <div className={`w-3 h-3 rounded-full border-2 ${getStatusColor(status)} flex-shrink-0`}>
              {status === "reading" && (
                <div className="w-full h-full rounded-full bg-blue-400 animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Publisher Badge - More prominent display */}
          {publisher_series && (
            <div className="mt-2">
              <PublisherResonanceBadge series={publisher_series} size="md" />
            </div>
          )}
          
          {(() => {
            const conceptualTags = filterConceptualTags(tags);
            return conceptualTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {conceptualTags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-slate-700/40 border border-slate-600/40 text-slate-300 text-[10px] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {conceptualTags.length > 2 && (
                  <span className="text-slate-400 text-[10px] px-2 py-0.5">
                    +{conceptualTags.length - 2}
                  </span>
                )}
              </div>
            );
          })()}
          
          {/* Pattern Recognition Badges - Subtle Intelligence */}
          
          {resonanceLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resonanceLabels.map((label, index) => (
                <span
                  key={index}
                  className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-700/30 border border-slate-600/40 ${label.color}`}
                >
                  {label.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      

      {/* External links - subtle row above action buttons */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/30">
        <AppleBooksLink 
          appleLink={apple_link || appleUrl || ''} 
          title={title}
        />
        <GoogleBooksLink
          googleLink={googleUrl || ''}
          title={title}
        />
        {/* Internet Archive / Gutenberg icon handles availability internally */}
        <FreeEbookDownloadIcon 
          title={title} 
          author={author} 
          isbn={isbn}
          className="flex-shrink-0"
        />
      </div>
      
      {/* Action buttons - moved to bottom horizontal layout */}
      <div className="grid grid-cols-3 gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-slate-700/40 text-slate-300 text-[10px] rounded-lg transition-all duration-300 ease-in-out hover:border-cyan-400/60 hover:text-cyan-300"
            title="Edit"
          >
            <Edit className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Edit</span>
          </button>
        )}
              {onKeep && (
                <button
                  onClick={onKeep}
                  className={`flex items-center justify-center px-3 py-1.5 bg-transparent border text-[10px] rounded-lg transition-all duration-300 ease-in-out ${
                    is_favorite 
                      ? 'border-cyan-400/80 bg-cyan-400/20 text-cyan-300' 
                      : 'border-slate-700/40 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300'
                  }`}
                  title={is_favorite ? "Marked as Kept" : "Keep"}
                >
                  <Archive className={`w-3 h-3 mr-1.5 flex-shrink-0 ${is_favorite ? 'fill-cyan-400/50' : ''}`} />
                  <span className="whitespace-nowrap">
                    {is_favorite ? "Kept" : "Keep"}
                  </span>
                </button>
              )}
        {onDiscard && (
          <button
            onClick={onDiscard}
            className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-slate-700/40 text-slate-300 text-[10px] rounded-lg transition-all duration-300 ease-in-out hover:border-cyan-400/60 hover:text-cyan-300"
            title="Discard"
          >
            <X className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Discard</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
