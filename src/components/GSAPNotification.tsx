
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 pointer-events-none"
      style={{ display: "none" }}
    >
      <div
        ref={notificationRef}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-all duration-200 pointer-events-auto flex items-center space-x-2 shadow-lg"
        style={{ 
          minWidth: "fit-content",
          maxWidth: "280px"
        }}
      >
        <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium">{title}</span>
          <span className="ml-1 opacity-90">{message}</span>
        </div>
        
        <button
          onClick={onClose}
          className="w-4 h-4 rounded flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/50 transition-all duration-200 flex-shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

export default GSAPNotification;
