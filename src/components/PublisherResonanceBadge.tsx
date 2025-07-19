
import { Building } from "lucide-react";

interface PublisherResonanceBadgeProps {
  series: {
    id: string;
    name: string;
    publisher: string;
    description: string;
    logo_url?: string;
    badge_emoji: string;
  };
  size?: "sm" | "md";
  className?: string;
}

const PublisherResonanceBadge = ({ series, size = "sm", className = "" }: PublisherResonanceBadgeProps) => {
  const isPenguin = series.name.toLowerCase().includes('penguin');
  const penguinEmoji = '🐧';
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`
        inline-flex items-center border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg
        ${size === "sm" ? "text-xs px-2 py-1 space-x-1" : "text-sm px-3 py-1.5 space-x-2"}
      `}>
        <span className={`${size === "sm" ? "text-base" : "text-lg"}`}>
          {isPenguin ? penguinEmoji : series.badge_emoji}
        </span>
        <span className="text-primary font-medium truncate">{series.name}</span>
      </div>
    </div>
  );
};

export default PublisherResonanceBadge;
