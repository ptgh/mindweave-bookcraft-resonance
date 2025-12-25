
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, X, ExternalLink, CheckCircle, Clock, AlertTriangle, RefreshCw, Network } from 'lucide-react';
import { ScifiAuthor } from '@/services/scifiAuthorsService';
import { supabase } from '@/integrations/supabase/client';
import { queueAuthorForEnrichment, triggerEnrichmentJob, checkEnrichmentStatus } from '@/services/authorEnrichmentService';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { AuthorRelationshipModal } from './AuthorRelationshipModal';
import EnhancedBookPreviewModal from './EnhancedBookPreviewModal';
import { EnrichedPublisherBook } from '@/services/publisherService';

interface AuthorPopupProps {
  author: ScifiAuthor | null;
  isVisible: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
  onAuthorUpdate?: (updatedAuthor: ScifiAuthor) => void;
}

export const AuthorPopup: React.FC<AuthorPopupProps> = ({
  author,
  isVisible,
  onClose,
  triggerRef,
  onAuthorUpdate
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentAuthor, setCurrentAuthor] = useState<ScifiAuthor | null>(author);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<string>('');
  const [fallbackWorks, setFallbackWorks] = useState<string[]>([]);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<EnrichedPublisherBook | null>(null);
  const [showAllWorks, setShowAllWorks] = useState(false);
  const { toast } = useEnhancedToast();

  // Update current author when prop changes
  useEffect(() => {
    setCurrentAuthor(author);
  }, [author]);

  // Set up real-time subscription for author updates
  useEffect(() => {
    if (!currentAuthor?.id) return;

    const channel = supabase
      .channel('author-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scifi_authors',
          filter: `id=eq.${currentAuthor.id}`
        },
        (payload) => {
          console.log('Author updated via realtime:', payload);
          const updatedAuthor = payload.new as ScifiAuthor;
          setCurrentAuthor(updatedAuthor);
          onAuthorUpdate?.(updatedAuthor);
          
          // Stop enriching animation if data quality improved
          if (updatedAuthor.data_quality_score && updatedAuthor.data_quality_score >= 50) {
            setIsEnriching(false);
            setEnrichmentStatus('completed');
            toast({
              title: "Enrichment Complete",
              description: "Author data has been successfully updated.",
              variant: "success"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAuthor?.id, onAuthorUpdate]);
  
  // Load fallback notable works from transmissions if needed
  useEffect(() => {
    const loadFallback = async () => {
      if (!currentAuthor?.id) return;
      const hasWorks = currentAuthor?.notable_works && currentAuthor.notable_works.length > 0;
      if (hasWorks) {
        setFallbackWorks([]);
        return;
      }
      try {
        const { data } = await supabase
          .from('transmissions')
          .select('title')
          .ilike('author', `%${currentAuthor.name}%`)
          .limit(5);
        const titles = Array.from(new Set((data || []).map((d: any) => d.title).filter(Boolean)));
        setFallbackWorks(titles as string[]);
      } catch (e) {
        console.warn('Failed loading fallback works:', e);
      }
    };
    loadFallback();
  }, [currentAuthor?.id, currentAuthor?.name, currentAuthor?.notable_works]);

  // GSAP animation for popup
  useEffect(() => {
    if (!popupRef.current || !overlayRef.current || !contentRef.current) return;

    if (isVisible && currentAuthor) {
      console.log('Showing author popup for:', currentAuthor.name);
      
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
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.9,
          opacity: 0,
          y: 30,
          duration: 0.2,
          ease: "power2.in"
        });
      }
      
      if (overlayRef.current) {
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
    }
  }, [isVisible, currentAuthor]);

  if (!currentAuthor) {
    return null;
  }

  const formatLifespan = () => {
    if (currentAuthor.birth_year && currentAuthor.death_year) {
      return `${currentAuthor.birth_year} - ${currentAuthor.death_year}`;
    } else if (currentAuthor.birth_year) {
      return `Born ${currentAuthor.birth_year}`;
    }
    return null;
  };

  const getDataQualityBadge = () => {
    const score = currentAuthor.data_quality_score || 0;
    const hasWiki = !!currentAuthor.wikipedia_url;
    const hasNotableWorks = currentAuthor.notable_works && currentAuthor.notable_works.length > 0;
    const hasBio = !!currentAuthor.bio;
    
    // Consider data complete only if score is high AND key fields exist
    if (score >= 80 && hasWiki && hasNotableWorks && hasBio) {
      return <Badge variant="default" className="text-xs bg-green-500/20 text-green-300 border-green-400/30"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
    } else if (isEnriching) {
      return <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing...</Badge>;
    } else if (hasBio || score >= 30) {
      return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-400/30 cursor-pointer hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Enrich Data</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30 cursor-pointer hover:bg-blue-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Enrich Data</Badge>;
    }
  };

  const handleEnrichment = async () => {
    if (isEnriching) return;
    
    console.log('Starting enrichment for author:', currentAuthor.name);
    setIsEnriching(true);
    setEnrichmentStatus('queuing');
    
    toast({
      title: "Starting Enrichment",
      description: "Gathering author data from multiple sources...",
    });
    
    try {
      // First queue the author for enrichment
      await queueAuthorForEnrichment(currentAuthor.id);
      setEnrichmentStatus('queued');
      
      // Trigger enrichment immediately and keep re-triggering
      let triggerCount = 0;
      const maxTriggers = 12;
      
      const triggerJob = async () => {
        if (triggerCount >= maxTriggers) return;
        triggerCount++;
        console.log(`Triggering enrichment job (attempt ${triggerCount})...`);
        try {
          await triggerEnrichmentJob(currentAuthor.id);
          setEnrichmentStatus('processing');
        } catch (e) {
          console.error('Trigger error:', e);
        }
      };

      // Initial trigger
      await triggerJob();

      // Check status every 1.5 seconds (faster polling)
      let elapsed = 0;
      const checkInterval = setInterval(async () => {
        try {
          const status = await checkEnrichmentStatus(currentAuthor.id);
          console.log('Enrichment status check:', status?.status);
          
          if (status?.status === 'completed') {
            clearInterval(checkInterval);
            setIsEnriching(false);
            setEnrichmentStatus('completed');
            
            // Force immediate DB refresh
            const { data: refreshedAuthor } = await supabase
              .from('scifi_authors')
              .select('*')
              .eq('id', currentAuthor.id)
              .single();
            
            if (refreshedAuthor) {
              setCurrentAuthor(refreshedAuthor as ScifiAuthor);
              onAuthorUpdate?.(refreshedAuthor as ScifiAuthor);
            }
            
            toast({
              title: "Enrichment Complete",
              description: "Author data successfully updated!",
              variant: "success"
            });
          } else if (status?.status === 'failed') {
            clearInterval(checkInterval);
            setIsEnriching(false);
            setEnrichmentStatus('failed');
            console.error('Enrichment failed:', status.error_message);
            toast({
              title: "Enrichment Failed",
              description: "Unable to gather author data. Please try again.",
              variant: "destructive",
            });
          } else {
            // Still pending/processing: nudge the worker every 6s
            elapsed += 1.5;
            if (elapsed % 6 === 0) {
              await triggerJob();
            }
          }
        } catch (error) {
          console.error('Error checking enrichment status:', error);
        }
      }, 1500);
      
      // Stop checking after 30 seconds and reset state
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsEnriching(false);
        setEnrichmentStatus('');
        
        toast({
          title: "Still Processing",
          description: "Enrichment is taking longer than usual. Data will update when complete.",
          variant: "default"
        });
      }, 30000);
      
    } catch (error) {
      console.error('Failed to trigger enrichment:', error);
      setIsEnriching(false);
      setEnrichmentStatus('error');
      toast({
        title: "Error",
        description: "Failed to start enrichment process.",
        variant: "destructive",
      });
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
        className="relative w-full max-w-md bg-slate-900/95 border-slate-700 shadow-2xl backdrop-blur-md overflow-hidden"
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-100">
                  {currentAuthor.name}
                </h3>
                <div onClick={handleEnrichment} className="cursor-pointer">
                  {getDataQualityBadge()}
                </div>
              </div>
              {formatLifespan() && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-3 h-3" />
                  <span>{formatLifespan()}</span>
                </div>
              )}
              {currentAuthor.nationality && (
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  {currentAuthor.nationality}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 max-h-48 overflow-y-auto scrollbar-hide">
            {currentAuthor.bio ? (
              <p className="text-sm text-slate-200 leading-relaxed">
                {currentAuthor.bio}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-400 italic">
                  {isEnriching 
                    ? `Gathering biographical information... (${enrichmentStatus})` 
                    : "Click 'Enrich Data' to gather biographical information."
                  }
                </p>
                {isEnriching && (
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Searching multiple sources via Gemini AI...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notable Works */}
          {(() => {
            // Filter out invalid notable work entries
            const invalidWorkPatterns = [
              'none found', 'not found', 'n/a', 'unknown', 'no works', 'no data',
              'no notable works', 'unavailable', 'no information'
            ];
            
            const isValidWork = (work: string): boolean => {
              if (!work || typeof work !== 'string') return false;
              const trimmed = work.trim().toLowerCase();
              if (trimmed.length < 2) return false;
              return !invalidWorkPatterns.some(pattern => trimmed === pattern || trimmed.includes(pattern));
            };
            
            const rawWorks = currentAuthor.notable_works && currentAuthor.notable_works.length > 0 
              ? currentAuthor.notable_works 
              : fallbackWorks;
            const validWorks = rawWorks.filter(isValidWork);
            
            if (validWorks.length === 0) return null;
            
            return (
              <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Notable Works</span>
                </div>
                <div className="flex flex-col">
                  {validWorks
                    .slice(0, showAllWorks ? validWorks.length : 4)
                    .map((work, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const bookPreview: EnrichedPublisherBook = {
                            id: `notable-${index}`,
                            title: work,
                            author: currentAuthor.name,
                            series_id: '',
                            created_at: new Date().toISOString(),
                          };
                          setSelectedWork(bookPreview);
                        }}
                        className="text-sm text-slate-300 hover:text-blue-300 transition-colors text-left w-full group relative leading-tight"
                      >
                        <span className="relative">
                          • {work}
                          <span className="absolute bottom-0 left-2 w-0 h-0.5 bg-blue-400 group-hover:w-[calc(100%-8px)] transition-all duration-300 ease-out" />
                        </span>
                      </button>
                    ))}
                  {validWorks.length > 4 && !showAllWorks && (
                    <button
                      onClick={() => setShowAllWorks(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 italic transition-colors"
                    >
                      ...and {validWorks.length - 4} more works
                    </button>
                  )}
                  {showAllWorks && validWorks.length > 4 && (
                    <button
                      onClick={() => setShowAllWorks(false)}
                      className="text-sm text-slate-400 hover:text-slate-300 italic transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Data Source Info */}
          {currentAuthor.data_source && (
            <div className="text-xs text-slate-400 border-t border-slate-700/50 pt-3">
              <div className="flex items-center justify-between">
                <span>Source: {(() => {
                  const source = currentAuthor.data_source?.toLowerCase() || 'unknown';
                  if (source.includes('transmission') || source.includes('auto')) return 'Library';
                  if (source.includes('wikipedia')) return 'Wikipedia';
                  if (source.includes('manual')) return 'Manual Entry';
                  if (source.includes('ai') || source.includes('gemini')) return 'AI Analysis';
                  return 'Archive';
                })()}</span>
                {currentAuthor.last_enriched && (
                  <span>Updated: {new Date(currentAuthor.last_enriched).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-purple-500/10 border-purple-400/30 text-purple-300 hover:bg-purple-500/20 transition-all duration-300"
              onClick={() => setIsRelationshipModalOpen(true)}
            >
              <Network className="w-4 h-4 mr-2" />
              Analyze Relationships
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 transition-all duration-300"
              onClick={() => {
                // Priority 1: Use stored Wikipedia URL if it looks valid
                if (currentAuthor.wikipedia_url && currentAuthor.wikipedia_url.includes('wikipedia.org')) {
                  window.open(currentAuthor.wikipedia_url, '_blank');
                  return;
                }
                // Priority 2: Use Wikipedia search (always works - redirects to article if found or shows search results)
                const searchQuery = `${currentAuthor.name} science fiction author`;
                const wikiSearchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(searchQuery)}`;
                window.open(wikiSearchUrl, '_blank');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentAuthor && (
        <AuthorRelationshipModal
          isOpen={isRelationshipModalOpen}
          onClose={() => setIsRelationshipModalOpen(false)}
          author={currentAuthor}
        />
      )}

      {selectedWork && (
        <EnhancedBookPreviewModal
          book={selectedWork}
          onClose={() => setSelectedWork(null)}
          onAddBook={() => {
            setSelectedWork(null);
            toast({
              title: "Book Added",
              description: `"${selectedWork.title}" has been noted.`,
            });
          }}
        />
      )}
    </div>
  );
};
