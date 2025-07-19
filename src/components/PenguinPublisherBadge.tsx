
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useRef, useEffect } from "react";
import { Building } from "lucide-react";

interface PenguinPublisherBadgeProps {
  seriesName?: string;
  size?: "sm" | "md";
  className?: string;
}

const PenguinPublisherBadge = ({ seriesName = "Penguin Science Fiction", size = "sm", className = "" }: PenguinPublisherBadgeProps) => {
  const navigate = useNavigate();
  const badgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge) return;

    const handleMouseEnter = () => {
      gsap.to(badge, {
        scale: 1.05,
        borderColor: "hsl(217, 91%, 60%)",
        boxShadow: "0 0 12px hsl(217, 91%, 60%, 0.4)",
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(badge, {
        scale: 1,
        borderColor: "rgba(148, 163, 184, 0.4)",
        boxShadow: "0 0 0px transparent",
        duration: 0.3,
        ease: "power2.out"
      });
    };

    badge.addEventListener('mouseenter', handleMouseEnter);
    badge.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      badge.removeEventListener('mouseenter', handleMouseEnter);
      badge.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClick = () => {
    navigate('/publisher-resonance');
  };

  return (
    <button
      ref={badgeRef}
      onClick={handleClick}
      className={`
        inline-flex items-center border border-slate-600/40 bg-gradient-to-r from-primary/10 to-primary/20 rounded cursor-pointer transition-all duration-200
        ${size === "sm" ? "text-xs px-2 py-0.5 space-x-1" : "text-sm px-3 py-1 space-x-1.5"}
        hover:from-primary/20 hover:to-primary/30
        ${className}
      `}
      title={`View ${seriesName} collection`}
    >
      <Building className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} text-primary`} />
      <span className="text-primary font-light truncate">{seriesName}</span>
    </button>
  );
};

export default PenguinPublisherBadge;
