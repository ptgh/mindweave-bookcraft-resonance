
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
    <div className={`
      inline-flex items-center border border-slate-600/40 bg-slate-700/20 rounded
      ${size === "sm" ? "text-xs px-2 py-0.5 space-x-1" : "text-sm px-3 py-1 space-x-1.5"}
    `}>
      <span className="text-slate-400">•</span>
      <span className="text-slate-300 font-light truncate">{series.name}</span>
    </div>
  );
};

export default PublisherResonanceBadge;
