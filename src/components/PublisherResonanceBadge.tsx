
import { useNavigate } from "react-router-dom";
import { Building, Zap, Bot } from "lucide-react";

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

  const getIcon = () => {
    if (series.name.toLowerCase().includes('gollancz')) return Zap;
    if (series.name.toLowerCase().includes('robot')) return Bot;
    return Building;
  };
  
  const Icon = getIcon();
  const bgColor = 'bg-gradient-to-r from-primary/10 to-primary/20';
  const borderColor = 'border-slate-600/40';
  const textColor = 'text-primary';

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center border ${borderColor} ${bgColor} rounded cursor-pointer transition-all duration-200
        ${size === "sm" ? "text-xs px-2 py-0.5 space-x-1" : "text-sm px-3 py-1 space-x-1.5"}
        hover:from-primary/20 hover:to-primary/30 hover:border-primary/50
      `}
      title={`View ${series.name} collection`}
    >
      <Icon className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} text-primary`} />
      <span className={`${textColor} font-light truncate`}>{series.name}</span>
    </button>
  );
};

export default PublisherResonanceBadge;
