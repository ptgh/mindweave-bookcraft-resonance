
import { useState } from "react";
import { Edit, Archive, X } from "lucide-react";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import EnhancedBookCover from "./EnhancedBookCover";
import FreeEbookDownloadIcon from "./FreeEbookDownloadIcon";

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
    badge_emoji: string;
  };
  isbn?: string;
  apple_link?: string;
  open_count?: number;
  onEdit?: () => void;
  onKeep?: () => void;
  onDiscard?: () => void;
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
  onEdit,
  onKeep,
  onDiscard
}: BookCardProps) => {
  const [showActions, setShowActions] = useState(false);

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

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors h-full flex flex-col">
      <div className="flex items-start space-x-4 flex-1 mb-4">
        <EnhancedBookCover
          title={title}
          coverUrl={coverUrl}
          className="w-12 h-16 flex-shrink-0"
          lazy={true}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-200 font-medium text-sm leading-tight line-clamp-2 mb-1">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-xs mb-1">{author}</p>
                  {open_count && open_count > 0 && (
                    <p className="text-slate-500 text-xs">Opened {open_count} time{open_count !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <FreeEbookDownloadIcon 
                  title={title} 
                  author={author} 
                  isbn={isbn}
                  className="flex-shrink-0 mt-0.5"
                />
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full border-2 ${getStatusColor(status)} flex-shrink-0`}>
              {status === "reading" && (
                <div className="w-full h-full rounded-full bg-blue-400 animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Publisher Resonance Badge */}
          {publisher_series && (
            <div className="mt-2">
              <PublisherResonanceBadge series={publisher_series} />
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-slate-400 text-xs px-2 py-1">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
          
          {resonanceLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resonanceLabels.map((label, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full bg-slate-700/30 ${label.color}`}
                >
                  {label.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons - only Apple Books */}
      <div className="flex flex-row space-x-2">
        {apple_link && (
          <button
            onClick={() => window.open(apple_link, '_blank', 'noopener,noreferrer')}
            className="flex-1 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa]"
            style={{ boxShadow: "0 0 0px transparent" }}
            title="Apple Books"
          >
            📱 Apple Books
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
