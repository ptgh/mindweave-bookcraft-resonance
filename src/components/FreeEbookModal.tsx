import { useEffect, useRef } from "react";
import { X, ExternalLink, Archive, Book, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EbookSearchResult } from "@/services/freeEbookService";
import { gsap } from "gsap";

interface FreeEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  ebookData: EbookSearchResult | null;
  appleBookLink?: string;
}

const FreeEbookModal = ({ isOpen, onClose, title, author, ebookData, appleBookLink }: FreeEbookModalProps) => {
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


  // Always show modal - individual sections will show "Unavailable" if needed

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        className="max-w-md bg-slate-900/95 border-slate-700 text-slate-200 p-6"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-semibold text-slate-200">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">by {author}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Apple Books Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">Apple Books</span>
            </div>
            {appleBookLink ? (
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(appleBookLink, '_blank', 'noopener,noreferrer')}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors text-slate-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm font-medium">View</span>
                </button>
                <button
                  onClick={() => window.open(appleBookLink, '_blank', 'noopener,noreferrer')}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white"
                >
                  <span className="text-sm font-medium">Buy on Apple Books</span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full p-3 bg-slate-700/20 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                Unavailable
              </button>
            )}
          </div>

          {/* Internet Archive Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Archive className="w-5 h-5" />
              <span className="font-medium">Internet Archive</span>
              <span className="text-xs text-slate-500">Public domain digital library</span>
            </div>
            {ebookData?.internetArchive && ebookData.internetArchive.length > 0 ? (
              <button
                onClick={() => {
                  const url = ebookData.internetArchive?.[0]?.formats?.[0]?.url;
                  console.log('Internet Archive URL:', url);
                  if (url) {
                    openInNewTab(url);
                  } else {
                    console.error('No valid Internet Archive URL found');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors text-slate-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">View</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full p-3 bg-slate-700/20 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                Unavailable
              </button>
            )}
          </div>

          {/* Project Gutenberg Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Book className="w-5 h-5" />
              <span className="font-medium">Project Gutenberg</span>
              <span className="text-xs text-slate-500">Free classic literature</span>
            </div>
            {ebookData?.gutenberg && ebookData.gutenberg.length > 0 ? (
              <button
                onClick={() => {
                  const url = ebookData.gutenberg?.[0]?.formats?.[0]?.url;
                  console.log('Gutenberg URL:', url);
                  if (url) {
                    openInNewTab(url);
                  } else {
                    console.error('No valid Gutenberg URL found');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors text-slate-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">View</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full p-3 bg-slate-700/20 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                Unavailable
              </button>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300"
            >
              <span className="text-sm">Add to Library</span>
            </button>
          </div>
        </div>

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