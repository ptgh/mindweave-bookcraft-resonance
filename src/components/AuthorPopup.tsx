import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, X, ExternalLink } from 'lucide-react';

interface AuthorInfo {
  name: string;
  bio?: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  notableWorks?: string[];
  totalWorks?: number;
}

interface AuthorPopupProps {
  author: AuthorInfo;
  isVisible: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

export const AuthorPopup: React.FC<AuthorPopupProps> = ({
  author,
  isVisible,
  onClose,
  triggerRef
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popupRef.current || !overlayRef.current || !contentRef.current) return;

    if (isVisible) {
      // Show animation
      gsap.set(popupRef.current, { display: 'flex' });
      
      // Animate overlay
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      // Animate content with scale and position
      gsap.fromTo(contentRef.current,
        { 
          scale: 0.8,
          opacity: 0,
          y: 50
        },
        { 
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
          delay: 0.1
        }
      );
    } else {
      // Hide animation
      gsap.to(contentRef.current, {
        scale: 0.9,
        opacity: 0,
        y: 30,
        duration: 0.2,
        ease: "power2.in"
      });
      
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (popupRef.current) {
            gsap.set(popupRef.current, { display: 'none' });
          }
        }
      });
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const formatLifespan = () => {
    if (author.birthYear && author.deathYear) {
      return `${author.birthYear} - ${author.deathYear}`;
    } else if (author.birthYear) {
      return `Born ${author.birthYear}`;
    }
    return null;
  };

  return (
    <div
      ref={popupRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ display: 'none' }}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <Card
        ref={contentRef}
        className="relative w-full max-w-md bg-slate-800/95 border-slate-600/50 shadow-2xl backdrop-blur-sm overflow-hidden"
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-100 mb-1">
                {author.name}
              </h3>
              {formatLifespan() && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-3 h-3" />
                  <span>{formatLifespan()}</span>
                </div>
              )}
              {author.nationality && (
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  {author.nationality}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {author.bio && (
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
              <p className="text-sm text-slate-200 leading-relaxed">
                {author.bio.length > 150 
                  ? `${author.bio.substring(0, 150)}...` 
                  : author.bio
                }
              </p>
            </div>
          )}

          {/* Notable Works */}
          {author.notableWorks && author.notableWorks.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Notable Works</span>
              </div>
              <div className="space-y-1">
                {author.notableWorks.slice(0, 4).map((work, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    • {work}
                  </div>
                ))}
                {author.notableWorks.length > 4 && (
                  <div className="text-sm text-slate-400 italic">
                    ...and {author.notableWorks.length - 4} more works
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Works Count */}
          {author.totalWorks && (
            <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
              <span className="text-sm text-slate-300">Total Published Works</span>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                {author.totalWorks}
              </Badge>
            </div>
          )}

          {/* External Link */}
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-purple-500/20 border-purple-400/30 text-purple-300 hover:bg-purple-500/30"
            onClick={() => {
              const searchQuery = encodeURIComponent(`${author.name} author biography`);
              window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};