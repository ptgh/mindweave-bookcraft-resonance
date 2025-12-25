import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, BookOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EbookSearchResult } from "@/services/freeEbookService";
import { gsap } from "gsap";
import { Badge } from "@/components/ui/badge";

interface FreeEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  ebookData: EbookSearchResult | null;
  isLoading?: boolean;
}

const FreeEbookModal = ({ isOpen, onClose, title, author, ebookData, isLoading = false }: FreeEbookModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getAvailableFormats = (formats?: Record<string, string>) => {
    if (!formats) return [];
    const formatNames = Object.keys(formats);
    return formatNames.map(format => {
      if (format.includes('epub')) return 'EPUB';
      if (format.includes('pdf')) return 'PDF';
      if (format.includes('txt')) return 'TXT';
      return format.toUpperCase();
    }).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        hideCloseButton
        className="max-w-xs bg-slate-900 border-0 text-slate-200 p-5 pt-5 overflow-visible data-[state=open]:bg-slate-900"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-400">Searching for free ebooks...</p>
          </div>
        ) : !ebookData?.hasLinks ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <BookOpen className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-400 text-center">No free ebooks found for this title</p>
          </div>
        ) : (
          <>
            {/* Internet Archive - flat styling, no nested card */}
            {ebookData.archive && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/10 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-200">Internet Archive</h4>
                    <p className="text-xs text-slate-400">Public domain digital library</p>
                  </div>
                </div>
                <button
                  onClick={() => openInNewTab(ebookData.archive.url)}
                  className="w-full px-4 py-3 bg-transparent border border-[rgba(34,197,94,0.3)] text-green-400 text-sm rounded-lg transition-all duration-300 ease-in-out hover:border-green-400 hover:bg-green-400/10 min-h-[44px]"
                  title="View on Internet Archive"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5 inline" />
                  <span>View</span>
                </button>
              </div>
            )}

            {/* Project Gutenberg if Archive not available - flat styling */}
            {ebookData.gutenberg && !ebookData.archive && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border-2 border-green-400 bg-green-400/10 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-200">Project Gutenberg</h4>
                    <p className="text-xs text-slate-400">World's oldest digital library</p>
                  </div>
                </div>
                <button
                  onClick={() => openInNewTab(ebookData.gutenberg.url)}
                  className="w-full px-4 py-3 bg-transparent border border-[rgba(34,197,94,0.3)] text-green-400 text-sm rounded-lg transition-all duration-300 ease-in-out hover:border-green-400 hover:bg-green-400/10 min-h-[44px]"
                  title="View on Project Gutenberg"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5 inline" />
                  <span>View</span>
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FreeEbookModal;