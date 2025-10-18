
import { Circle } from "lucide-react";
import { useRef, useEffect } from "react";
import gsap from "gsap";

interface SignalInFocusProps {
  book: {
    title: string;
    author: string;
    coverUrl?: string;
  };
  onClick?: () => void;
}

const SignalInFocus = ({ book, onClick }: SignalInFocusProps) => {
  const iconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      const icon = iconRef.current;
      
      const handleMouseEnter = () => {
        gsap.to(icon, {
          scale: 1.2,
          color: "#60a5fa",
          duration: 0.3,
          ease: "power2.out"
        });
      };
      
      const handleMouseLeave = () => {
        gsap.to(icon, {
          scale: 1,
          color: "#93c5fd",
          duration: 0.3,
          ease: "power2.out"
        });
      };
      
      icon.addEventListener("mouseenter", handleMouseEnter);
      icon.addEventListener("mouseleave", handleMouseLeave);
      
      return () => {
        icon.removeEventListener("mouseenter", handleMouseEnter);
        icon.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  const handleClick = () => {
    console.log('Signal Detected icon clicked');
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium tracking-wider">
          SIGNAL IN FOCUS
        </h2>
        <div className="flex items-center space-x-2">
          <button
            ref={iconRef}
            onClick={handleClick}
            className="cursor-pointer p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full relative z-10"
            aria-label="View Reading Insights"
            type="button"
          >
            <Circle className="w-4 h-4 text-blue-300" />
          </button>
          <Circle className="w-3 h-3 text-blue-300" />
          <Circle className="w-2 h-2 text-blue-200" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-16 h-20 bg-slate-700 rounded flex items-center justify-center">
          {book.coverUrl ? (
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover rounded" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-slate-200 text-lg font-medium mb-1">
            {book.title}
          </h3>
          <p className="text-slate-400 text-sm">
            {book.author}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignalInFocus;
