
import { Badge } from "@/components/ui/badge";

interface PublisherResonanceBadgeProps {
  series: {
    name: string;
    publisher: string;
    badge_emoji: string;
  };
  size?: "sm" | "md";
}

const PublisherResonanceBadge = ({ series, size = "sm" }: PublisherResonanceBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={`
        border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 
        ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}
      `}
    >
      <span className="mr-1">{series.badge_emoji}</span>
      <span className="truncate">{series.name}</span>
    </Badge>
  );
};

export default PublisherResonanceBadge;
