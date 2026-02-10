
import { Circle, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CommunityModal } from "./CommunityModal";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface SignalInFocusProps {
  book: {
    title: string;
    author: string;
    coverUrl?: string;
  };
  onClick?: () => void;
  showCommunity?: boolean;
}

const SignalInFocus = ({ book, onClick, showCommunity = true }: SignalInFocusProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const haptic = useHapticFeedback();

  useEffect(() => {
    if (!onClick) return;

    const setupHover = (el: HTMLButtonElement | null) => {
      if (!el) return { cleanup: () => {} };
      const tl = gsap.timeline({ paused: true });
      tl.to(el, {
        scale: 1.15,
        color: '#60a5fa',
        duration: 0.3,
        ease: 'power2.out',
      });
      const enter = () => tl.play();
      const leave = () => tl.reverse();
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      return {
        cleanup: () => {
          el.removeEventListener('mouseenter', enter);
          el.removeEventListener('mouseleave', leave);
        },
      };
    };

    const right = setupHover(buttonRef.current);
    const left = setupHover(leftButtonRef.current);

    return () => {
      right.cleanup();
      left.cleanup();
    };
  }, [onClick]);

  return (
    <>
    <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium tracking-wider">
          SIGNAL IN FOCUS
        </h2>
        <div className="flex items-center space-x-2">
          {showCommunity && (
            <button
              onClick={() => { haptic.selection(); setShowCommunityModal(true); }}
              className="relative z-10 cursor-pointer hover:scale-110 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full p-1 -m-1"
              aria-label="Community"
              title="Explore Community"
            >
              <Users className="w-4 h-4 text-emerald-400" />
            </button>
          )}
          {onClick ? (
            <button
              ref={buttonRef}
              onClick={onClick}
              className="relative z-10 cursor-pointer hover:scale-110 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full p-1 -m-1"
              aria-label="View reading insights"
              title="View reading insights"
            >
              <Circle className="w-4 h-4 text-blue-400 fill-blue-400/20" />
            </button>
          ) : (
            <Circle className="w-4 h-4 text-blue-400" />
          )}
          <Circle className="w-3 h-3 text-blue-300" />
          <Circle className="w-2 h-2 text-blue-200" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {onClick ? (
          <button
            ref={leftButtonRef}
            onClick={onClick}
            type="button"
            className="w-16 h-20 bg-slate-700 rounded flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Open insights"
            title="Open insights"
          >
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
          </button>
        ) : (
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
        )}
        
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
    
    <CommunityModal 
      isOpen={showCommunityModal} 
      onClose={() => setShowCommunityModal(false)} 
    />
    </>
  );
};

export default SignalInFocus;
