
import { useNavigate } from "react-router-dom";

interface PublisherResonanceBadgeProps {
  series: {
    name: string;
    publisher: string;
    badge_emoji: string;
  };
  size?: "sm" | "md";
}

const PublisherResonanceBadge = ({ series, size = "sm" }: PublisherResonanceBadgeProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/publisher-resonance');
  };

  const isPenguin = series.name.toLowerCase().includes('penguin');
  const bgColor = isPenguin ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/20' : 'bg-slate-700/20';
  const borderColor = isPenguin ? 'border-orange-500/40' : 'border-slate-600/40';
  const textColor = isPenguin ? 'text-orange-300' : 'text-slate-300';

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center border ${borderColor} ${bgColor} rounded cursor-pointer transition-all duration-200
        ${size === "sm" ? "text-xs px-2 py-0.5 space-x-1" : "text-sm px-3 py-1 space-x-1.5"}
        hover:border-opacity-60 hover:bg-opacity-80
      `}
      title={`View ${series.name} collection`}
    >
      <span className={isPenguin ? "text-orange-400" : "text-slate-400"}>{series.badge_emoji}</span>
      <span className={`${textColor} font-light truncate`}>{series.name}</span>
    </button>
  );
};

export default PublisherResonanceBadge;
