
import { Circle } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || !onClick) return;

    const tl = gsap.timeline({ paused: true });
    tl.to(button, { 
      scale: 1.15, 
      duration: 0.3,
      ease: "power2.out"
    });

    const handleMouseEnter = () => tl.play();
    const handleMouseLeave = () => tl.reverse();

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onClick]);

  return (
    <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium tracking-wider">
          SIGNAL IN FOCUS
        </h2>
        <div className="flex items-center space-x-2">
          {onClick ? (
            <button
              ref={buttonRef}
              onClick={onClick}
              className="relative z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full"
              aria-label="View reading insights"
            >
              <Circle className="w-4 h-4 text-blue-400" />
            </button>
          ) : (
            <Circle className="w-4 h-4 text-blue-400" />
          )}
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
