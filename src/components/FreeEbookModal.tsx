import { useEffect, useRef } from "react";
import { X, ExternalLink, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EbookSearchResult } from "@/services/freeEbookService";
import { gsap } from "gsap";

interface FreeEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  ebookData: EbookSearchResult | null;
}

const FreeEbookModal = ({ isOpen, onClose, title, author, ebookData }: FreeEbookModalProps) => {
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
    // Open in popup window instead of new tab for better UX
    const popup = window.open(url, 'ebookViewer', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!popup) {
      // Fallback to new tab if popup blocked
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };


  const hasAnyEbooks = !!(
    ebookData?.internetArchive?.length || 
    ebookData?.gutenberg?.length
  );

  if (!hasAnyEbooks) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        className="max-w-md bg-slate-900/95 border-slate-700 text-slate-200 p-0"
      >
        {/* Show Internet Archive */}
        {ebookData?.internetArchive && ebookData.internetArchive.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/10" />
              <div>
                <h4 className="font-medium text-slate-200">Internet Archive</h4>
                <p className="text-xs text-slate-400">Public domain digital library</p>
              </div>
            </div>
            <button
              onClick={() => openInNewTab(ebookData.internetArchive![0].formats[0]?.url || '')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300 hover:text-slate-200 transition-colors"
              title="View on Internet Archive"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Internet Archive</span>
            </button>
          </div>
        )}

        {/* Show Project Gutenberg */}
        {ebookData?.gutenberg && ebookData.gutenberg.length > 0 ? (
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-green-400 bg-green-400/10" />
              <div>
                <h4 className="font-medium text-slate-200">Project Gutenberg</h4>
                <p className="text-xs text-slate-400">World's oldest digital library</p>
              </div>
            </div>
            <button
              onClick={() => openInNewTab(ebookData.gutenberg![0].formats[0]?.url || '')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300 hover:text-slate-200 transition-colors"
              title="View on Project Gutenberg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Project Gutenberg</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-slate-500 bg-slate-500/10" />
              <div>
                <h4 className="font-medium text-slate-400">Project Gutenberg</h4>
                <p className="text-xs text-slate-500">Gutenberg unavailable</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default FreeEbookModal;