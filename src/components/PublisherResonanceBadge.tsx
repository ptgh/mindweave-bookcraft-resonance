
import { Building } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo.png";

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
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`
        inline-flex items-center border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg
        ${size === "sm" ? "text-xs px-2 py-1 space-x-1" : "text-sm px-3 py-1.5 space-x-2"}
      `}>
        {isPenguin ? (
          <img 
            src={penguinLogo} 
            alt="Penguin" 
            className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} object-contain`}
          />
        ) : (
          <span className={`${size === "sm" ? "text-base" : "text-lg"}`}>
            {series.badge_emoji}
          </span>
        )}
        <span className="text-primary font-medium truncate">{series.name}</span>
      </div>
    </div>
  );
};

export default PublisherResonanceBadge;
