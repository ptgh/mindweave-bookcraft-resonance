
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";

interface GSAPNotificationProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const GSAPNotification = ({ isVisible, title, message, onClose }: GSAPNotificationProps) => {
  const notificationRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationRef.current || !backdropRef.current) return;

    if (isVisible) {
      // Show animation
      gsap.set([backdropRef.current, notificationRef.current], { 
        display: "flex" 
      });
      
      gsap.fromTo(backdropRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      
      gsap.fromTo(notificationRef.current,
        { 
          opacity: 0, 
          scale: 0.8, 
          y: 20 
        },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: "power3.out",
          delay: 0.1 
        }
      );
    } else {
      // Hide animation
      gsap.to(notificationRef.current, {
        opacity: 0,
        scale: 0.9,
        y: -10,
        duration: 0.25,
        ease: "power2.in"
      });
      
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          gsap.set([backdropRef.current, notificationRef.current], { 
            display: "none" 
          });
        }
      });
    }
  }, [isVisible]);

  // Auto close after 3 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none"
      style={{ display: "none" }}
    >
      <div
        ref={notificationRef}
        className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 shadow-xl max-w-sm mx-4 pointer-events-auto"
        style={{ 
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)" 
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-3">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <h4 className="text-slate-200 font-medium text-sm">{title}</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">{message}</p>
          </div>
          
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSAPNotification;
