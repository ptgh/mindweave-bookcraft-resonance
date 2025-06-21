
import { useState } from "react";
import { BookOpen, Circle } from "lucide-react";

interface BookCardProps {
  title: string;
  author: string;
  status: "reading" | "read" | "want-to-read";
  tags?: string[];
  coverUrl?: string;
  rating?: {
    shifted?: boolean;
    confirmed?: boolean;
    truth?: boolean;
    dissonant?: boolean;
  };
}

const BookCard = ({ title, author, status, tags = [], coverUrl, rating }: BookCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
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
          
          {rating && (
            <div className="flex items-center space-x-2 mt-2">
              {rating.shifted && (
                <span className="text-xs text-blue-400">Shifted me</span>
              )}
              {rating.truth && (
                <span className="text-xs text-green-400">Felt like truth</span>
              )}
              {rating.dissonant && (
                <span className="text-xs text-orange-400">Dissonant brilliance</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
