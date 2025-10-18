import { Circle } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface SignalInFocusProps {
  book: {
    title: string;
    author: string;
    coverUrl?: string;
  };
  onInsightsClick?: () => void;
}

const SignalInFocus = ({ book, onInsightsClick }: SignalInFocusProps) => {
  const iconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(iconRef.current, {
        position: "relative",
      });

      // Blue link hover effect
      gsap.to(iconRef.current, {
        color: "#60a5fa",
        scale: 1.1,
        duration: 0.3,
        paused: true,
        ease: "power2.out",
      });
    }, iconRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => {
    if (!iconRef.current) return;
    gsap.to(iconRef.current, {
      color: "#60a5fa",
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleClick = () => {
    console.log('Signal Detected icon clicked');
    if (onInsightsClick) {
      onInsightsClick();
    } else {
      console.warn('onInsightsClick prop is undefined');
    }
  };

  const handleMouseLeave = () => {
    if (!iconRef.current) return;
    gsap.to(iconRef.current, {
      color: "#93c5fd",
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative z-10 cursor-pointer transition-all duration-300 hover:text-blue-400 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full p-2"
            aria-label="View reading insights"
            type="button"
          >
            <Circle className="w-4 h-4 transition-all duration-300 text-current" />
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
