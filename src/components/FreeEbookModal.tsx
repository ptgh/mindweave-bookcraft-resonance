import { useState, useEffect, useRef } from "react";
import { X, Download, ExternalLink, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EbookSearchResult, getPreferredDownloadUrl, downloadFreeEbook } from "@/services/freeEbookService";
import { gsap } from "gsap";

interface FreeEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  ebookData: EbookSearchResult | null;
}

const FreeEbookModal = ({ isOpen, onClose, title, author, ebookData }: FreeEbookModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const handleDownload = async (source: 'gutenberg' | 'archive') => {
    if (!ebookData) return;
    
    setIsDownloading(true);
    try {
      const sourceData = source === 'gutenberg' ? ebookData.gutenberg : ebookData.archive;
      if (!sourceData) return;

      const downloadInfo = getPreferredDownloadUrl(sourceData.formats);
      if (!downloadInfo) {
        throw new Error('No compatible format available');
      }

      // Sanitize filename and ensure proper extension
      const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${cleanTitle}.${downloadInfo.format}`;
      
      console.log(`Attempting download: ${downloadInfo.url}`);
      const success = await downloadFreeEbook(downloadInfo.url, filename, source);
      
      if (success) {
        toast({
          title: "Download initiated",
          description: `${downloadInfo.format.toUpperCase()} copy of "${title}" from ${source === 'gutenberg' ? 'Project Gutenberg' : 'Internet Archive'}.`,
        });
        onClose();
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Transmission link failed",
        description: "Unable to access free copy. Try the external link instead.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!ebookData?.hasLinks) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={contentRef}
        className="max-w-md bg-slate-900/95 border-slate-700 text-slate-200"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-400" />
            Free Download Available
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            "{title}" by {author} is available in the public domain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ebookData.gutenberg && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-200 flex items-center gap-2">
                  📚 Project Gutenberg
                </h4>
                <span className="text-xs text-slate-400">Public Domain</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                High-quality digital editions from the world's oldest digital library
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('gutenberg')}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => openInNewTab(ebookData.gutenberg!.url)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {ebookData.archive && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-200 flex items-center gap-2">
                  🏛️ Internet Archive
                </h4>
                <span className="text-xs text-slate-400">Open Access</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Digitized books from libraries around the world
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('archive')}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => openInNewTab(ebookData.archive!.url)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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