
import { useState } from "react";
import { BookOpen, Edit, Archive, X } from "lucide-react";
import PublisherResonanceBadge from "./PublisherResonanceBadge";

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
    <div 
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover rounded" />
          ) : (
            <BookOpen className="w-6 h-6 text-slate-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-200 font-medium text-sm leading-tight">
                {title}
              </h3>
              <p className="text-slate-400 text-xs mt-1">{author}</p>
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
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-slate-400 text-xs px-2 py-1">
                  +{tags.length - 3}
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

      {/* Action buttons */}
      {showActions && (
        <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-slate-300 hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
          {onKeep && (
            <button
              onClick={onKeep}
              className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-slate-300 hover:text-green-400 transition-colors"
              title="Keep"
            >
              <Archive className="w-3 h-3" />
            </button>
          )}
          {onDiscard && (
            <button
              onClick={onDiscard}
              className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-slate-300 hover:text-red-400 transition-colors"
              title="Discard"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookCard;
