import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ReadingNarrative } from '@/components/ReadingNarrative';
import { StandardButton } from '@/components/ui/standard-button';
import { supabase } from '@/integrations/supabase/client';
import { Transmission } from '@/services/transmissionsService';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { gsap } from 'gsap';

interface ReadingInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transmissions: Transmission[];
}

export const ReadingInsightsModal = ({ isOpen, onClose, transmissions }: ReadingInsightsModalProps) => {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const { toast } = useEnhancedToast();
  const haptic = useHapticFeedback();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isDragging = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateNarrative = async (forceRegenerate = false) => {
    if (transmissions.length === 0) {
      setError('No transmissions found. Add some books to generate insights.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userTransmissions = transmissions.map(t => ({
        title: t.title,
        author: t.author,
        tags: t.tags || '',
        notes: t.notes || '',
        publication_year: t.publication_year,
        created_at: t.created_at
      }));

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error: functionError } = await supabase.functions.invoke('ai-reading-narrative', {
        body: {
          userTransmissions,
          timeframe: 'all',
          forceRegenerate
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (functionError) throw functionError;

      if (data?.narrative) {
        setNarrative(data.narrative);
        setGeneratedAt(new Date());
        haptic.notification.success();
        
        if (forceRegenerate) {
          toast({
            title: 'Narrative Regenerated',
            description: 'Your reading insights have been refreshed.',
            variant: 'success'
          });
        }
      } else {
        throw new Error('No narrative received');
      }
    } catch (err: any) {
      console.error('Error generating narrative:', err);
      setError(err.message || 'Failed to generate narrative. Please try again.');
      haptic.notification.error();
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate reading insights.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !narrative && !loading) {
      generateNarrative(false);
    }
  }, [isOpen]);

  // Animate in
  useEffect(() => {
    if (isOpen && overlayRef.current && contentRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 40, scale: 0.97 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const animateClose = useCallback(() => {
    haptic.impact.light();
    if (overlayRef.current && contentRef.current) {
      gsap.to(contentRef.current, { opacity: 0, y: 40, scale: 0.97, duration: 0.25, ease: 'power2.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, onComplete: onClose });
    } else {
      onClose();
    }
  }, [onClose, haptic]);

  // Swipe down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow swipe if scroll is at top
    if (scrollRef.current && scrollRef.current.scrollTop > 5) return;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    if (deltaY > 0 && contentRef.current) {
      // Apply drag transform
      const clamped = Math.min(deltaY * 0.6, 200);
      contentRef.current.style.transform = `translateY(${clamped}px) scale(${1 - clamped * 0.0005})`;
      contentRef.current.style.opacity = `${1 - clamped * 0.003}`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    if (deltaY > 80) {
      // Dismiss
      animateClose();
    } else if (contentRef.current) {
      // Snap back
      gsap.to(contentRef.current, { 
        y: 0, scale: 1, opacity: 1, 
        duration: 0.3, ease: 'power2.out',
        clearProps: 'transform,opacity' 
      });
    }
  }, [animateClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={animateClose}
    >
      <div className="absolute inset-0 bg-slate-900/95" />
      
      <div
        ref={contentRef}
        className="relative w-full max-w-4xl h-[85vh] max-h-[85vh] bg-slate-800/95 border border-slate-700 text-slate-200 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header with proper X placement */}
        <div className="relative px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3 pr-10">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <h2 className="text-xl font-light text-slate-200">
              Reading Narrative
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400 pr-4">
              Traverse the cosmos of your curated constellation to reveal patterns in your speculative fiction journey
            </p>
            <StandardButton
              onClick={() => {
                haptic.impact.medium();
                generateNarrative(true);
              }}
              variant="standard"
              size="sm"
              disabled={loading}
              className="inline-flex items-center gap-1 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </StandardButton>
          </div>

          {/* Close button - standard top-right position */}
          <button
            onClick={animateClose}
            className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 pt-4 px-6 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
              </div>
              <p className="text-slate-400 text-sm">Analyzing your reading patterns...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-500" />
              </div>
              <h3 className="text-red-400 text-lg mb-2">Generation Error</h3>
              <p className="text-slate-400 mb-4">{error}</p>
              <StandardButton onClick={() => generateNarrative(false)} variant="standard">
                Try Again
              </StandardButton>
            </div>
          )}

          {narrative && !loading && !error && (
            <ReadingNarrative narrative={narrative} transmissions={transmissions} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};