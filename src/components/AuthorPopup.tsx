import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, X, ExternalLink, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ScifiAuthor } from '@/services/scifiAuthorsService';

interface AuthorPopupProps {
  author: ScifiAuthor | null;
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

  if (!isVisible || !author) {
    return null;
  }

  const formatLifespan = () => {
    if (author.birth_year && author.death_year) {
      return `${author.birth_year} - ${author.death_year}`;
    } else if (author.birth_year) {
      return `Born ${author.birth_year}`;
    }
    return null;
  };

  const getDataQualityBadge = () => {
    const score = author.data_quality_score || 0;
    if (score >= 80) {
      return <Badge variant="default" className="text-xs bg-green-500/20 text-green-300 border-green-400/30"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
    } else if (score >= 50) {
      return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-400/30"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30"><AlertTriangle className="w-3 h-3 mr-1" />Enriching</Badge>;
    }
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-100">
                  {author.name}
                </h3>
                {getDataQualityBadge()}
              </div>
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
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
            {author.bio ? (
              <p className="text-sm text-slate-200 leading-relaxed">
                {author.bio.length > 150 
                  ? `${author.bio.substring(0, 150)}...` 
                  : author.bio
                }
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Biographical information is being enriched. 
                {author.needs_enrichment && " Data collection in progress..."}
              </p>
            )}
          </div>

          {/* Notable Works */}
          {author.notable_works && author.notable_works.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Notable Works</span>
              </div>
              <div className="space-y-1">
                {author.notable_works.slice(0, 4).map((work, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    • {work}
                  </div>
                ))}
                {author.notable_works.length > 4 && (
                  <div className="text-sm text-slate-400 italic">
                    ...and {author.notable_works.length - 4} more works
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Source Info */}
          {author.data_source && (
            <div className="text-xs text-slate-400 border-t pt-2">
              <div className="flex items-center justify-between">
                <span>Source: {author.data_source}</span>
                {author.last_enriched && (
                  <span>Updated: {new Date(author.last_enriched).toLocaleDateString()}</span>
                )}
              </div>
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